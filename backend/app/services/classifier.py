from __future__ import annotations

import json
import random
from functools import lru_cache
from pathlib import Path

from app.config import settings

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
CLASS_LIST_PATH = (
    Path(__file__).resolve().parents[3] / "ml" / "data" / "curated_dishes.json"
)


def _preprocess():
    from torchvision import transforms

    return transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )


@lru_cache(maxsize=1)
def load_model():
    import torch
    from torchvision.models import efficientnet_b0

    checkpoint_path = Path(settings.classifier_checkpoint)
    if not checkpoint_path.exists():
        return None, []
    payload = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    classes: list[str] = payload["classes"]
    model = efficientnet_b0(weights=None)
    model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, len(classes))
    model.load_state_dict(payload["state_dict"])
    model.eval()
    return model, classes


def classify_image(image_path: str) -> tuple[str, float]:
    # Module 2: training runs separately and checkpoints mid-run, so this stays
    # stubbed (settings.classifier_stub_mode) until the accuracy report lands
    # and someone deliberately flips it — never picked up implicitly just
    # because a best.pt happens to exist on disk.
    if settings.classifier_stub_mode:
        return _stub_prediction()

    import torch
    from PIL import Image

    model, classes = load_model()
    if model is None:
        raise FileNotFoundError("Classifier checkpoint is missing")
    image = Image.open(image_path).convert("RGB")
    tensor = _preprocess()(image).unsqueeze(0)
    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)[0]
        confidence, index = torch.max(probs, dim=0)
    return classes[int(index)], float(confidence)


def _stub_prediction() -> tuple[str, float]:
    classes = curated_classes()
    return random.choice(classes), round(random.uniform(0.55, 0.95), 2)


def curated_classes() -> list[str]:
    data = json.loads(CLASS_LIST_PATH.read_text(encoding="utf-8"))
    return list(data["classes"])
