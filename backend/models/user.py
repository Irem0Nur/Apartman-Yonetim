from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(120),
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    is_email_verified = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    email_verification_code = db.Column(
        db.String(6),
        nullable=True
    )

    email_verification_expires_at = db.Column(
        db.DateTime,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    apartments = db.relationship(
        "Apartment",
        back_populates="manager",
        cascade="all, delete-orphan"
    )