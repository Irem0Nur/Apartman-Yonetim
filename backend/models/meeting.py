from datetime import datetime

from extensions import db


class Meeting(db.Model):
    __tablename__ = "meetings"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    apartment_id = db.Column(
        db.Integer,
        db.ForeignKey("apartments.id"),
        nullable=False
    )

    title = db.Column(
        db.String(255),
        nullable=False
    )

    meeting_type = db.Column(
        db.String(100),
        nullable=False,
        default="Olağan Toplantı"
    )

    meeting_date = db.Column(
        db.DateTime,
        nullable=False
    )

    location = db.Column(
        db.String(255),
        nullable=True
    )

    agenda = db.Column(
        db.Text,
        nullable=False
    )

    notes = db.Column(
        db.Text,
        nullable=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="planned"
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
        backref="meetings"
    )