from datetime import datetime
from extensions import db


class Due(db.Model):
    __tablename__ = "dues"

    id = db.Column(db.Integer, primary_key=True)

    unit_id = db.Column(
        db.Integer,
        db.ForeignKey("units.id"),
        nullable=False
    )

    year = db.Column(
        db.Integer,
        nullable=False
    )

    month = db.Column(
        db.Integer,
        nullable=False
    )

    amount = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    due_date = db.Column(
        db.Date,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    unit = db.relationship(
        "Unit",
        back_populates="dues"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "unit_id",
            "year",
            "month",
            name="uq_due_unit_year_month"
        ),
    )

    payments = db.relationship(
    "Payment",
    back_populates="due",
    cascade="all, delete-orphan"
)