from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Apartment, Unit


units_bp = Blueprint(
    "units",
    __name__,
    url_prefix="/api/units"
)


def get_owned_apartment(apartment_id, user_id):
    return Apartment.query.filter_by(
        id=apartment_id,
        manager_id=user_id
    ).first()


@units_bp.route("/apartment/<int:apartment_id>", methods=["GET"])
@jwt_required()
def get_units(apartment_id):
    user_id = int(get_jwt_identity())

    apartment = get_owned_apartment(
        apartment_id,
        user_id
    )

    if not apartment:
        return jsonify({
            "message": "Apartman bulunamadı"
        }), 404

    units = (
        Unit.query
        .filter_by(apartment_id=apartment_id)
        .order_by(
            Unit.block_name.asc(),
            Unit.unit_number.asc()
        )
        .all()
    )

    result = []

    for unit in units:
        active_relations = [
            relation
            for relation in unit.person_relations
            if relation.is_active
        ]

        owners = [
            relation.person.full_name
            for relation in active_relations
            if relation.relationship_type == "owner"
        ]

        tenants = [
            relation.person.full_name
            for relation in active_relations
            if relation.relationship_type == "tenant"
        ]

        residents = [
            relation.person.full_name
            for relation in active_relations
            if relation.is_resident
        ]

        result.append({
            "id": unit.id,
            "unit_number": unit.unit_number,
            "block_name": unit.block_name,
            "floor": unit.floor,
            "due_amount": float(unit.due_amount or 0),
            "is_occupied": len(residents) > 0,
            "owners": owners,
            "tenants": tenants,
            "residents": residents,
        })

    return jsonify(result), 200


@units_bp.route("", methods=["POST"])
@jwt_required()
def create_unit():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    apartment_id = data.get("apartment_id")

    unit_number = str(
        data.get("unit_number", "")
    ).strip()

    block_name = str(
        data.get("block_name", "")
    ).strip() or None

    if not apartment_id or not unit_number:
        return jsonify({
            "message":
            "Apartman ve daire numarası zorunludur"
        }), 400

    apartment = get_owned_apartment(
        apartment_id,
        user_id
    )

    if not apartment:
        return jsonify({
            "message": "Apartman bulunamadı"
        }), 404

    existing = Unit.query.filter_by(
        apartment_id=apartment_id,
        unit_number=unit_number,
        block_name=block_name
    ).first()

    if existing:
        return jsonify({
            "message":
            "Bu blokta bu daire numarası zaten kayıtlı"
        }), 409

    try:
        floor = (
            int(data.get("floor"))
            if data.get("floor") not in [None, ""]
            else None
        )

        due_amount = (
            float(data.get("due_amount"))
            if data.get("due_amount") not in [None, ""]
            else None
        )

    except (TypeError, ValueError):
        return jsonify({
            "message":
            "Kat veya aidat bilgisini kontrol edin"
        }), 400

    unit = Unit(
        apartment_id=apartment_id,
        unit_number=unit_number,
        block_name=block_name,
        floor=floor,
        due_amount=due_amount,
        is_occupied=False,
    )

    db.session.add(unit)
    db.session.commit()

    return jsonify({
        "message": "Daire oluşturuldu",
        "unit": {
            "id": unit.id,
            "unit_number": unit.unit_number,
            "block_name": unit.block_name,
            "floor": unit.floor,
            "due_amount": float(unit.due_amount or 0),
            "is_occupied": False,
            "owners": [],
            "tenants": [],
            "residents": [],
        }
    }), 201


@units_bp.route("/<int:unit_id>", methods=["PUT"])
@jwt_required()
def update_unit(unit_id):
    user_id = int(get_jwt_identity())

    unit = db.session.get(Unit, unit_id)

    if not unit:
        return jsonify({
            "message": "Daire bulunamadı"
        }), 404

    apartment = get_owned_apartment(
        unit.apartment_id,
        user_id
    )

    if not apartment:
        return jsonify({
            "message": "Yetkisiz işlem"
        }), 403

    data = request.get_json() or {}

    new_unit_number = str(
        data.get(
            "unit_number",
            unit.unit_number
        )
    ).strip()

    new_block_name = str(
        data.get(
            "block_name",
            unit.block_name or ""
        )
    ).strip() or None

    if not new_unit_number:
        return jsonify({
            "message":
            "Daire numarası boş olamaz"
        }), 400

    duplicate = Unit.query.filter(
        Unit.apartment_id == unit.apartment_id,
        Unit.unit_number == new_unit_number,
        Unit.id != unit.id
    )

    if new_block_name is None:
        duplicate = duplicate.filter(
            Unit.block_name.is_(None)
        )
    else:
        duplicate = duplicate.filter(
            Unit.block_name == new_block_name
        )

    duplicate = duplicate.first()

    if duplicate:
        return jsonify({
            "message":
            "Bu blokta bu daire numarası zaten kayıtlı"
        }), 409

    unit.unit_number = new_unit_number
    unit.block_name = new_block_name

    try:
        if "floor" in data:
            unit.floor = (
                int(data["floor"])
                if data["floor"] not in [None, ""]
                else None
            )

        if "due_amount" in data:
            unit.due_amount = (
                float(data["due_amount"])
                if data["due_amount"] not in [None, ""]
                else None
            )

    except (TypeError, ValueError):
        return jsonify({
            "message":
            "Kat veya aidat bilgisini kontrol edin"
        }), 400

    db.session.commit()

    active_relations = [
        relation
        for relation in unit.person_relations
        if relation.is_active
    ]

    owners = [
        relation.person.full_name
        for relation in active_relations
        if relation.relationship_type == "owner"
    ]

    tenants = [
        relation.person.full_name
        for relation in active_relations
        if relation.relationship_type == "tenant"
    ]

    residents = [
        relation.person.full_name
        for relation in active_relations
        if relation.is_resident
    ]

    unit.is_occupied = len(residents) > 0
    db.session.commit()

    return jsonify({
        "message": "Daire güncellendi",
        "unit": {
            "id": unit.id,
            "unit_number": unit.unit_number,
            "block_name": unit.block_name,
            "floor": unit.floor,
            "due_amount": float(unit.due_amount or 0),
            "is_occupied": unit.is_occupied,
            "owners": owners,
            "tenants": tenants,
            "residents": residents,
        }
    }), 200


@units_bp.route("/<int:unit_id>", methods=["DELETE"])
@jwt_required()
def delete_unit(unit_id):
    user_id = int(get_jwt_identity())

    unit = db.session.get(Unit, unit_id)

    if not unit:
        return jsonify({
            "message": "Daire bulunamadı"
        }), 404

    apartment = get_owned_apartment(
        unit.apartment_id,
        user_id
    )

    if not apartment:
        return jsonify({
            "message": "Yetkisiz işlem"
        }), 403

    db.session.delete(unit)
    db.session.commit()

    return jsonify({
        "message": "Daire silindi"
    }), 200
