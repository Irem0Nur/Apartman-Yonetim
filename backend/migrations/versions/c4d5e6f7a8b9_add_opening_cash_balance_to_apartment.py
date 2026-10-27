"""Add opening_cash_balance to apartment

Revision ID: c4d5e6f7a8b9
Revises: b2c3d4e5f6a7
Create Date: 2026-10-27 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c4d5e6f7a8b9"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade():
    # Uygulamayı kullanmaya başlamadan önce kasada zaten
    # bulunan bakiyeyi saklamak için apartments tablosuna
    # opening_cash_balance eklenir. Kasa ve İşletme Defteri
    # bakiye hesaplamaları bu tutarın üzerine eklenir.
    with op.batch_alter_table("apartments", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "opening_cash_balance",
                sa.Numeric(precision=12, scale=2),
                nullable=True,
                server_default="0",
            )
        )


def downgrade():
    with op.batch_alter_table("apartments", schema=None) as batch_op:
        batch_op.drop_column("opening_cash_balance")
