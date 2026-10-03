"""Add google_id to user

Revision ID: a1b2c3d4e5f6
Revises: e90dbfdada15
Create Date: 2026-10-03 18:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "e90dbfdada15"
branch_labels = None
depends_on = None


def upgrade():
    # "Google ile giriş yap" akışı için users tablosuna
    # Google hesap kimliğini (sub) ekle.
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "google_id",
                sa.String(length=255),
                nullable=True,
            )
        )

        batch_op.create_unique_constraint(
            "uq_users_google_id",
            ["google_id"],
        )


def downgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_constraint(
            "uq_users_google_id",
            type_="unique",
        )
        batch_op.drop_column("google_id")
