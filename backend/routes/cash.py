from decimal import Decimal

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Apartment, Unit, Due, Payment, Transaction


cash_bp = Blueprint(
    "cash",
    __name__,
    url_prefix="/api/cash"
)


def get_owned_apartment(apartment_id, user_id):
    return Apartment.query.filter_by(
        id=apartment_id,
        manager_id=user_id
    ).first()


def decimal_value(value):
    if value is None:
        return Decimal("0.00")

    return Decimal(str(value))


def get_unit_label(unit):
    if not unit:
        return "-"

    block_name = (
        getattr(unit, "block_name", None)
        or ""
    )

    unit_number = (
        getattr(unit, "unit_number", None)
        or getattr(unit, "number", None)
        or getattr(unit, "door_number", None)
        or getattr(unit, "apartment_number", None)
        or unit.id
    )

    if block_name:
        return f"{block_name} / Daire {unit_number}"

    return f"Daire {unit_number}"


@cash_bp.route(
    "/apartment/<int:apartment_id>",
    methods=["GET"]
)
@jwt_required()
def get_cash(apartment_id):
    user_id = int(get_jwt_identity())

    apartment = get_owned_apartment(
        apartment_id,
        user_id
    )

    if not apartment:
        return jsonify({
            "message": "Apartman bulunamadı veya yetkiniz yok."
        }), 404

    year = request.args.get(
        "year",
        type=int
    )

    month = request.args.get(
        "month",
        type=int
    )

    if not year or not month:
        return jsonify({
            "message": "Yıl ve ay bilgisi zorunludur."
        }), 400

    # =====================================================
    # TÜM ZAMANLAR KASA BAKİYESİ
    # =====================================================

    all_payments = (
        Payment.query
        .join(
            Due,
            Payment.due_id == Due.id
        )
        .join(
            Unit,
            Due.unit_id == Unit.id
        )
        .filter(
            Unit.apartment_id == apartment_id
        )
        .all()
    )

    all_transactions = (
        Transaction.query
        .filter(
            Transaction.apartment_id == apartment_id
        )
        .all()
    )

    all_dues_income = sum(
        (
            decimal_value(payment.amount)
            for payment in all_payments
        ),
        Decimal("0.00")
    )

    all_other_income = sum(
        (
            decimal_value(transaction.amount)
            for transaction in all_transactions
            if transaction.transaction_type == "income"
        ),
        Decimal("0.00")
    )

    all_expense = sum(
        (
            decimal_value(transaction.amount)
            for transaction in all_transactions
            if transaction.transaction_type == "expense"
        ),
        Decimal("0.00")
    )

    cash_balance = (
        all_dues_income
        + all_other_income
        - all_expense
    )

    # =====================================================
    # SEÇİLEN DÖNEM - AİDAT TAHSİLATLARI
    # =====================================================

    period_payments = (
        Payment.query
        .join(
            Due,
            Payment.due_id == Due.id
        )
        .join(
            Unit,
            Due.unit_id == Unit.id
        )
        .filter(
            Unit.apartment_id == apartment_id,
            db.extract(
                "year",
                Payment.payment_date
            ) == year,
            db.extract(
                "month",
                Payment.payment_date
            ) == month
        )
        .all()
    )

    dues_income = sum(
        (
            decimal_value(payment.amount)
            for payment in period_payments
        ),
        Decimal("0.00")
    )

    # =====================================================
    # SEÇİLEN DÖNEM - DİĞER GELİR / GİDER
    # =====================================================

    period_transactions = (
        Transaction.query
        .filter(
            Transaction.apartment_id == apartment_id,
            db.extract(
                "year",
                Transaction.transaction_date
            ) == year,
            db.extract(
                "month",
                Transaction.transaction_date
            ) == month
        )
        .all()
    )

    other_income = sum(
        (
            decimal_value(transaction.amount)
            for transaction in period_transactions
            if transaction.transaction_type == "income"
        ),
        Decimal("0.00")
    )

    total_expense = sum(
        (
            decimal_value(transaction.amount)
            for transaction in period_transactions
            if transaction.transaction_type == "expense"
        ),
        Decimal("0.00")
    )

    period_income = (
        dues_income
        + other_income
    )

    period_net = (
        period_income
        - total_expense
    )

    # =====================================================
    # HAREKET LİSTESİ
    # =====================================================

    movements = []

    for payment in period_payments:
        due = payment.due
        unit = due.unit if due else None

        movements.append({
            "id": f"payment-{payment.id}",
            "source_id": payment.id,
            "source_type": "payment",
            "movement_type": "income",
            "category": "Aidat Tahsilatı",
            "amount": float(
                decimal_value(payment.amount)
            ),
            "date": (
                payment.payment_date.isoformat()
                if payment.payment_date
                else None
            ),
            "description": (
                f"{get_unit_label(unit)}"
                f" - {due.month}/{due.year} aidatı"
                if due
                else "Aidat tahsilatı"
            ),
            "payment_method": (
                payment.payment_method
                if payment.payment_method
                else None
            ),
            "deletable": False,
        })

    for transaction in period_transactions:
        movements.append({
            "id": f"transaction-{transaction.id}",
            "source_id": transaction.id,
            "source_type": "transaction",
            "movement_type": transaction.transaction_type,
            "category": transaction.category,
            "amount": float(
                decimal_value(transaction.amount)
            ),
            "date": (
                transaction.transaction_date.isoformat()
                if transaction.transaction_date
                else None
            ),
            "description": (
                transaction.description
                or "-"
            ),
            "payment_method": None,
            "deletable": True,
        })

    movements.sort(
        key=lambda item: (
            item["date"] or "",
            item["id"]
        ),
        reverse=True
    )

    return jsonify({
        "year": year,
        "month": month,

        "cash_balance": float(
            cash_balance
        ),

        "period": {
            "dues_income": float(
                dues_income
            ),
            "other_income": float(
                other_income
            ),
            "total_income": float(
                period_income
            ),
            "total_expense": float(
                total_expense
            ),
            "net": float(
                period_net
            ),
        },

        "movement_count": len(
            movements
        ),

        "movements": movements,
    }), 200