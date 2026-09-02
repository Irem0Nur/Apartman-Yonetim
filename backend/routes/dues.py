from datetime import date
from decimal import Decimal

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Apartment, Unit, Due


dues_bp = Blueprint(
    "dues",
    __name__,
    url_prefix="/api/dues"
)


def get_owned_apartment(apartment_id, user_id):
    return Apartment.query.filter_by(
        id=apartment_id,
        manager_id=user_id
    ).first()


def get_owner_names(unit):
    return [
        relation.person.full_name
        for relation in unit.person_relations
        if (
            relation.is_active
            and
            relation.relationship_type == "owner"
        )
    ]


def calculate_due_payment(due):
    total_paid = sum(
        (
            payment.amount
            for payment in due.payments
        ),
        Decimal("0")
    )

    due_amount = Decimal(
        str(due.amount or 0)
    )

    remaining_amount = (
        due_amount - total_paid
    )

    if remaining_amount < 0:
        remaining_amount = Decimal("0")

    if total_paid <= 0:
        status = "unpaid"

    elif total_paid < due_amount:
        status = "partial"

    else:
        status = "paid"

    return {
        "paid_amount": total_paid,
        "remaining_amount": remaining_amount,
        "status": status,
    }


def due_to_dict(due):
    owners = get_owner_names(
        due.unit
    )

    payment_info = calculate_due_payment(
        due
    )

    return {
        "id": due.id,

        "unit_id": due.unit_id,

        "unit_number":
            due.unit.unit_number,

        "block_name":
            due.unit.block_name,

        "owners": owners,

        "year": due.year,

        "month": due.month,

        "amount":
            float(due.amount or 0),

        "paid_amount":
            float(
                payment_info[
                    "paid_amount"
                ]
            ),

        "remaining_amount":
            float(
                payment_info[
                    "remaining_amount"
                ]
            ),

        "status":
            payment_info["status"],

        "payment_count":
            len(due.payments),

        "due_date": (
            due.due_date.isoformat()
            if due.due_date
            else None
        ),
    }


@dues_bp.route(
    "/apartment/<int:apartment_id>",
    methods=["GET"]
)
@jwt_required()
def get_dues(apartment_id):
    user_id = int(
        get_jwt_identity()
    )

    apartment = get_owned_apartment(
        apartment_id,
        user_id
    )

    if not apartment:
        return jsonify({
            "message":
                "Apartman bulunamadı"
        }), 404

    year = request.args.get(
        "year",
        type=int
    )

    month = request.args.get(
        "month",
        type=int
    )

    query = (
        Due.query
        .join(Unit)
        .filter(
            Unit.apartment_id
            == apartment_id
        )
    )

    if year:
        query = query.filter(
            Due.year == year
        )

    if month:
        query = query.filter(
            Due.month == month
        )

    dues = query.order_by(
        Unit.block_name.asc(),
        Unit.unit_number.asc()
    ).all()

    return jsonify([
        due_to_dict(due)
        for due in dues
    ]), 200


@dues_bp.route(
    "/generate",
    methods=["POST"]
)
@jwt_required()
def generate_dues():
    user_id = int(
        get_jwt_identity()
    )

    data = request.get_json() or {}

    apartment_id = data.get(
        "apartment_id"
    )

    year = data.get(
        "year"
    )

    month = data.get(
        "month"
    )

    if (
        not apartment_id
        or not year
        or not month
    ):
        return jsonify({
            "message":
                "Apartman, yıl ve ay bilgisi zorunludur"
        }), 400

    try:
        year = int(year)
        month = int(month)

    except (
        TypeError,
        ValueError
    ):
        return jsonify({
            "message":
                "Yıl ve ay bilgisi geçersiz"
        }), 400

    if month < 1 or month > 12:
        return jsonify({
            "message":
                "Ay 1 ile 12 arasında olmalıdır"
        }), 400

    apartment = get_owned_apartment(
        apartment_id,
        user_id
    )

    if not apartment:
        return jsonify({
            "message":
                "Apartman bulunamadı"
        }), 404

    units = Unit.query.filter_by(
        apartment_id=apartment_id
    ).all()

    if not units:
        return jsonify({
            "message":
                "Bu apartmanda henüz daire bulunmuyor"
        }), 400

    created_count = 0
    skipped_count = 0

    for unit in units:

        existing = Due.query.filter_by(
            unit_id=unit.id,
            year=year,
            month=month
        ).first()

        if existing:
            skipped_count += 1
            continue

        amount = (
            unit.due_amount
            if unit.due_amount is not None
            else apartment.default_due_amount
        )

        amount = amount or 0

        due = Due(
            unit_id=unit.id,
            year=year,
            month=month,
            amount=amount,
            due_date=date(
                year,
                month,
                15
            )
        )

        db.session.add(due)

        created_count += 1

    db.session.commit()

    return jsonify({
        "message":
            "Aidatlar oluşturuldu",

        "created_count":
            created_count,

        "skipped_count":
            skipped_count,
    }), 201