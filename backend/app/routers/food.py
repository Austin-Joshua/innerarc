from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.config import settings
from app.db import get_db
from app.models.food import Dish, DishIngredient, FoodLog
from app.models.user import User
from app.rate_limit import limiter
from app.schemas.food import (
    ClassifyResponse,
    DishOut,
    FoodLogCreate,
    FoodLogOut,
    IngredientOut,
    PlateClassifyResponse,
    PlateItemOut,
)
from app.security import get_current_user
from app.services.classifier import classify_image
from app.services.gamification import apply_event, state_dict
from app.services.photo_crypto import write_encrypted
from app.services.plate_vision import (
    identify_plate_items,
    normalize_label,
    serving_from_portion,
)

router = APIRouter(prefix="/food", tags=["food"])
dishes_router = APIRouter(tags=["dishes"])

CLASS_TO_NAME = {
    "pizza": "Pizza",
    "hamburger": "Hamburger",
    "fried_rice": "Fried rice",
    "spaghetti_bolognese": "Spaghetti bolognese",
    "caesar_salad": "Caesar salad",
    "grilled_salmon": "Grilled salmon",
    "omelette": "Omelette",
    "pancakes": "Pancakes",
    "sushi": "Sushi",
    "ramen": "Ramen",
    "tacos": "Tacos",
    "samosa": "Samosa",
    "biryani": "Biryani",
    "paneer_butter_masala": "Paneer butter masala",
    "dal_tadka": "Dal tadka",
    "palak_paneer": "Palak paneer",
    "butter_chicken": "Butter chicken",
    "chana_masala": "Chana masala",
    "dal_makhani": "Dal makhani",
    "chicken_tikka_masala": "Chicken tikka masala",
    "naan": "Naan",
    "jalebi": "Jalebi",
    "gulab_jamun": "Gulab jamun",
    "poha": "Poha",
    "kachori": "Kachori",
    "aloo_gobi": "Aloo gobi",
    "kadai_paneer": "Kadai paneer",
}

NAME_TO_CLASS = {v: k for k, v in CLASS_TO_NAME.items()}


def _dish_out(dish: Dish) -> DishOut:
    ingredients = [
        IngredientOut(name=link.ingredient.name, typical_quantity=link.typical_quantity)
        for link in dish.dish_ingredients
    ]
    return DishOut(
        id=dish.id,
        class_name=NAME_TO_CLASS.get(dish.name),
        name=dish.name,
        cuisine=dish.cuisine,
        nutrition_source=dish.nutrition_source,
        nutrition_confidence=dish.nutrition_confidence,
        match_coverage_pct=dish.match_coverage_pct,
        default_serving_g=dish.default_serving_g,
        nutrition_per_100g=dish.nutrition_per_100g,
        ingredients=ingredients,
    )


def _match_dish(label: str, dishes: list[Dish]) -> Dish | None:
    """Exact normalized name / class-key match only — never force a nearest neighbor."""
    needle = normalize_label(label)
    if not needle:
        return None
    by_name = {normalize_label(d.name): d for d in dishes}
    if needle in by_name:
        return by_name[needle]
    for class_key, display in CLASS_TO_NAME.items():
        aliases = {
            normalize_label(class_key),
            normalize_label(class_key.replace("_", " ")),
            normalize_label(display),
        }
        if needle in aliases:
            return by_name.get(normalize_label(display))
    return None


@router.get("/dishes", response_model=list[DishOut])
@dishes_router.get("/dishes", response_model=list[DishOut])
def list_dishes(db: Session = Depends(get_db)) -> list[DishOut]:
    dishes = db.scalars(
        select(Dish)
        .options(
            selectinload(Dish.dish_ingredients).selectinload(DishIngredient.ingredient)
        )
        .order_by(Dish.name)
    ).all()
    return [_dish_out(dish) for dish in dishes]


@router.get("/dishes/{dish_id}", response_model=DishOut)
@dishes_router.get("/dishes/{dish_id}", response_model=DishOut)
def get_dish(dish_id: UUID, db: Session = Depends(get_db)) -> DishOut:
    dish = db.scalar(
        select(Dish)
        .options(
            selectinload(Dish.dish_ingredients).selectinload(DishIngredient.ingredient)
        )
        .where(Dish.id == dish_id)
    )
    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")
    return _dish_out(dish)


@router.post("/classify", response_model=ClassifyResponse)
def classify(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClassifyResponse:
    photo_root = Path(settings.object_storage_path)
    photo_root.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "meal.jpg").suffix or ".jpg"
    stored = photo_root / f"{uuid4()}{suffix}"
    plaintext = file.file.read()
    with NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp_path = Path(tmp.name)
        tmp.write(plaintext)
    try:
        try:
            class_name, confidence = classify_image(str(tmp_path))
        except FileNotFoundError as exc:
            raise HTTPException(
                status_code=503, detail="Classifier is not trained yet"
            ) from exc
        write_encrypted(stored, plaintext)
    finally:
        tmp_path.unlink(missing_ok=True)
    display_name = CLASS_TO_NAME.get(class_name, class_name.replace("_", " ").title())
    dish = db.scalar(
        select(Dish)
        .options(
            selectinload(Dish.dish_ingredients).selectinload(DishIngredient.ingredient)
        )
        .where(Dish.name == display_name)
    )
    if dish is None:
        raise HTTPException(
            status_code=404, detail=f"No seeded dish for class {class_name}"
        )
    body = _dish_out(dish)
    return ClassifyResponse(
        **body.model_dump(),
        confidence_score=round(confidence, 4),
        image_url=str(stored),
    )


@router.post("/classify-plate", response_model=PlateClassifyResponse)
@limiter.limit("10/hour")
def classify_plate(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlateClassifyResponse:
    photo_root = Path(settings.object_storage_path)
    photo_root.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "plate.jpg").suffix or ".jpg"
    stored = photo_root / f"{uuid4()}{suffix}"
    plaintext = file.file.read()
    with NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp_path = Path(tmp.name)
        tmp.write(plaintext)

    dishes = list(
        db.scalars(
            select(Dish)
            .options(
                selectinload(Dish.dish_ingredients).selectinload(
                    DishIngredient.ingredient
                )
            )
            .order_by(Dish.name)
        ).all()
    )
    catalog = [d.name for d in dishes] + list(CLASS_TO_NAME.keys())
    try:
        try:
            vision_items = identify_plate_items(str(tmp_path), catalog)
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(
                status_code=502, detail=f"Plate vision error: {exc}"
            ) from exc
        write_encrypted(stored, plaintext)
    finally:
        tmp_path.unlink(missing_ok=True)

    items: list[PlateItemOut] = []
    for vis in vision_items:
        dish = _match_dish(vis.label, dishes)
        if dish is None:
            items.append(
                PlateItemOut(
                    matched=False,
                    suggested_label=vis.label,
                    portion=vis.portion,
                    serving_size_g=None,
                    confidence_score=vis.confidence,
                    dish=None,
                )
            )
            continue
        items.append(
            PlateItemOut(
                matched=True,
                suggested_label=vis.label,
                portion=vis.portion,
                serving_size_g=serving_from_portion(
                    dish.default_serving_g, vis.portion
                ),
                confidence_score=vis.confidence,
                dish=_dish_out(dish),
            )
        )
    return PlateClassifyResponse(image_url=str(stored), items=items)


@router.post("/logs", response_model=FoodLogOut)
def create_log(
    body: FoodLogCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FoodLogOut:
    dish = db.scalar(
        select(Dish)
        .options(
            selectinload(Dish.dish_ingredients).selectinload(DishIngredient.ingredient)
        )
        .where(Dish.id == body.dish_id)
    )
    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")
    log = FoodLog(
        user_id=user.id,
        dish_id=dish.id,
        image_url=body.image_url,
        confidence_score=body.confidence_score,
        serving_size_g=body.serving_size_g,
    )
    if body.logged_at is not None:
        log.logged_at = body.logged_at
    db.add(log)
    db.commit()
    db.refresh(log)
    gamification = apply_event(db, user.id, "meal")
    db.commit()
    return FoodLogOut(
        id=log.id,
        dish=_dish_out(dish),
        confidence_score=log.confidence_score,
        serving_size_g=log.serving_size_g,
        image_url=log.image_url,
        logged_at=log.logged_at.isoformat(),
        gamification=state_dict(gamification),
    )
