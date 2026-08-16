"""Add dishes.nutrition_confidence and dishes.match_coverage_pct.

Revision ID: 004_dish_nutrition_confidence
Revises: 003_dish_nutrition_serving
Create Date: 2026-08-16
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_dish_nutrition_confidence"
down_revision: Union[str, Sequence[str], None] = "003_dish_nutrition_serving"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "dishes",
        sa.Column("nutrition_confidence", sa.Text(), nullable=False, server_default="high"),
    )
    op.add_column("dishes", sa.Column("match_coverage_pct", sa.Float(), nullable=True))
    op.create_check_constraint(
        "ck_dishes_nutrition_confidence",
        "dishes",
        "nutrition_confidence IN ('high', 'medium', 'low')",
    )
    op.alter_column("dishes", "nutrition_confidence", server_default=None)


def downgrade() -> None:
    op.drop_constraint("ck_dishes_nutrition_confidence", "dishes", type_="check")
    op.drop_column("dishes", "match_coverage_pct")
    op.drop_column("dishes", "nutrition_confidence")
