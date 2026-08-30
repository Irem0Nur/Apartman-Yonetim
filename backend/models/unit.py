from datetime import datetime
from extensions import db


class Unit(db.Model):
    __tablename__ = "units"

    id = db.Column(db.Integer, primary_key=True)

    apartment_id = db.Column(
        db.Integer,
        db.ForeignKey("apartments.id"),
        nullable=False
    )

    unit_number = db.Column(
        db.String(20),
        nullable=False
    )

    floor = db.Column(
        db.Integer,
        nullable=True
    )

    gross_area = db.Column(
        db.Numeric(10, 2),
        nullable=True
    )

    due_amount = db.Column(
        db.Numeric(10, 2),
        nullable=True
    )

    is_occupied = db.Column(
        db.Boolean,
        default=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    apartment = db.relationship(
        "Apartment",
        back_populates="units"
    )

    residents = db.relationship(
        "Resident",
        back_populates="unit",
        cascade="all, delete-orphan"
    )