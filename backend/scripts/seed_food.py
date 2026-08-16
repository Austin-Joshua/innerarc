"""Parse indian_food.csv ingredients and upsert dishes / ingredients / dish_ingredients."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import SessionLocal  # noqa: E402
from app.models.food import Dish, DishIngredient, Ingredient  # noqa: E402

SEED_PATH = Path(__file__).resolve().parents[1] / "seed" / "dishes.json"
CSV_PATH = ROOT / "ml" / "data" / "raw" / "indian_food.csv"


def _norm(name: str) -> str:
    return re.sub(r"\s+", " ", name).strip().lower()


def load_csv_ingredients() -> dict[str, list[str]]:
    import csv

    mapping: dict[str, list[str]] = {}
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Missing {CSV_PATH}")
    with CSV_PATH.open(encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            key = _norm(row["name"])
            parts = [p.strip() for p in row["ingredients"].split(",") if p.strip()]
            mapping[key] = parts
    return mapping


def get_or_create_ingredient(db: Session, name: str) -> Ingredient:
    existing = db.scalar(select(Ingredient).where(Ingredient.name == name))
    if existing:
        return existing
    ingredient = Ingredient(name=name)
    db.add(ingredient)
    db.flush()
    return ingredient


def seed(db: Session) -> None:
    payload = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    csv_ingredients = load_csv_ingredients()
    for dish_row in payload["dishes"]:
        class_name = dish_row["class_name"]
        display_name = dish_row["name"]
        ingredients = dish_row.get("ingredients")
        if dish_row["nutrition_source"] == "ifct_2017":
            csv_key = _norm(display_name)
            csv_key_alt = _norm(class_name.replace("_", " "))
            names = csv_ingredients.get(csv_key) or csv_ingredients.get(csv_key_alt)
            if not names:
                raise KeyError(f"No indian_food.csv ingredients for {display_name!r} / {class_name!r}")
            ingredients = [{"name": n, "typical_quantity": "as prepared"} for n in names]
        if not ingredients:
            raise ValueError(f"No ingredients for {class_name}")

        dish = db.scalar(select(Dish).where(Dish.name == display_name))
        if dish is None:
            dish = Dish(name=display_name)
            db.add(dish)
        dish.cuisine = dish_row["cuisine"]
        dish.nutrition_source = dish_row["nutrition_source"]
        dish.default_serving_g = dish_row["default_serving_g"]
        dish.nutrition_per_100g = dish_row["nutrition_per_100g"]
        db.flush()

        db.execute(delete(DishIngredient).where(DishIngredient.dish_id == dish.id))
        for item in ingredients:
            ingredient = get_or_create_ingredient(db, item["name"])
            db.add(
                DishIngredient(
                    dish_id=dish.id,
                    ingredient_id=ingredient.id,
                    typical_quantity=item["typical_quantity"],
                )
            )
        print(f"seeded {class_name} source={dish.nutrition_source} serving={dish.default_serving_g}g")
    db.commit()


if __name__ == "__main__":
    session = SessionLocal()
    try:
        seed(session)
    finally:
        session.close()
