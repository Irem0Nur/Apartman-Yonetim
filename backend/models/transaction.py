from datetime import datetime

from extensions import db


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)

    apartment_id = db.Column(
        db.Integer,
        db.ForeignKey("apartments.id"),
        nullable=False
    )

    transaction_type = db.Column(
        db.String(20),
        nullable=False
    )

    category = db.Column(
        db.String(100),
        nullable=False
    )

    amount = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    transaction_date = db.Column(
        db.Date,
        nullable=False
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

    apartment = db.relationship(
        "Apartment",
        backref="transactions"
    )