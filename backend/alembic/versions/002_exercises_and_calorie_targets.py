"""Add exercises, workout_exercises, and calorie_targets.

Revision ID: 002_exercises_targets
Revises: 001_initial_schema
Create Date: 2026-08-16

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002_exercises_targets"
down_revision: Union[str, Sequence[str], None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exercises",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("media_url", sa.Text(), nullable=False),
    )

    op.create_table(
        "workout_exercises",
        sa.Column("workout_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("exercise_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("sets", sa.Integer(), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("rest_seconds", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["workout_id"], ["workouts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("workout_id", "exercise_id", "order_index"),
    )

    op.create_table(
        "calorie_targets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("target_calories", sa.Integer(), nullable=False),
        sa.Column("target_protein_g", sa.Integer(), nullable=False),
        sa.Column("target_carbs_g", sa.Integer(), nullable=False),
        sa.Column("target_fat_g", sa.Integer(), nullable=False),
        sa.Column("source", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "date", name="uq_calorie_targets_user_id_date"),
        sa.CheckConstraint(
            "source IN ('calculated', 'ai_adjusted')",
            name="ck_calorie_targets_source",
        ),
    )
    op.create_index("ix_calorie_targets_user_id", "calorie_targets", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_calorie_targets_user_id", table_name="calorie_targets")
    op.drop_table("calorie_targets")
    op.drop_table("workout_exercises")
    op.drop_table("exercises")
