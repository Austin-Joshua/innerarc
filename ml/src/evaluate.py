"""Evaluate ml/checkpoints/best.pt on the held-out 15% split; write test_metrics.json."""

from __future__ import annotations

import json
import random
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import transforms
from torchvision.models import efficientnet_b0

from dataset_utils import SEED, ImageList, evaluate, list_items, stratified_split

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "ml" / "data" / "processed" / "innerarc_27"
CHECKPOINT = ROOT / "ml" / "checkpoints" / "best.pt"
METRICS = ROOT / "ml" / "reports" / "test_metrics.json"
BATCH = 8


def main() -> None:
    if not CHECKPOINT.exists():
        raise SystemExit(f"missing checkpoint: {CHECKPOINT}")
    random.seed(SEED)
    torch.manual_seed(SEED)
    disk_classes, items = list_items(DATA)
    train_items, val_items, test_items = stratified_split(items)
    eval_tf = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    payload = torch.load(CHECKPOINT, map_location=device, weights_only=False)
    classes = payload["classes"]
    if set(classes) != set(disk_classes):
        raise SystemExit(f"class mismatch checkpoint={classes} disk={disk_classes}")
    model = efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(classes))
    model.load_state_dict(payload["state_dict"])
    model.to(device)
    test_loader = DataLoader(
        ImageList(test_items, eval_tf), batch_size=BATCH, shuffle=False, num_workers=0
    )
    test_metrics = evaluate(model, test_loader, device, len(classes))
    report = {
        "device": str(device),
        "n_classes": len(classes),
        "split": {
            "train": len(train_items),
            "val": len(val_items),
            "test": len(test_items),
        },
        "held_out_top1": test_metrics["top1"],
        "held_out_top3": test_metrics["top3"],
        "per_class_top1": {
            classes[int(idx)]: acc
            for idx, acc in test_metrics["per_class_index"].items()
        },
        "checkpoint": str(CHECKPOINT),
        "note": "Held-out metrics from best.pt (best validation checkpoint during training).",
    }
    METRICS.parent.mkdir(parents=True, exist_ok=True)
    METRICS.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2), flush=True)


if __name__ == "__main__":
    main()
