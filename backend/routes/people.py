from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Apartment, Unit, Person, UnitPerson


people_bp = Blueprint(
    "people",
    __name__,
    url_prefix="/api/people"
)


ALLOWED_RELATIONSHIP_TYPES = {
    "owner",
    "tenant",
    "resident",
    "family",
}


def get_owned_apartment(apartment_id, user_id):
    return Apartment.query.filter_by(
        id=apartment_id,
        manager_id=user_id
    ).first()


def get_owned_unit(unit_id, user_id):
    return (
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


def relation_to_dict(relation):
    person = relation.person
    unit = relation.unit

    return {
        "relation_id": relation.id,

        "person": {
            "id": person.id,
            "first_name": person.first_name,
            "last_name": person.last_name,
            "full_name": person.full_name,
            "phone": person.phone,
            "email": person.email,
            "notes": person.notes,
        },

        "unit": {
            "id": unit.id,
            "unit_number": unit.unit_number,
            "block_name": unit.block_name,
            "floor": unit.floor,
        },

        "relationship_type": relation.relationship_type,
        "is_resident": relation.is_resident,
        "is_active": relation.is_active,

        "start_date": (
            relation.start_date.isoformat()
            if relation.start_date
            else None
        ),

        "end_date": (
            relation.end_date.isoformat()
            if relation.end_date
            else None
        ),
    }


@people_bp.route(
    "/apartment/<int:apartment_id>",
    methods=["GET"]
)
@jwt_required()
def get_people(apartment_id):
    user_id = int(get_jwt_identity())

    apartment = get_owned_apartment(
        apartment_id,
        user_id
    )

    if not apartment:
        return jsonify({
            "message": "Apartman bulunamadı"
        }), 404

    relations = (
        UnitPerson.query
        .join(
            Unit,
            UnitPerson.unit_id == Unit.id
        )
        .filter(
            Unit.apartment_id == apartment_id
        )
        .order_by(
            Unit.block_name.asc(),
            Unit.unit_number.asc(),
            UnitPerson.id.asc()
        )
        .all()
    )

    return jsonify([
        relation_to_dict(relation)
        for relation in relations
    ]), 200


@people_bp.route("", methods=["POST"])
@jwt_required()
def create_person():
    user_id = int(get_jwt_identity())

    data = request.get_json() or {}

    first_name = str(
        data.get("first_name", "")
    ).strip()

    last_name = str(
        data.get("last_name", "")
    ).strip()

    phone = str(
        data.get("phone", "")
    ).strip() or None

    email = str(
        data.get("email", "")
    ).strip() or None

    notes = str(
        data.get("notes", "")
    ).strip() or None

    unit_id = data.get("unit_id")

    relationship_type = str(
        data.get("relationship_type", "")
    ).strip().lower()

    is_resident = bool(
        data.get("is_resident", False)
    )

    if not first_name or not last_name:
        return jsonify({
            "message": "Ad ve soyad zorunludur"
        }), 400

    if not unit_id:
        return jsonify({
            "message": "Daire seçimi zorunludur"
        }), 400

    if relationship_type not in ALLOWED_RELATIONSHIP_TYPES:
        return jsonify({
            "message": "Geçersiz kişi rolü"
        }), 400

    unit = get_owned_unit(
        unit_id,
        user_id
    )

    if not unit:
        return jsonify({
            "message": "Daire bulunamadı"
        }), 404

    person = Person(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        email=email,
        notes=notes,
    )

    db.session.add(person)
    db.session.flush()

    relation = UnitPerson(
        unit_id=unit.id,
        person_id=person.id,
        relationship_type=relationship_type,
        is_resident=is_resident,
        is_active=True,
    )

    db.session.add(relation)

    # Dairede aktif şekilde yaşayan biri varsa
    # daireyi dolu kabul ediyoruz.
    if is_resident:
        unit.is_occupied = True

    db.session.commit()

    return jsonify({
        "message": "Kişi başarıyla eklendi",
        "relation": relation_to_dict(relation)
    }), 201


@people_bp.route(
    "/<int:relation_id>",
    methods=["PUT"]
)
@jwt_required()
def update_person(relation_id):
    user_id = int(get_jwt_identity())

    relation = db.session.get(
        UnitPerson,
        relation_id
    )

    if not relation:
        return jsonify({
            "message": "Kişi kaydı bulunamadı"
        }), 404

    current_unit = get_owned_unit(
        relation.unit_id,
        user_id
    )

    if not current_unit:
        return jsonify({
            "message": "Yetkisiz işlem"
        }), 403

    data = request.get_json() or {}

    person = relation.person

    if "first_name" in data:
        first_name = str(
            data["first_name"]
        ).strip()

        if not first_name:
            return jsonify({
                "message": "Ad boş olamaz"
            }), 400

        person.first_name = first_name

    if "last_name" in data:
        last_name = str(
            data["last_name"]
        ).strip()

        if not last_name:
            return jsonify({
                "message": "Soyad boş olamaz"
            }), 400

        person.last_name = last_name

    if "phone" in data:
        person.phone = str(
            data["phone"]
        ).strip() or None

    if "email" in data:
        person.email = str(
            data["email"]
        ).strip() or None

    if "notes" in data:
        person.notes = str(
            data["notes"]
        ).strip() or None

    if "unit_id" in data:
        new_unit = get_owned_unit(
            data["unit_id"],
            user_id
        )

        if not new_unit:
            return jsonify({
                "message": "Yeni daire bulunamadı"
            }), 404

        relation.unit_id = new_unit.id

    if "relationship_type" in data:
        relationship_type = str(
            data["relationship_type"]
        ).strip().lower()

        if relationship_type not in ALLOWED_RELATIONSHIP_TYPES:
            return jsonify({
                "message": "Geçersiz kişi rolü"
            }), 400

        relation.relationship_type = relationship_type

    if "is_resident" in data:
        relation.is_resident = bool(
            data["is_resident"]
        )

    db.session.commit()

    refresh_unit_occupancy(
        current_unit.id
    )

    if relation.unit_id != current_unit.id:
        refresh_unit_occupancy(
            relation.unit_id
        )

    db.session.commit()

    return jsonify({
        "message": "Kişi bilgileri güncellendi",
        "relation": relation_to_dict(relation)
    }), 200


def refresh_unit_occupancy(unit_id):
    unit = db.session.get(
        Unit,
        unit_id
    )

    if not unit:
        return

    active_resident = UnitPerson.query.filter_by(
        unit_id=unit_id,
        is_active=True,
        is_resident=True
    ).first()

    unit.is_occupied = (
        active_resident is not None
    )


@people_bp.route(
    "/<int:relation_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_person_relation(relation_id):
    user_id = int(get_jwt_identity())

    relation = db.session.get(
        UnitPerson,
        relation_id
    )

    if not relation:
        return jsonify({
            "message": "Kişi kaydı bulunamadı"
        }), 404

    unit = get_owned_unit(
        relation.unit_id,
        user_id
    )

    if not unit:
        return jsonify({
            "message": "Yetkisiz işlem"
        }), 403

    unit_id = relation.unit_id
    person = relation.person

    db.session.delete(relation)
    db.session.flush()

    remaining_relations = UnitPerson.query.filter_by(
        person_id=person.id
    ).count()

    # Kişi hiçbir daireyle ilişkili değilse
    # kişi kaydını da temizliyoruz.
    if remaining_relations == 0:
        db.session.delete(person)

    refresh_unit_occupancy(unit_id)

    db.session.commit()

    return jsonify({
        "message": "Kişi ilişkisi silindi"
    }), 200