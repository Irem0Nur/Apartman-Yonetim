from datetime import datetime
from decimal import Decimal

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Payment, Due, Unit, Apartment


payments_bp = Blueprint(
    "payments",
    __name__,
    url_prefix="/api/payments"
)


def get_owned_due(due_id, user_id):
    return (
        Due.query
        .join(Unit, Due.unit_id == Unit.id)
        .join(Apartment, Unit.apartment_id == Apartment.id)
        .filter(
            Due.id == due_id,
            Apartment.manager_id == user_id
        )
        .first()
    )


def get_owners(unit):
    owners = []

    for relation in unit.person_relations:
        if (
            relation.is_active
            and relation.relationship_type == "owner"
            and relation.person
        ):
            owners.append(relation.person.full_name)

    return owners


def payment_to_dict(payment):
    due = payment.due
    unit = due.unit

    return {
        "id": payment.id,
        "due_id": payment.due_id,
        "amount": float(payment.amount),
        "payment_date": payment.payment_date.isoformat(),
        "payment_method": payment.payment_method,
        "description": payment.description,
        "created_at": (
            payment.created_at.isoformat()
            if payment.created_at
            else None
        ),

        "year": due.year,
        "month": due.month,

        "unit_id": unit.id,
        "unit_number": unit.unit_number,
        "block_name": unit.block_name,

        "owners": get_owners(unit),
    }


@payments_bp.route("/apartment/<int:apartment_id>", methods=["GET"])
@jwt_required()
def get_apartment_payments(apartment_id):
    user_id = int(get_jwt_identity())

    apartment = Apartment.query.filter_by(
        id=apartment_id,
        manager_id=user_id
    ).first()

    if not apartment:
        return jsonify({
            "message": "Apartman bulunamadı veya yetkiniz yok."
        }), 404

    query = (
        Payment.query
        .join(Due, Payment.due_id == Due.id)
        .join(Unit, Due.unit_id == Unit.id)
        .filter(Unit.apartment_id == apartment_id)
    )

    year = request.args.get("year", type=int)
    month = request.args.get("month", type=int)

    if year:
        query = query.filter(Due.year == year)

    if month:
        query = query.filter(Due.month == month)

    payments = (
        query
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


@payments_bp.route("/yearly-report/<int:apartment_id>", methods=["GET"])
@jwt_required()
def yearly_payment_report(apartment_id):
    user_id = int(get_jwt_identity())

    apartment = Apartment.query.filter_by(
        id=apartment_id,
        manager_id=user_id
    ).first()

    if not apartment:
        return jsonify({
            "message": "Apartman bulunamadı veya yetkiniz yok."
        }), 404

    year = request.args.get("year", type=int)

    if not year:
        return jsonify({
            "message": "Yıl bilgisi zorunludur."
        }), 400

    units = (
        Unit.query
        .filter(Unit.apartment_id == apartment_id)
        .order_by(
            Unit.block_name.asc(),
            Unit.unit_number.asc()
        )
        .all()
    )

    report = []

    general_required = Decimal("0.00")
    general_paid = Decimal("0.00")
    general_remaining = Decimal("0.00")

    for unit in units:
        monthly_payments = {
            str(month): Decimal("0.00")
            for month in range(1, 13)
        }

        monthly_required = {
            str(month): Decimal("0.00")
            for month in range(1, 13)
        }

        dues = (
            Due.query
            .filter(
                Due.unit_id == unit.id,
                Due.year == year
            )
            .all()
        )

        total_required = Decimal("0.00")
        total_paid = Decimal("0.00")

        for due in dues:
            due_amount = Decimal(str(due.amount))

            total_required += due_amount

            monthly_required[str(due.month)] += due_amount

            for payment in due.payments:
                payment_amount = Decimal(str(payment.amount))

                total_paid += payment_amount
                monthly_payments[str(due.month)] += payment_amount

        remaining = total_required - total_paid

        general_required += total_required
        general_paid += total_paid
        general_remaining += remaining

        report.append({
            "unit_id": unit.id,
            "unit_number": unit.unit_number,
            "block_name": unit.block_name,
            "owners": get_owners(unit),

            "monthly_payments": {
                key: float(value)
                for key, value in monthly_payments.items()
            },

            "monthly_required": {
                key: float(value)
                for key, value in monthly_required.items()
            },

            "total_required": float(total_required),
            "total_paid": float(total_paid),
            "remaining": float(remaining),
        })

    return jsonify({
        "apartment": {
            "id": apartment.id,
            "name": apartment.name,
        },

        "year": year,

        "rows": report,

        "totals": {
            "required": float(general_required),
            "paid": float(general_paid),
            "remaining": float(general_remaining),
        }
    }), 200


@payments_bp.route("/due/<int:due_id>", methods=["GET"])
@jwt_required()
def get_due_payments(due_id):
    user_id = int(get_jwt_identity())

    due = get_owned_due(due_id, user_id)

    if not due:
        return jsonify({
            "message": "Aidat kaydı bulunamadı veya yetkiniz yok."
        }), 404

    payments = (
        Payment.query
        .filter_by(due_id=due.id)
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


@payments_bp.route("", methods=["POST"])
@jwt_required()
def create_payment():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    due_id = data.get("due_id")
    amount = data.get("amount")

    if not due_id:
        return jsonify({
            "message": "Aidat kaydı seçilmelidir."
        }), 400

    if amount is None:
        return jsonify({
            "message": "Ödeme tutarı zorunludur."
        }), 400

    due = get_owned_due(due_id, user_id)

    if not due:
        return jsonify({
            "message": "Aidat kaydı bulunamadı veya yetkiniz yok."
        }), 404

    try:
        payment_amount = Decimal(str(amount))
    except Exception:
        return jsonify({
            "message": "Geçerli bir ödeme tutarı giriniz."
        }), 400

    if payment_amount <= 0:
        return jsonify({
            "message": "Ödeme tutarı sıfırdan büyük olmalıdır."
        }), 400

    paid_amount = sum(
        (
            Decimal(str(payment.amount))
            for payment in due.payments
        ),
        Decimal("0.00")
    )

    remaining_amount = Decimal(str(due.amount)) - paid_amount

    if payment_amount > remaining_amount:
        return jsonify({
            "message": (
                f"Ödeme tutarı kalan borçtan fazla olamaz. "
                f"Kalan borç: {float(remaining_amount):.2f} TL"
            )
        }), 400

    payment_date_text = data.get("payment_date")

    if payment_date_text:
        try:
            payment_date = datetime.strptime(
                payment_date_text,
                "%Y-%m-%d"
            ).date()
        except ValueError:
            return jsonify({
                "message": "Ödeme tarihi YYYY-MM-DD formatında olmalıdır."
            }), 400
    else:
        payment_date = datetime.today().date()

    payment = Payment(
        due_id=due.id,
        amount=payment_amount,
        payment_date=payment_date,
        payment_method=data.get("payment_method"),
        description=data.get("description"),
    )

    db.session.add(payment)
    db.session.commit()

    return jsonify({
        "message": "Ödeme başarıyla kaydedildi.",
        "payment": payment_to_dict(payment)
    }), 201


@payments_bp.route("/<int:payment_id>", methods=["DELETE"])
@jwt_required()
def delete_payment(payment_id):
    user_id = int(get_jwt_identity())

    payment = (
        Payment.query
        .join(Due, Payment.due_id == Due.id)
        .join(Unit, Due.unit_id == Unit.id)
        .join(Apartment, Unit.apartment_id == Apartment.id)
        .filter(
            Payment.id == payment_id,
            Apartment.manager_id == user_id
        )
        .first()
    )

    if not payment:
        return jsonify({
            "message": "Ödeme bulunamadı veya yetkiniz yok."
        }), 404

    db.session.delete(payment)
    db.session.commit()

    return jsonify({
        "message": "Ödeme başarıyla silindi."
    }), 200