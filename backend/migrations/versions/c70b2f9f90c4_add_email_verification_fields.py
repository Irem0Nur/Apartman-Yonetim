"""Add email verification fields

Revision ID: c70b2f9f90c4
Revises: 9959af9fee2c
Create Date: 2026-09-05 02:43:02.324531
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c70b2f9f90c4"
down_revision = "9959af9fee2c"
branch_labels = None
depends_on = None


def upgrade():
    # Mevcut users tablosuna e-posta doğrulama alanlarını ekle.
    #
    # SQLite mevcut kayıtların bulunduğu bir tabloya doğrudan
    # NOT NULL sütun eklenmesine izin vermediği için server_default
    # kullanıyoruz.
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "is_email_verified",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )

        batch_op.add_column(
            sa.Column(
                "email_verification_code",
                sa.String(length=6),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "email_verification_expires_at",
                sa.DateTime(),
                nullable=True,
            )
        )


def downgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("email_verification_expires_at")
        batch_op.drop_column("email_verification_code")
        batch_op.drop_column("is_email_verified")