"""Train EfficientNet-B0 on ml/data/processed/innerarc_27. Writes held-out metrics."""

from __future__ import annotations

import json
import random
from collections import defaultdict
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import transforms
from torchvision.models import EfficientNet_B0_Weights, efficientnet_b0

from dataset_utils import SEED, ImageList, evaluate, list_items, stratified_split

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "ml" / "data" / "processed" / "innerarc_27"
CHECKPOINT = ROOT / "ml" / "checkpoints" / "best.pt"
METRICS = ROOT / "ml" / "reports" / "test_metrics.json"
BATCH = 8
EPOCHS = 12
LR = 3e-4


def main() -> None:
    random.seed(SEED)
    torch.manual_seed(SEED)
    classes, items = list_items(DATA)
    if len(classes) != 27:
        raise SystemExit(f"expected 27 classes, found {len(classes)} in {DATA}")
    train_items, val_items, test_items = stratified_split(items)
    train_tf = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.RandomResizedCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(0.2, 0.2, 0.2),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    eval_tf = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    counts = defaultdict(int)
    for _, label in train_items:
        counts[label] += 1
    weights = [1.0 / counts[label] for _, label in train_items]
    sampler = WeightedRandomSampler(
        weights, num_samples=len(train_items), replacement=True
    )
    train_loader = DataLoader(
        ImageList(train_items, train_tf),
        batch_size=BATCH,
        sampler=sampler,
        num_workers=0,
    )
    val_loader = DataLoader(
        ImageList(val_items, eval_tf), batch_size=BATCH, shuffle=False, num_workers=0
    )
    test_loader = DataLoader(
        ImageList(test_items, eval_tf), batch_size=BATCH, shuffle=False, num_workers=0
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(
        f"device={device} train={len(train_items)} val={len(val_items)} test={len(test_items)}",
        flush=True,
    )
    model = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(classes))
    model.to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR)
    criterion = nn.CrossEntropyLoss()
    scaler = torch.amp.GradScaler("cuda", enabled=device.type == "cuda")

    best_val = -1.0
    CHECKPOINT.parent.mkdir(parents=True, exist_ok=True)
    for epoch in range(1, EPOCHS + 1):
        model.train()
        running = 0.0
        seen = 0
        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)
            optimizer.zero_grad(set_to_none=True)
            with torch.amp.autocast("cuda", enabled=device.type == "cuda"):
                logits = model(images)
                loss = criterion(logits, labels)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            running += loss.item() * labels.size(0)
            seen += labels.size(0)
        val_metrics = evaluate(model, val_loader, device, len(classes))
        print(
            f"epoch {epoch}/{EPOCHS} train_loss={running / seen:.4f} "
            f"val_top1={val_metrics['top1']:.4f} val_top3={val_metrics['top3']:.4f}",
            flush=True,
        )
        if val_metrics["top1"] > best_val:
            best_val = val_metrics["top1"]
            torch.save(
                {"classes": classes, "state_dict": model.state_dict()}, CHECKPOINT
            )

    payload = torch.load(CHECKPOINT, map_location=device, weights_only=False)
    model.load_state_dict(payload["state_dict"])
    test_metrics = evaluate(model, test_loader, device, len(classes))
    per_class_named = {
        classes[int(idx)]: acc for idx, acc in test_metrics["per_class_index"].items()
    }
    report = {
        "device": str(device),
        "epochs": EPOCHS,
        "n_classes": len(classes),
        "split": {
            "train": len(train_items),
            "val": len(val_items),
            "test": len(test_items),
        },
        "held_out_top1": test_metrics["top1"],
        "held_out_top3": test_metrics["top3"],
        "per_class_top1": per_class_named,
        "checkpoint": str(CHECKPOINT),
    }
    METRICS.parent.mkdir(parents=True, exist_ok=True)
    METRICS.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
