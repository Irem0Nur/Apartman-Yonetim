"""Add payer fields to transaction, link debt payments to transactions

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-10-04 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    # İşletme defterindeki gelir/gider kayıtlarının yanında
    # "kim ödedi" bilgisini gösterebilmek için: hangi daireye
    # ait olduğu (varsa) ve/veya serbest metin bir isim, ayrıca
    # bu kaydın elle mi yoksa bir borç ödemesinden otomatik mi
    # oluşturulduğu.
    with op.batch_alter_table("transactions", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "unit_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "payer_name",
                sa.String(length=255),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "source",
                sa.String(length=30),
                nullable=False,
                server_default="manual",
            )
        )

        batch_op.create_foreign_key(
            "fk_transactions_unit_id",
            "units",
            ["unit_id"],
            ["id"],
        )

    # Önceki dönem borcuna yapılan bir ödeme, gelir tarafında
    # otomatik bir işletme defteri kaydı (Transaction) oluşturur;
    # bu ödeme kaydı o Transaction'a bağlanır (silinirken birlikte
    # silinebilsin diye).
    with op.batch_alter_table(
        "previous_period_debt_payments", schema=None
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "transaction_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.create_foreign_key(
            "fk_previous_period_debt_payments_transaction_id",
            "transactions",
            ["transaction_id"],
            ["id"],
        )


def downgrade():
    with op.batch_alter_table(
        "previous_period_debt_payments", schema=None
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_previous_period_debt_payments_transaction_id",
            type_="foreignkey",
        )
        batch_op.drop_column("transaction_id")

    with op.batch_alter_table("transactions", schema=None) as batch_op:
        batch_op.drop_constraint(
            "fk_transactions_unit_id",
            type_="foreignkey",
        )
        batch_op.drop_column("source")
        batch_op.drop_column("payer_name")
        batch_op.drop_column("unit_id")
