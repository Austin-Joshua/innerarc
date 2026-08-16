"""Copy verified class folders into ml/data/processed/innerarc_27 and write curated_dishes.json."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDIAN_ROOT = ROOT / "ml" / "data" / "raw" / "indian_food_images"
FOOD101_IMAGES = ROOT / "ml" / "data" / "raw" / "food-101" / "images"
PROCESSED = ROOT / "ml" / "data" / "processed" / "innerarc_27"
CURATED = ROOT / "ml" / "data" / "curated_dishes.json"
COUNTS = ROOT / "ml" / "reports" / "class_image_counts.json"

INDIAN_CLASSES = [
    "biryani",
    "paneer_butter_masala",
    "dal_tadka",
    "palak_paneer",
    "butter_chicken",
    "chana_masala",
    "dal_makhani",
    "chicken_tikka_masala",
    "naan",
    "jalebi",
    "gulab_jamun",
    "poha",
    "kachori",
    "aloo_gobi",
    "kadai_paneer",
]
FOOD101_CLASSES = [
    "pizza",
    "hamburger",
    "fried_rice",
    "spaghetti_bolognese",
    "caesar_salad",
    "grilled_salmon",
    "omelette",
    "pancakes",
    "sushi",
    "ramen",
    "tacos",
    "samosa",
]
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"}


def count_images(folder: Path) -> int:
    if not folder.is_dir():
        return 0
    return sum(1 for path in folder.iterdir() if path.is_file() and path.suffix in IMAGE_EXTS)


def copy_class(src: Path, dest: Path) -> int:
    n = count_images(src)
    if n == 0:
        raise FileNotFoundError(f"Class folder missing or empty: {src}")
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True, exist_ok=True)
    for path in src.iterdir():
        if path.is_file() and path.suffix in IMAGE_EXTS:
            target = dest / path.name
            try:
                target.hardlink_to(path)
            except OSError:
                shutil.copy2(path, target)
    return n


def main() -> None:
    PROCESSED.mkdir(parents=True, exist_ok=True)
    COUNTS.parent.mkdir(parents=True, exist_ok=True)
    counts: dict[str, dict] = {}
    for name in INDIAN_CLASSES:
        n = copy_class(INDIAN_ROOT / name, PROCESSED / name)
        counts[name] = {"source": "indian_food_images", "images": n}
        print(f"{name}\tindian\t{n}")
    for name in FOOD101_CLASSES:
        n = copy_class(FOOD101_IMAGES / name, PROCESSED / name)
        counts[name] = {"source": "food-101", "images": n}
        print(f"{name}\tfood-101\t{n}")
    classes = FOOD101_CLASSES + INDIAN_CLASSES
    CURATED.write_text(
        json.dumps(
            {
                "version": 2,
                "note": "27 classes verified non-empty on disk before training.",
                "classes": classes,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    COUNTS.write_text(json.dumps(counts, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {CURATED} with {len(classes)} classes")


if __name__ == "__main__":
    main()
