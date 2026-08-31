from datetime import datetime
from extensions import db


class UnitPerson(db.Model):
    __tablename__ = "unit_people"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    unit_id = db.Column(
        db.Integer,
        db.ForeignKey("units.id"),
        nullable=False
    )

    person_id = db.Column(
        db.Integer,
        db.ForeignKey("persons.id"),
        nullable=False
    )

    relationship_type = db.Column(
        db.String(30),
        nullable=False
    )

    is_resident = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    is_active = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    start_date = db.Column(
        db.Date,
        nullable=True
    )

    end_date = db.Column(
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
        back_populates="person_relations"
    )

    person = db.relationship(
        "Person",
        back_populates="unit_relations"
    )