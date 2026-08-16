from __future__ import annotations

import uuid
from datetime import date as date_type
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Dish(Base):
    __tablename__ = "dishes"
    __table_args__ = (
        CheckConstraint(
            "nutrition_source IN ('usda', 'ifct_2017')",
            name="ck_dishes_nutrition_source",
        ),
        CheckConstraint(
            "nutrition_confidence IN ('high', 'medium', 'low')",
            name="ck_dishes_nutrition_confidence",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    cuisine: Mapped[str] = mapped_column(String, nullable=False)
    nutrition_source: Mapped[str] = mapped_column(Text, nullable=False)
    nutrition_confidence: Mapped[str] = mapped_column(Text, nullable=False)
    match_coverage_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    default_serving_g: Mapped[int] = mapped_column(Integer, nullable=False)
    nutrition_per_100g: Mapped[dict] = mapped_column(JSONB, nullable=False)

    dish_ingredients: Mapped[list[DishIngredient]] = relationship(back_populates="dish")
    food_logs: Mapped[list[FoodLog]] = relationship(back_populates="dish")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)

    dish_ingredients: Mapped[list[DishIngredient]] = relationship(back_populates="ingredient")


class DishIngredient(Base):
    __tablename__ = "dish_ingredients"

    dish_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dishes.id", ondelete="CASCADE"), primary_key=True
    )
    ingredient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True
    )
    typical_quantity: Mapped[str] = mapped_column(String, nullable=False)

    dish: Mapped[Dish] = relationship(back_populates="dish_ingredients")
    ingredient: Mapped[Ingredient] = relationship(back_populates="dish_ingredients")


class FoodLog(Base):
    __tablename__ = "food_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    dish_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dishes.id"), nullable=False
    )
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    serving_size_g: Mapped[float] = mapped_column(Float, nullable=False)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="food_logs")
    dish: Mapped[Dish] = relationship(back_populates="food_logs")


class CalorieTarget(Base):
    __tablename__ = "calorie_targets"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_calorie_targets_user_id_date"),
        CheckConstraint(
            "source IN ('calculated', 'ai_adjusted')",
            name="ck_calorie_targets_source",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date_type] = mapped_column("date", Date, nullable=False)
    target_calories: Mapped[int] = mapped_column(Integer, nullable=False)
    target_protein_g: Mapped[int] = mapped_column(Integer, nullable=False)
    target_carbs_g: Mapped[int] = mapped_column(Integer, nullable=False)
    target_fat_g: Mapped[int] = mapped_column(Integer, nullable=False)
    source: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="calorie_targets")
