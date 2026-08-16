"""Initial schema matching Innerarc_Backend_Schema.md plus Module 2 dish fields.

Revision ID: 003_dish_nutrition_serving
Revises: 002_exercises_targets
Create Date: 2026-08-16
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_dish_nutrition_serving"
down_revision: Union[str, Sequence[str], None] = "002_exercises_targets"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("dishes", sa.Column("nutrition_source", sa.Text(), nullable=False, server_default="usda"))
    op.add_column("dishes", sa.Column("default_serving_g", sa.Integer(), nullable=False, server_default="250"))
    op.create_check_constraint(
        "ck_dishes_nutrition_source",
        "dishes",
        "nutrition_source IN ('usda', 'ifct_2017')",
    )
    op.alter_column("dishes", "nutrition_source", server_default=None)
    op.alter_column("dishes", "default_serving_g", server_default=None)


def downgrade() -> None:
    op.drop_constraint("ck_dishes_nutrition_source", "dishes", type_="check")
    op.drop_column("dishes", "default_serving_g")
    op.drop_column("dishes", "nutrition_source")
