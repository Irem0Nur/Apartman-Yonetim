from datetime import datetime
from decimal import Decimal

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Transaction, Apartment, Payment, Due, Unit


transactions_bp = Blueprint(
    "transactions",
    __name__,
    url_prefix="/api/transactions"
)


def transaction_to_dict(transaction):
    return {
        "id": transaction.id,
        "apartment_id": transaction.apartment_id,
        "transaction_type": transaction.transaction_type,
        "category": transaction.category,
        "amount": float(transaction.amount),
        "transaction_date": (
            transaction.transaction_date.isoformat()
            if transaction.transaction_date
            else None
        ),
        "description": transaction.description,
        "created_at": (
            transaction.created_at.isoformat()
            if transaction.created_at
            else None
        ),
    }


def get_owned_apartment(apartment_id, user_id):
    return Apartment.query.filter_by(
        id=apartment_id,
        manager_id=user_id
    ).first()


@transactions_bp.route(
    "/apartment/<int:apartment_id>",
    methods=["GET"]
)
@jwt_required()
def get_transactions(apartment_id):
    user_id = int(get_jwt_identity())

    apartment = get_owned_apartment(
        apartment_id,
        user_id
    )

    if not apartment:
        return jsonify({
            "message": "Apartman bulunamadı veya yetkiniz yok."
        }), 404

    query = Transaction.query.filter_by(
        apartment_id=apartment_id
    )

    year = request.args.get("year", type=int)
    month = request.args.get("month", type=int)
    transaction_type = request.args.get("type")

    if year:
        query = query.filter(
            db.extract(
                "year",
                Transaction.transaction_date
            ) == year
        )

    if month:
        query = query.filter(
            db.extract(
                "month",
                Transaction.transaction_date
            ) == month
        )

    if transaction_type in ["income", "expense"]:
        query = query.filter(
            Transaction.transaction_type == transaction_type
        )

    transactions = (
        query
        .order_by(
            Transaction.transaction_date.desc(),
            Transaction.id.desc()
        )
        .all()
    )

    return jsonify([
        transaction_to_dict(transaction)
        for transaction in transactions
    ]), 200


@transactions_bp.route(
    "/summary/<int:apartment_id>",
    methods=["GET"]
)
@jwt_required()
def get_financial_summary(apartment_id):
    user_id = int(get_jwt_identity())

    apartment = get_owned_apartment(
        apartment_id,
        user_id
    )

    if not apartment:
        return jsonify({
            "message": "Apartman bulunamadı veya yetkiniz yok."
        }), 404

    year = request.args.get("year", type=int)
    month = request.args.get("month", type=int)

    if not year or not month:
        return jsonify({
            "message": "Yıl ve ay bilgisi zorunludur."
        }), 400

    # ---------------------------------
    # MANUEL GELİR / GİDER KAYITLARI
    # ---------------------------------

    transactions = (
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

    other_income = Decimal("0.00")
    total_expense = Decimal("0.00")

    for transaction in transactions:
        amount = Decimal(str(transaction.amount))

        if transaction.transaction_type == "income":
            other_income += amount

        elif transaction.transaction_type == "expense":
            total_expense += amount

    # ---------------------------------
    # AİDAT TAHSİLATLARI
    #
    # Aidat dönemi değil,
    # gerçek ödeme tarihi dikkate alınır.
    # ---------------------------------

    payments = (
        Payment.query
        .join(Due, Payment.due_id == Due.id)
        .join(Unit, Due.unit_id == Unit.id)
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
            Decimal(str(payment.amount))
            for payment in payments
        ),
        Decimal("0.00")
    )

    # ---------------------------------
    # GENEL HESAPLAR
    # ---------------------------------

    total_income = dues_income + other_income

    net_balance = total_income - total_expense

    return jsonify({
        "year": year,
        "month": month,

        "dues_income": float(dues_income),

        "other_income": float(other_income),

        "total_income": float(total_income),

        "total_expense": float(total_expense),

        "net_balance": float(net_balance),

        "payment_count": len(payments),
    }), 200


@transactions_bp.route("", methods=["POST"])
@jwt_required()
def create_transaction():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    apartment_id = data.get("apartment_id")
    transaction_type = data.get("transaction_type")
    category = data.get("category")
    amount = data.get("amount")
    transaction_date_text = data.get("transaction_date")
    description = data.get("description")

    apartment = get_owned_apartment(
        apartment_id,
        user_id
    )

    if not apartment:
        return jsonify({
            "message": "Apartman bulunamadı veya yetkiniz yok."
        }), 404

    if transaction_type not in ["income", "expense"]:
        return jsonify({
            "message": "İşlem türü gelir veya gider olmalıdır."
        }), 400

    if not category:
        return jsonify({
            "message": "Kategori zorunludur."
        }), 400

    try:
        amount_decimal = Decimal(str(amount))
    except Exception:
        return jsonify({
            "message": "Geçerli bir tutar giriniz."
        }), 400

    if amount_decimal <= 0:
        return jsonify({
            "message": "Tutar sıfırdan büyük olmalıdır."
        }), 400

    if transaction_date_text:
        try:
            transaction_date = datetime.strptime(
                transaction_date_text,
                "%Y-%m-%d"
            ).date()
        except ValueError:
            return jsonify({
                "message": "Tarih YYYY-MM-DD formatında olmalıdır."
            }), 400
    else:
        transaction_date = datetime.today().date()

    transaction = Transaction(
        apartment_id=apartment.id,
        transaction_type=transaction_type,
        category=category.strip(),
        amount=amount_decimal,
        transaction_date=transaction_date,
        description=(
            description.strip()
            if description
            else None
        ),
    )

    db.session.add(transaction)
    db.session.commit()

    return jsonify({
        "message": "Gelir/Gider kaydı başarıyla eklendi.",
        "transaction": transaction_to_dict(transaction)
    }), 201


@transactions_bp.route(
    "/<int:transaction_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_transaction(transaction_id):
    user_id = int(get_jwt_identity())

    transaction = (
        Transaction.query
        .join(
            Apartment,
            Transaction.apartment_id == Apartment.id
        )
        .filter(
            Transaction.id == transaction_id,
            Apartment.manager_id == user_id
        )
        .first()
    )

    if not transaction:
        return jsonify({
            "message": "Kayıt bulunamadı veya yetkiniz yok."
        }), 404

    db.session.delete(transaction)
    db.session.commit()

    return jsonify({
        "message": "Kayıt başarıyla silindi."
    }), 200