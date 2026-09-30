"""rename author_id to recipes_id in cook

Revision ID: 00a145999928
Revises: 3cc0317d9d5c
Create Date: 2026-09-29 14:18:56.146299

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '00a145999928'
down_revision: Union[str, Sequence[str], None] = '3cc0317d9d5c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('cook', schema=None) as batch_op:
        batch_op.alter_column(
            'author_id',
            new_column_name='recipes_id',
            existing_type=sa.Integer(),
            existing_nullable=True,
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('cook', schema=None) as batch_op:
        batch_op.alter_column(
            'recipes_id',
            new_column_name='author_id',
            existing_type=sa.Integer(),
            existing_nullable=True,
        )
