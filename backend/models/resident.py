from datetime import datetime
from extensions import db


class Resident(db.Model):
    __tablename__ = "residents"

    id = db.Column(db.Integer, primary_key=True)

    unit_id = db.Column(
        db.Integer,
        db.ForeignKey("units.id"),
        nullable=False
    )

    full_name = db.Column(
        db.String(150),
        nullable=False
    )

    phone = db.Column(
        db.String(30),
        nullable=True
    )

    email = db.Column(
        db.String(120),
        nullable=True
    )

    resident_type = db.Column(
        db.String(20),
        nullable=False
    )

    move_in_date = db.Column(
        db.Date,
        nullable=True
    )

    move_out_date = db.Column(
        db.Date,
        nullable=True
    )

    notes = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    unit = db.relationship(
        "Unit",
        back_populates="residents"
    )