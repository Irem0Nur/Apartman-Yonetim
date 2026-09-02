from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Apartment, Unit, Due, Payment


payments_bp = Blueprint(
    "payments",
    __name__,
    url_prefix="/api/payments"
)


def get_owned_apartment(apartment_id, user_id):
    return Apartment.query.filter_by(
        id=apartment_id,
        manager_id=user_id
    ).first()


def get_owned_due(due_id, user_id):
    return (
        Due.query
        .join(Unit)
        .join(Apartment)
        .filter(
            Due.id == due_id,
            Apartment.manager_id == user_id
        )
        .first()
    )


def payment_to_dict(payment):
    return {
        "id": payment.id,
        "due_id": payment.due_id,
        "amount": float(payment.amount or 0),
        "payment_date": (
            payment.payment_date.isoformat()
            if payment.payment_date
            else None
        ),
        "payment_method": payment.payment_method,
        "description": payment.description,
        "created_at": (
            payment.created_at.isoformat()
            if payment.created_at
            else None
        ),
    }


@payments_bp.route(
    "/due/<int:due_id>",
    methods=["GET"]
)
@jwt_required()
def get_due_payments(due_id):
    user_id = int(get_jwt_identity())

    due = get_owned_due(
        due_id,
        user_id
    )

    if not due:
        return jsonify({
            "message": "Aidat kaydı bulunamadı"
        }), 404

    payments = (
        Payment.query
        .filter_by(due_id=due_id)
        .order_by(
            Payment.payment_date.desc(),
            Payment.id.desc()
        )
        .all()
    )

    return jsonify([
        payment_to_dict(payment)
        for payment in payments
    ]), 200


@payments_bp.route(
    "",
    methods=["POST"]
)
@jwt_required()
def create_payment():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    due_id = data.get("due_id")
    amount = data.get("amount")
    payment_date_raw = data.get(
        "payment_date"
    )

    payment_method = (
        data.get("payment_method") or ""
    ).strip()

    description = (
        data.get("description") or ""
    ).strip()

    if not due_id or amount is None:
        return jsonify({
            "message":
                "Aidat ve ödeme tutarı zorunludur"
        }), 400

    due = get_owned_due(
        due_id,
        user_id
    )

    if not due:
        return jsonify({
            "message": "Aidat kaydı bulunamadı"
        }), 404

    try:
        amount_decimal = Decimal(str(amount))
    except (
        InvalidOperation,
        TypeError,
        ValueError
    ):
        return jsonify({
            "message": "Ödeme tutarı geçersiz"
        }), 400

    if amount_decimal <= 0:
        return jsonify({
            "message":
                "Ödeme tutarı 0'dan büyük olmalıdır"
        }), 400

    total_paid = sum(
        (
            payment.amount
            for payment in due.payments
        ),
        Decimal("0")
    )

    remaining = (
        Decimal(str(due.amount))
        - total_paid
    )

    if amount_decimal > remaining:
        return jsonify({
            "message":
                f"Ödeme kalan borcu aşamaz. "
                f"Kalan borç: {float(remaining):.2f} TL"
        }), 400

    if payment_date_raw:
        try:
            payment_date = datetime.strptime(
                payment_date_raw,
                "%Y-%m-%d"
            ).date()
        except ValueError:
            return jsonify({
                "message":
                    "Ödeme tarihi geçersiz"
            }), 400
    else:
        payment_date = date.today()

    payment = Payment(
        due_id=due.id,
        amount=amount_decimal,
        payment_date=payment_date,
        payment_method=(
            payment_method or None
        ),
        description=(
            description or None
        ),
    )

    db.session.add(payment)
    db.session.commit()

    return jsonify({
        "message": "Ödeme kaydedildi",
        "payment": payment_to_dict(payment)
    }), 201


@payments_bp.route(
    "/<int:payment_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_payment(payment_id):
    user_id = int(get_jwt_identity())

    payment = (
        Payment.query
        .join(Due)
        .join(Unit)
        .join(Apartment)
        .filter(
            Payment.id == payment_id,
            Apartment.manager_id == user_id
        )
        .first()
    )

    if not payment:
        return jsonify({
            "message": "Ödeme bulunamadı"
        }), 404

    db.session.delete(payment)
    db.session.commit()

    return jsonify({
        "message": "Ödeme silindi"
    }), 200