from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class IngredientOut(BaseModel):
    name: str
    typical_quantity: str


class DishOut(BaseModel):
    id: UUID
    class_name: str | None = None
    name: str
    cuisine: str
    nutrition_source: str
    nutrition_confidence: str
    match_coverage_pct: float | None = None
    default_serving_g: int
    nutrition_per_100g: dict
    ingredients: list[IngredientOut]


class ClassifyResponse(DishOut):
    confidence_score: float
    image_url: str


class PlateItemOut(BaseModel):
    matched: bool
    suggested_label: str
    portion: str
    serving_size_g: float | None = None
    confidence_score: float | None = None
    dish: DishOut | None = None


class PlateClassifyResponse(BaseModel):
    image_url: str
    items: list[PlateItemOut]


class FoodLogCreate(BaseModel):
    dish_id: UUID
    confidence_score: float = Field(ge=0, le=1)
    serving_size_g: float = Field(gt=0)
    image_url: str
    logged_at: datetime | None = None


class FoodLogOut(BaseModel):
    id: UUID
    dish: DishOut
    confidence_score: float
    serving_size_g: float
    image_url: str
    logged_at: str
    gamification: dict | None = None
