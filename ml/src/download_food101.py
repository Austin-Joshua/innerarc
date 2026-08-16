"""Download Food-101 via torchvision into ml/data/raw/food-101."""

from pathlib import Path
from torchvision.datasets import Food101

ROOT = Path(__file__).resolve().parents[2] / "ml" / "data" / "raw"
ROOT.mkdir(parents=True, exist_ok=True)
print(f"downloading Food-101 into {ROOT}")
Food101(root=str(ROOT), split="train", download=True)
Food101(root=str(ROOT), split="test", download=True)
print("done", (ROOT / "food-101" / "images").exists())
