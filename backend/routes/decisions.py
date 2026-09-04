from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from extensions import db
from models import Apartment, Decision


decisions_bp = Blueprint(
    "decisions",
    __name__,
    url_prefix="/api/decisions"
)


def get_owned_apartment(
    apartment_id,
    user_id
):
    return Apartment.query.filter_by(
        id=apartment_id,
        manager_id=user_id
    ).first()


def decision_to_dict(decision):
    return {
        "id": decision.id,

        "apartment_id":
            decision.apartment_id,

        "decision_number":
            decision.decision_number,

        "decision_date": (
            decision.decision_date.isoformat()
            if decision.decision_date
            else None
        ),

        "decision_type":
            decision.decision_type,

        "title":
            decision.title,

        "description":
            decision.description,

        "notes":
            decision.notes,

        "created_at": (
            decision.created_at.isoformat()
            if decision.created_at
            else None
        ),

        "updated_at": (
            decision.updated_at.isoformat()
            if decision.updated_at
            else None
        ),
    }


# ==========================================================
# KARARLARI LİSTELE
# ==========================================================

@decisions_bp.route(
    "/apartment/<int:apartment_id>",
    methods=["GET"]
)
@jwt_required()
def get_decisions(apartment_id):
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

    query = Decision.query.filter_by(
        apartment_id=apartment_id
    )

    year = request.args.get(
        "year",
        type=int
    )

    search = (
        request.args.get(
            "search",
            ""
        )
        .strip()
    )

    if year:
        query = query.filter(
            db.extract(
                "year",
                Decision.decision_date
            ) == year
        )

    if search:
        search_value = (
            f"%{search}%"
        )

        query = query.filter(
            db.or_(
                Decision.decision_number.ilike(
                    search_value
                ),
                Decision.title.ilike(
                    search_value
                ),
                Decision.description.ilike(
                    search_value
                ),
                Decision.decision_type.ilike(
                    search_value
                )
            )
        )

    decisions = (
        query
        .order_by(
            Decision.decision_date.desc(),
            Decision.id.desc()
        )
        .all()
    )

    return jsonify([
        decision_to_dict(decision)
        for decision in decisions
    ]), 200


# ==========================================================
# KARAR EKLE
# ==========================================================

@decisions_bp.route(
    "",
    methods=["POST"]
)
@jwt_required()
def create_decision():
    user_id = int(
        get_jwt_identity()
    )

    data = (
        request.get_json()
        or {}
    )

    apartment_id = data.get(
        "apartment_id"
    )

    decision_number = (
        str(
            data.get(
                "decision_number",
                ""
            )
        )
        .strip()
    )

    decision_date_text = data.get(
        "decision_date"
    )

    decision_type = (
        data.get(
            "decision_type",
            "Kat Malikleri Kurulu"
        )
        or "Kat Malikleri Kurulu"
    ).strip()

    title = (
        data.get(
            "title",
            ""
        )
        or ""
    ).strip()

    description = (
        data.get(
            "description",
            ""
        )
        or ""
    ).strip()

    notes = (
        data.get(
            "notes",
            ""
        )
        or ""
    ).strip()


    apartment = get_owned_apartment(
        apartment_id,
        user_id
    )

    if not apartment:
        return jsonify({
            "message":
                "Apartman bulunamadı veya yetkiniz yok."
        }), 404


    if not decision_number:
        return jsonify({
            "message":
                "Karar numarası zorunludur."
        }), 400


    if not decision_date_text:
        return jsonify({
            "message":
                "Karar tarihi zorunludur."
        }), 400


    if not title:
        return jsonify({
            "message":
                "Karar konusu zorunludur."
        }), 400


    if not description:
        return jsonify({
            "message":
                "Karar metni zorunludur."
        }), 400


    try:
        decision_date = datetime.strptime(
            decision_date_text,
            "%Y-%m-%d"
        ).date()

    except ValueError:
        return jsonify({
            "message":
                "Geçerli bir karar tarihi giriniz."
        }), 400


    existing = Decision.query.filter_by(
        apartment_id=apartment_id,
        decision_number=decision_number
    ).first()

    if existing:
        return jsonify({
            "message":
                "Bu karar numarası daha önce kullanılmış."
        }), 409


    decision = Decision(
        apartment_id=apartment_id,

        decision_number=
            decision_number,

        decision_date=
            decision_date,

        decision_type=
            decision_type,

        title=
            title,

        description=
            description,

        notes=(
            notes
            if notes
            else None
        )
    )

    db.session.add(
        decision
    )

    db.session.commit()

    return jsonify({
        "message":
            "Karar başarıyla kaydedildi.",

        "decision":
            decision_to_dict(
                decision
            )
    }), 201


# ==========================================================
# KARAR GÜNCELLE
# ==========================================================

@decisions_bp.route(
    "/<int:decision_id>",
    methods=["PUT"]
)
@jwt_required()
def update_decision(decision_id):
    user_id = int(
        get_jwt_identity()
    )

    decision = (
        Decision.query
        .join(
            Apartment,
            Decision.apartment_id
            == Apartment.id
        )
        .filter(
            Decision.id
            == decision_id,

            Apartment.manager_id
            == user_id
        )
        .first()
    )

    if not decision:
        return jsonify({
            "message":
                "Karar bulunamadı veya yetkiniz yok."
        }), 404


    data = (
        request.get_json()
        or {}
    )


    decision_number = (
        str(
            data.get(
                "decision_number",
                decision.decision_number
            )
        )
        .strip()
    )

    decision_date_text = (
        data.get(
            "decision_date"
        )
    )

    decision_type = (
        data.get(
            "decision_type",
            decision.decision_type
        )
        or decision.decision_type
    ).strip()

    title = (
        data.get(
            "title",
            decision.title
        )
        or ""
    ).strip()

    description = (
        data.get(
            "description",
            decision.description
        )
        or ""
    ).strip()

    notes = (
        data.get(
            "notes",
            decision.notes or ""
        )
        or ""
    ).strip()


    if not decision_number:
        return jsonify({
            "message":
                "Karar numarası zorunludur."
        }), 400


    if not title:
        return jsonify({
            "message":
                "Karar konusu zorunludur."
        }), 400


    if not description:
        return jsonify({
            "message":
                "Karar metni zorunludur."
        }), 400


    if decision_date_text:

        try:
            decision_date = (
                datetime.strptime(
                    decision_date_text,
                    "%Y-%m-%d"
                ).date()
            )

        except ValueError:
            return jsonify({
                "message":
                    "Geçerli bir tarih giriniz."
            }), 400

    else:
        decision_date = (
            decision.decision_date
        )


    duplicate = (
        Decision.query
        .filter(
            Decision.apartment_id
            == decision.apartment_id,

            Decision.decision_number
            == decision_number,

            Decision.id
            != decision.id
        )
        .first()
    )

    if duplicate:
        return jsonify({
            "message":
                "Bu karar numarası başka bir kayıtta kullanılıyor."
        }), 409


    decision.decision_number = (
        decision_number
    )

    decision.decision_date = (
        decision_date
    )

    decision.decision_type = (
        decision_type
    )

    decision.title = (
        title
    )

    decision.description = (
        description
    )

    decision.notes = (
        notes
        if notes
        else None
    )


    db.session.commit()


    return jsonify({
        "message":
            "Karar başarıyla güncellendi.",

        "decision":
            decision_to_dict(
                decision
            )
    }), 200


# ==========================================================
# KARAR SİL
# ==========================================================

@decisions_bp.route(
    "/<int:decision_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_decision(decision_id):
    user_id = int(
        get_jwt_identity()
    )

    decision = (
        Decision.query
        .join(
            Apartment,
            Decision.apartment_id
            == Apartment.id
        )
        .filter(
            Decision.id
            == decision_id,

            Apartment.manager_id
            == user_id
        )
        .first()
    )

    if not decision:
        return jsonify({
            "message":
                "Karar bulunamadı veya yetkiniz yok."
        }), 404


    db.session.delete(
        decision
    )

    db.session.commit()


    return jsonify({
        "message":
            "Karar başarıyla silindi."
    }), 200