from datetime import datetime

from extensions import db


class PreviousPeriodDebtPayment(db.Model):
    __tablename__ = "previous_period_debt_payments"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    debt_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "previous_period_debts.id"
        ),
        nullable=False
    )

    amount = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    payment_date = db.Column(
        db.Date,
        nullable=False
    )

    payment_method = db.Column(
        db.String(30),
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

    debt = db.relationship(
        "PreviousPeriodDebt",
        back_populates="payments"
    )