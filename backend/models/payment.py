from datetime import datetime

from extensions import db


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    due_id = db.Column(
        db.Integer,
        db.ForeignKey("dues.id"),
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

    due = db.relationship(
        "Due",
        back_populates="payments"
    )