from datetime import datetime
from extensions import db


class Apartment(db.Model):
    __tablename__ = "apartments"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(150),
        nullable=False
    )

    address = db.Column(
        db.Text,
        nullable=True
    )

    block_count = db.Column(
        db.Integer,
        default=1
    )

    floor_count = db.Column(
        db.Integer,
        nullable=True
    )

    unit_count = db.Column(
        db.Integer,
        nullable=True
    )

    default_due_amount = db.Column(
        db.Numeric(10, 2),
        default=0
    )

    manager_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    manager = db.relationship(
        "User",
        back_populates="apartments"
    )

    units = db.relationship(
        "Unit",
        back_populates="apartment",
        cascade="all, delete-orphan"
    )