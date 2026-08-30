from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Apartment


apartments_bp = Blueprint(
    "apartments",
    __name__,
    url_prefix="/api/apartments"
)


@apartments_bp.route("", methods=["GET"])
@jwt_required()
def get_apartments():
    user_id = int(get_jwt_identity())

    apartments = Apartment.query.filter_by(
        manager_id=user_id
    ).order_by(Apartment.created_at.desc()).all()

    return jsonify([
        {
            "id": apartment.id,
            "name": apartment.name,
            "address": apartment.address,
            "block_count": apartment.block_count,
            "floor_count": apartment.floor_count,
            "unit_count": apartment.unit_count,
            "default_due_amount": float(
                apartment.default_due_amount or 0
            ),
        }
        for apartment in apartments
    ]), 200


@apartments_bp.route("", methods=["POST"])
@jwt_required()
def create_apartment():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    name = str(data.get("name", "")).strip()
    address = str(data.get("address", "")).strip()

    if not name:
        return jsonify({
            "message": "Apartman adı zorunludur"
        }), 400

    try:
        block_count = int(data.get("block_count") or 1)
        floor_count = int(data.get("floor_count") or 0)
        unit_count = int(data.get("unit_count") or 0)
        default_due_amount = float(
            data.get("default_due_amount") or 0
        )
    except (TypeError, ValueError):
        return jsonify({
            "message": "Sayısal alanları kontrol edin"
        }), 400

    if block_count < 1:
        return jsonify({
            "message": "Blok sayısı en az 1 olmalıdır"
        }), 400

    if floor_count < 0 or unit_count < 0 or default_due_amount < 0:
        return jsonify({
            "message": "Değerler negatif olamaz"
        }), 400

    apartment = Apartment(
        name=name,
        address=address or None,
        block_count=block_count,
        floor_count=floor_count or None,
        unit_count=unit_count or None,
        default_due_amount=default_due_amount,
        manager_id=user_id
    )

    db.session.add(apartment)
    db.session.commit()

    return jsonify({
        "message": "Apartman başarıyla oluşturuldu",
        "apartment": {
            "id": apartment.id,
            "name": apartment.name,
            "address": apartment.address,
            "block_count": apartment.block_count,
            "floor_count": apartment.floor_count,
            "unit_count": apartment.unit_count,
            "default_due_amount": float(
                apartment.default_due_amount or 0
            )
        }
    }), 201