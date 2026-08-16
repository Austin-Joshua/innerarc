"""Initial schema matching Innerarc_Backend_Schema.md.

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-08-16

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial_schema"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

biological_sex = postgresql.ENUM("male", "female", name="biological_sex", create_type=False)
goal = postgresql.ENUM(
    "fat_loss",
    "muscle_gain",
    "recomposition",
    "endurance",
    "general_fitness",
    name="goal",
    create_type=False,
)
activity_level = postgresql.ENUM(
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extra_active",
    name="activity_level",
    create_type=False,
)
equipment_access = postgresql.ENUM(
    "none", "home_gym", "full_gym", name="equipment_access", create_type=False
)
workout_modality = postgresql.ENUM(
    "bodyweight",
    "weighted",
    "home_gym",
    "yoga",
    "aerobics",
    name="workout_modality",
    create_type=False,
)
workout_level = postgresql.ENUM(
    "beginner", "intermediate", "advanced", name="workout_level", create_type=False
)
wearable_source = postgresql.ENUM(
    "health_connect", "apple_healthkit", name="wearable_source", create_type=False
)
metric_type = postgresql.ENUM(
    "steps", "heart_rate", "sleep", "spo2", name="metric_type", create_type=False
)
reminder_type = postgresql.ENUM(
    "log_meal", "workout", "progress_photo", name="reminder_type", create_type=False
)
reminder_recurrence = postgresql.ENUM(
    "daily", "weekly", "custom", name="reminder_recurrence", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    biological_sex.create(bind, checkfirst=True)
    goal.create(bind, checkfirst=True)
    activity_level.create(bind, checkfirst=True)
    equipment_access.create(bind, checkfirst=True)
    workout_modality.create(bind, checkfirst=True)
    workout_level.create(bind, checkfirst=True)
    wearable_source.create(bind, checkfirst=True)
    metric_type.create(bind, checkfirst=True)
    reminder_type.create(bind, checkfirst=True)
    reminder_recurrence.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "user_profile",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("height_cm", sa.Float(), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=False),
        sa.Column("biological_sex", biological_sex, nullable=False),
        sa.Column("goal", goal, nullable=False),
        sa.Column("activity_level", activity_level, nullable=False),
        sa.Column("equipment_access", equipment_access, nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "dishes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("cuisine", sa.String(), nullable=False),
        sa.Column("nutrition_per_100g", postgresql.JSONB(), nullable=False),
    )

    op.create_table(
        "ingredients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
    )

    op.create_table(
        "dish_ingredients",
        sa.Column("dish_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ingredient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("typical_quantity", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["dish_id"], ["dishes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["ingredient_id"], ["ingredients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("dish_id", "ingredient_id"),
    )

    op.create_table(
        "food_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("dish_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("image_url", sa.String(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("serving_size_g", sa.Float(), nullable=False),
        sa.Column(
            "logged_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["dish_id"], ["dishes.id"]),
    )
    op.create_index("ix_food_logs_user_id", "food_logs", ["user_id"])

    op.create_table(
        "workouts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("modality", workout_modality, nullable=False),
        sa.Column("level", workout_level, nullable=False),
        sa.Column("goal_tags", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("equipment_needed", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("media_url", sa.String(), nullable=False),
    )

    op.create_table(
        "programs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("duration_weeks", sa.Integer(), nullable=False),
    )

    op.create_table(
        "program_workouts",
        sa.Column("program_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workout_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("week_number", sa.Integer(), nullable=False),
        sa.Column("day_number", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["program_id"], ["programs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workout_id"], ["workouts.id"]),
        sa.PrimaryKeyConstraint("program_id", "workout_id", "week_number", "day_number"),
    )

    op.create_table(
        "workout_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workout_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "completed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("duration_min", sa.Float(), nullable=False),
        sa.Column("calories_burned_est", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workout_id"], ["workouts.id"]),
    )
    op.create_index("ix_workout_logs_user_id", "workout_logs", ["user_id"])

    op.create_table(
        "progress_photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("image_url", sa.String(), nullable=False),
        sa.Column("taken_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("pose_landmarks_json", postgresql.JSONB(), nullable=False),
        sa.Column("computed_ratios_json", postgresql.JSONB(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_progress_photos_user_id", "progress_photos", ["user_id"])

    op.create_table(
        "wearable_data",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source", wearable_source, nullable=False),
        sa.Column("metric_type", metric_type, nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_wearable_data_user_id", "wearable_data", ["user_id"])

    op.create_table(
        "ai_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("response", sa.Text(), nullable=False),
        sa.Column("referenced_data_snapshot", postgresql.JSONB(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_ai_conversations_user_id", "ai_conversations", ["user_id"])

    op.create_table(
        "gamification",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("streak_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("badges_earned", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_activity_date", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "reminders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", reminder_type, nullable=False),
        sa.Column("scheduled_time", sa.Time(), nullable=False),
        sa.Column("recurrence", reminder_recurrence, nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_reminders_user_id", "reminders", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_reminders_user_id", table_name="reminders")
    op.drop_table("reminders")
    op.drop_table("gamification")
    op.drop_index("ix_ai_conversations_user_id", table_name="ai_conversations")
    op.drop_table("ai_conversations")
    op.drop_index("ix_wearable_data_user_id", table_name="wearable_data")
    op.drop_table("wearable_data")
    op.drop_index("ix_progress_photos_user_id", table_name="progress_photos")
    op.drop_table("progress_photos")
    op.drop_index("ix_workout_logs_user_id", table_name="workout_logs")
    op.drop_table("workout_logs")
    op.drop_table("program_workouts")
    op.drop_table("programs")
    op.drop_table("workouts")
    op.drop_index("ix_food_logs_user_id", table_name="food_logs")
    op.drop_table("food_logs")
    op.drop_table("dish_ingredients")
    op.drop_table("ingredients")
    op.drop_table("dishes")
    op.drop_table("user_profile")
    op.drop_table("users")

    bind = op.get_bind()
    reminder_recurrence.drop(bind, checkfirst=True)
    reminder_type.drop(bind, checkfirst=True)
    metric_type.drop(bind, checkfirst=True)
    wearable_source.drop(bind, checkfirst=True)
    workout_level.drop(bind, checkfirst=True)
    workout_modality.drop(bind, checkfirst=True)
    equipment_access.drop(bind, checkfirst=True)
    activity_level.drop(bind, checkfirst=True)
    goal.drop(bind, checkfirst=True)
    biological_sex.drop(bind, checkfirst=True)
