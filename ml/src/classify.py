"""Dish classification via EfficientNet-B0. Recipe lookup happens in the backend, not here."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image
from torchvision import transforms

CHECKPOINT = Path(__file__).resolve().parents[2] / "ml" / "checkpoints" / "best.pt"


def classify_dish(image_path: str) -> tuple[str, float]:
    import torch
    from torchvision.models import efficientnet_b0

    if not CHECKPOINT.exists():
        raise FileNotFoundError(CHECKPOINT)
    payload = torch.load(CHECKPOINT, map_location="cpu", weights_only=False)
    classes = payload["classes"]
    model = efficientnet_b0(weights=None)
    model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, len(classes))
    model.load_state_dict(payload["state_dict"])
    model.eval()
    tf = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    tensor = tf(Image.open(image_path).convert("RGB")).unsqueeze(0)
    with torch.no_grad():
        probs = torch.softmax(model(tensor), dim=1)[0]
        confidence, index = torch.max(probs, dim=0)
    return classes[int(index)], float(confidence)


if __name__ == "__main__":
    print(json.dumps({"checkpoint_exists": CHECKPOINT.exists()}))
