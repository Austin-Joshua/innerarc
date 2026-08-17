"""Shared dataset loading, splitting, and evaluation logic for train.py and evaluate.py."""

from __future__ import annotations

import random
from collections import defaultdict
from pathlib import Path

import torch
from torch.utils.data import Dataset
from torchvision.datasets.folder import default_loader

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"}
SEED = 42


def list_items(root: Path) -> tuple[list[str], list[tuple[Path, int]]]:
    classes = sorted([p.name for p in root.iterdir() if p.is_dir()])
    class_to_idx = {name: i for i, name in enumerate(classes)}
    items: list[tuple[Path, int]] = []
    for name in classes:
        for path in (root / name).iterdir():
            if path.suffix in IMAGE_EXTS:
                items.append((path, class_to_idx[name]))
    return classes, items


def stratified_split(items: list[tuple[Path, int]], seed: int = SEED):
    rng = random.Random(seed)
    by_class: dict[int, list[tuple[Path, int]]] = defaultdict(list)
    for item in items:
        by_class[item[1]].append(item)
    train, val, test = [], [], []
    for group in by_class.values():
        rng.shuffle(group)
        n = len(group)
        n_train = max(1, int(n * 0.70))
        n_val = max(1, int(n * 0.15))
        if n_train + n_val >= n:
            n_val = max(1, n - n_train - 1) if n > 2 else 0
        train.extend(group[:n_train])
        val.extend(group[n_train : n_train + n_val])
        test.extend(group[n_train + n_val :])
        if not test and group:
            test.append(train.pop())
    return train, val, test


class ImageList(Dataset):
    def __init__(self, items: list[tuple[Path, int]], transform):
        self.items = items
        self.transform = transform

    def __len__(self) -> int:
        return len(self.items)

    def __getitem__(self, index: int):
        path, label = self.items[index]
        return self.transform(default_loader(str(path))), label


def evaluate(model, loader, device, n_classes: int) -> dict:
    model.eval()
    correct1 = correct3 = total = 0
    per_class_correct = [0] * n_classes
    per_class_total = [0] * n_classes
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)
            logits = model(images)
            total += labels.size(0)
            pred1 = logits.argmax(dim=1)
            correct1 += (pred1 == labels).sum().item()
            top3 = logits.topk(k=min(3, n_classes), dim=1).indices
            for i, label in enumerate(labels):
                label_i = int(label)
                per_class_total[label_i] += 1
                if pred1[i] == label:
                    per_class_correct[label_i] += 1
                if label in top3[i]:
                    correct3 += 1
    return {
        "top1": correct1 / total if total else 0.0,
        "top3": correct3 / total if total else 0.0,
        "n": total,
        "per_class_index": {
            str(i): (
                per_class_correct[i] / per_class_total[i]
                if per_class_total[i]
                else None
            )
            for i in range(n_classes)
        },
    }
