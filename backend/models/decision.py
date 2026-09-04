from datetime import datetime

from extensions import db


class Decision(db.Model):
    __tablename__ = "decisions"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    apartment_id = db.Column(
        db.Integer,
        db.ForeignKey("apartments.id"),
        nullable=False
    )

    decision_number = db.Column(
        db.String(50),
        nullable=False
    )

    decision_date = db.Column(
        db.Date,
        nullable=False
    )

    decision_type = db.Column(
        db.String(100),
        nullable=False,
        default="Kat Malikleri Kurulu"
    )

    title = db.Column(
        db.String(255),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    notes = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    apartment = db.relationship(
        "Apartment",
        backref="decisions"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "apartment_id",
            "decision_number",
            name="uq_decision_apartment_number"
        ),
    )