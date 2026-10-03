"""Add password reset fields

Revision ID: e90dbfdada15
Revises: 19086e35f07b
Create Date: 2026-10-03 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e90dbfdada15"
down_revision = "19086e35f07b"
branch_labels = None
depends_on = None


def upgrade():
    # "Şifremi unuttum" akışı için users tablosuna
    # şifre sıfırlama alanlarını ekle.
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "password_reset_code",
                sa.String(length=6),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "password_reset_expires_at",
                sa.DateTime(),
                nullable=True,
            )
        )


def downgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("password_reset_expires_at")
        batch_op.drop_column("password_reset_code")
