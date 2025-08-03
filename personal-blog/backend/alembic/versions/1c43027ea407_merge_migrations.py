"""merge migrations

Revision ID: 1c43027ea407
Revises: 3b55dccdc0a7, add_last_login_field
Create Date: 2025-08-02 20:42:13.232903

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c43027ea407'
down_revision: Union[str, Sequence[str], None] = ('3b55dccdc0a7', 'add_last_login_field')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
