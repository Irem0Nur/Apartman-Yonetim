from datetime import datetime

from extensions import db


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

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

    document_number = db.Column(
        db.String(100),
        nullable=True
    )

    payment_method = db.Column(
        db.String(50),
        nullable=True
    )

    description = db.Column(
        db.String(500),
        nullable=True
    )

    # Bu gelir/gider hangi daireye ait (varsa). Örn. önceki
    # dönem borç ödemesinden otomatik oluşan kayıtlarda dolu
    # olur; elle girilen kayıtlarda boş kalabilir.
    unit_id = db.Column(
        db.Integer,
        db.ForeignKey("units.id"),
        nullable=True
    )

    # Ödemeyi/işlemi yapan kişinin adı (serbest metin).
    # unit_id doluysa genelde o dairenin sakin/malikinden
    # otomatik doldurulur, ama elle de girilebilir.
    payer_name = db.Column(
        db.String(255),
        nullable=True
    )

    # "manual": kullanıcı tarafından elle eklendi.
    # "previous_debt_payment": önceki dönem borç ödemesinden
    # otomatik oluşturuldu (bu kayıtlar ait oldukları ödeme
    # üzerinden silinmelidir, doğrudan silinemez).
    source = db.Column(
        db.String(30),
        nullable=False,
        default="manual"
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

    unit = db.relationship(
        "Unit",
        backref="transactions"
    )