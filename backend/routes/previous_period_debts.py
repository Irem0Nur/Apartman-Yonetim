from datetime import datetime
from decimal import Decimal

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db

from models import (
    Apartment,
    Unit,
    PreviousPeriodDebt,
    PreviousPeriodDebtPayment,
)


previous_period_debts_bp = Blueprint(
    "previous_period_debts",
    __name__,
    url_prefix="/api/previous-period-debts"
)


# --------------------------------------------------
# YARDIMCI FONKSİYONLAR
# --------------------------------------------------

def get_owned_apartment(apartment_id, user_id):
    return Apartment.query.filter_by(
        id=apartment_id,
        manager_id=user_id
    ).first()


def get_owned_debt(debt_id, user_id):
    return (
        PreviousPeriodDebt.query
        .join(
            Unit,
            PreviousPeriodDebt.unit_id == Unit.id
        )
        .join(
            Apartment,
            Unit.apartment_id == Apartment.id
        )
        .filter(
            PreviousPeriodDebt.id == debt_id,
            Apartment.manager_id == user_id
        )
        .first()
    )


def get_resident_names(unit):
    names = []

    for resident in unit.residents:
        if resident.move_out_date is not None:
            continue

        if resident.full_name:
            names.append(resident.full_name)

    return names


def get_owner_names(unit):
    names = []

    for relation in unit.person_relations:
        if (
            relation.is_active
            and relation.relationship_type == "owner"
            and relation.person
            and relation.person.full_name
        ):
            names.append(
                relation.person.full_name
            )

    return names


def get_people_for_unit(unit):
    residents = get_resident_names(unit)

    if residents:
        return residents

    return get_owner_names(unit)


def calculate_debt_payment(debt):
    paid_amount = sum(
        (
            Decimal(str(payment.amount))
            for payment in debt.payments
        ),
        Decimal("0.00")
    )

    debt_amount = Decimal(
        str(debt.amount or 0)
    )

    remaining_amount = (
        debt_amount - paid_amount
    )

    if remaining_amount < 0:
        remaining_amount = Decimal("0.00")

    if paid_amount <= 0:
        status = "unpaid"
    elif paid_amount < debt_amount:
        status = "partial"
    else:
        status = "paid"

    return {
        "paid_amount": paid_amount,
        "remaining_amount": remaining_amount,
        "status": status,
    }


def debt_to_dict(debt):
    unit = debt.unit

    payment_info = calculate_debt_payment(
        debt
    )

    return {
        "id": debt.id,

        "unit_id": debt.unit_id,

        "unit_number": unit.unit_number,

        "block_name": unit.block_name,

        "people": get_people_for_unit(unit),

        "residents": get_resident_names(unit),

        "owners": get_owner_names(unit),

        "amount": float(
            debt.amount or 0
        ),

        "paid_amount": float(
            payment_info["paid_amount"]
        ),

        "remaining_amount": float(
            payment_info["remaining_amount"]
        ),

        "status": payment_info["status"],

        "payment_count": len(
            debt.payments
        ),

        "period": debt.period,

        "description": debt.description,

        "created_at": (
            debt.created_at.isoformat()
            if debt.created_at
            else None
        ),
    }


def payment_to_dict(payment):
    debt = payment.debt
    unit = debt.unit

    return {
        "id": payment.id,

        "debt_id": payment.debt_id,

        "amount": float(
            payment.amount
        ),

        "payment_date":
            payment.payment_date.isoformat(),

        "payment_method":
            payment.payment_method,

        "description":
            payment.description,

        "created_at": (
            payment.created_at.isoformat()
            if payment.created_at
            else None
        ),

        "unit_id": unit.id,

        "unit_number":
            unit.unit_number,

        "block_name":
            unit.block_name,
    }


# --------------------------------------------------
# BORÇLARI GETİR
# --------------------------------------------------

@previous_period_debts_bp.route(
    "/apartment/<int:apartment_id>",
    methods=["GET"]
)
@jwt_required()
def get_previous_period_debts(apartment_id):

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
                "Apartman bulunamadı veya yetkiniz yok."
        }), 404

    debts = (
        PreviousPeriodDebt.query
        .join(
            Unit,
            PreviousPeriodDebt.unit_id == Unit.id
        )
        .filter(
            Unit.apartment_id == apartment_id
        )
        .order_by(
            Unit.block_name.asc(),
            Unit.unit_number.asc(),
            PreviousPeriodDebt.id.asc()
        )
        .all()
    )

    total_amount = Decimal("0.00")
    total_paid = Decimal("0.00")
    total_remaining = Decimal("0.00")

    result = []

    for debt in debts:

        data = debt_to_dict(debt)

        total_amount += Decimal(
            str(data["amount"])
        )

        total_paid += Decimal(
            str(data["paid_amount"])
        )

        total_remaining += Decimal(
            str(data["remaining_amount"])
        )

        result.append(data)

    return jsonify({
        "debts": result,

        "totals": {
            "amount": float(total_amount),
            "paid": float(total_paid),
            "remaining": float(total_remaining),
        }
    }), 200


# --------------------------------------------------
# BORÇ EKLE
# --------------------------------------------------

@previous_period_debts_bp.route(
    "",
    methods=["POST"]
)
@jwt_required()
def create_previous_period_debt():

    user_id = int(
        get_jwt_identity()
    )

    data = request.get_json() or {}

    unit_id = data.get("unit_id")
    amount = data.get("amount")
    period = data.get("period")
    description = data.get("description")

    if not unit_id:
        return jsonify({
            "message":
                "Daire seçilmelidir."
        }), 400

    if amount is None:
        return jsonify({
            "message":
                "Borç tutarı zorunludur."
        }), 400

    unit = (
        Unit.query
        .join(
            Apartment,
            Unit.apartment_id == Apartment.id
        )
        .filter(
            Unit.id == unit_id,
            Apartment.manager_id == user_id
        )
        .first()
    )

    if not unit:
        return jsonify({
            "message":
                "Daire bulunamadı veya yetkiniz yok."
        }), 404

    try:
        debt_amount = Decimal(
            str(amount)
        )
    except Exception:
        return jsonify({
            "message":
                "Geçerli bir borç tutarı giriniz."
        }), 400

    if debt_amount <= 0:
        return jsonify({
            "message":
                "Borç tutarı sıfırdan büyük olmalıdır."
        }), 400

    debt = PreviousPeriodDebt(
        unit_id=unit.id,
        amount=debt_amount,
        period=period,
        description=description,
    )

    db.session.add(debt)
    db.session.commit()

    return jsonify({
        "message":
            "Önceki dönem borcu başarıyla eklendi.",

        "debt":
            debt_to_dict(debt)
    }), 201


# --------------------------------------------------
# BORÇ GÜNCELLE
# --------------------------------------------------

@previous_period_debts_bp.route(
    "/<int:debt_id>",
    methods=["PUT"]
)
@jwt_required()
def update_previous_period_debt(debt_id):

    user_id = int(
        get_jwt_identity()
    )

    debt = get_owned_debt(
        debt_id,
        user_id
    )

    if not debt:
        return jsonify({
            "message":
                "Borç kaydı bulunamadı veya yetkiniz yok."
        }), 404

    data = request.get_json() or {}

    if "amount" in data:

        try:
            amount = Decimal(
                str(data["amount"])
            )
        except Exception:
            return jsonify({
                "message":
                    "Geçerli bir borç tutarı giriniz."
            }), 400

        if amount <= 0:
            return jsonify({
                "message":
                    "Borç tutarı sıfırdan büyük olmalıdır."
            }), 400

        paid_amount = sum(
            (
                Decimal(
                    str(payment.amount)
                )
                for payment in debt.payments
            ),
            Decimal("0.00")
        )

        if amount < paid_amount:
            return jsonify({
                "message": (
                    "Borç tutarı, daha önce "
                    "ödenen toplam tutardan düşük olamaz."
                )
            }), 400

        debt.amount = amount

    if "period" in data:
        debt.period = data.get("period")

    if "description" in data:
        debt.description = data.get("description")

    db.session.commit()

    return jsonify({
        "message":
            "Önceki dönem borcu güncellendi.",

        "debt":
            debt_to_dict(debt)
    }), 200


# --------------------------------------------------
# BORÇ SİL
# --------------------------------------------------

@previous_period_debts_bp.route(
    "/<int:debt_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_previous_period_debt(debt_id):

    user_id = int(
        get_jwt_identity()
    )

    debt = get_owned_debt(
        debt_id,
        user_id
    )

    if not debt:
        return jsonify({
            "message":
                "Borç kaydı bulunamadı veya yetkiniz yok."
        }), 404

    db.session.delete(debt)
    db.session.commit()

    return jsonify({
        "message":
            "Önceki dönem borcu silindi."
    }), 200


# --------------------------------------------------
# BORÇ ÖDEMELERİNİ GETİR
# --------------------------------------------------

@previous_period_debts_bp.route(
    "/<int:debt_id>/payments",
    methods=["GET"]
)
@jwt_required()
def get_debt_payments(debt_id):

    user_id = int(
        get_jwt_identity()
    )

    debt = get_owned_debt(
        debt_id,
        user_id
    )

    if not debt:
        return jsonify({
            "message":
                "Borç kaydı bulunamadı veya yetkiniz yok."
        }), 404

    payments = (
        PreviousPeriodDebtPayment.query
        .filter_by(
            debt_id=debt.id
        )
        .order_by(
            PreviousPeriodDebtPayment.payment_date.desc(),
            PreviousPeriodDebtPayment.id.desc()
        )
        .all()
    )

    return jsonify([
        payment_to_dict(payment)
        for payment in payments
    ]), 200


# --------------------------------------------------
# BORÇ ÖDEMESİ EKLE
# --------------------------------------------------

@previous_period_debts_bp.route(
    "/<int:debt_id>/payments",
    methods=["POST"]
)
@jwt_required()
def create_debt_payment(debt_id):

    user_id = int(
        get_jwt_identity()
    )

    debt = get_owned_debt(
        debt_id,
        user_id
    )

    if not debt:
        return jsonify({
            "message":
                "Borç kaydı bulunamadı veya yetkiniz yok."
        }), 404

    data = request.get_json() or {}

    amount = data.get("amount")

    if amount is None:
        return jsonify({
            "message":
                "Ödeme tutarı zorunludur."
        }), 400

    try:
        payment_amount = Decimal(
            str(amount)
        )
    except Exception:
        return jsonify({
            "message":
                "Geçerli bir ödeme tutarı giriniz."
        }), 400

    if payment_amount <= 0:
        return jsonify({
            "message":
                "Ödeme tutarı sıfırdan büyük olmalıdır."
        }), 400

    payment_info = calculate_debt_payment(
        debt
    )

    remaining_amount = payment_info[
        "remaining_amount"
    ]

    if remaining_amount <= 0:
        return jsonify({
            "message":
                "Bu borcun tamamı zaten ödenmiş."
        }), 400

    if payment_amount > remaining_amount:
        return jsonify({
            "message": (
                "Ödeme tutarı kalan borçtan "
                "fazla olamaz. "
                f"Kalan borç: "
                f"{float(remaining_amount):.2f} TL"
            )
        }), 400

    payment_date_text = data.get(
        "payment_date"
    )

    if payment_date_text:

        try:
            payment_date = datetime.strptime(
                payment_date_text,
                "%Y-%m-%d"
            ).date()

        except ValueError:
            return jsonify({
                "message":
                    "Ödeme tarihi YYYY-MM-DD formatında olmalıdır."
            }), 400

    else:
        payment_date = datetime.today().date()

    payment = PreviousPeriodDebtPayment(
        debt_id=debt.id,
        amount=payment_amount,
        payment_date=payment_date,
        payment_method=data.get(
            "payment_method"
        ),
        description=data.get(
            "description"
        ),
    )

    db.session.add(payment)
    db.session.commit()

    return jsonify({
        "message":
            "Ödeme başarıyla kaydedildi.",

        "payment":
            payment_to_dict(payment)
    }), 201


# --------------------------------------------------
# BORÇ ÖDEMESİ SİL
# --------------------------------------------------

@previous_period_debts_bp.route(
    "/payments/<int:payment_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_debt_payment(payment_id):

    user_id = int(
        get_jwt_identity()
    )

    payment = (
        PreviousPeriodDebtPayment.query
        .join(
            PreviousPeriodDebt,
            PreviousPeriodDebtPayment.debt_id ==
            PreviousPeriodDebt.id
        )
        .join(
            Unit,
            PreviousPeriodDebt.unit_id ==
            Unit.id
        )
        .join(
            Apartment,
            Unit.apartment_id ==
            Apartment.id
        )
        .filter(
            PreviousPeriodDebtPayment.id ==
            payment_id,

            Apartment.manager_id ==
            user_id
        )
        .first()
    )

    if not payment:
        return jsonify({
            "message":
                "Ödeme bulunamadı veya yetkiniz yok."
        }), 404

    db.session.delete(payment)
    db.session.commit()

    return jsonify({
        "message":
            "Ödeme başarıyla silindi."
    }), 200