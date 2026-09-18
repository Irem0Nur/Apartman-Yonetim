from datetime import datetime
from decimal import Decimal

from extensions import db


class PreviousPeriodDebt(db.Model):
    __tablename__ = "previous_period_debts"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    unit_id = db.Column(
        db.Integer,
        db.ForeignKey("units.id"),
        nullable=False
    )

    amount = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    period = db.Column(
        db.String(100),
        nullable=True
    )

    description = db.Column(
        db.String(255),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    unit = db.relationship(
        "Unit",
        back_populates="previous_period_debts"
    )

    payments = db.relationship(
        "PreviousPeriodDebtPayment",
        back_populates="debt",
        cascade="all, delete-orphan"
    )

    @property
    def paid_amount(self):
        return sum(
            (
                payment.amount
                for payment in self.payments
            ),
            Decimal("0.00")
        )

    @property
    def remaining_amount(self):
        remaining = (
            Decimal(str(self.amount or 0))
            - self.paid_amount
        )

        return max(
            remaining,
            Decimal("0.00")
        )