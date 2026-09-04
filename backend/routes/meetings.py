from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from extensions import db
from models import Apartment, Meeting


meetings_bp = Blueprint(
    "meetings",
    __name__,
    url_prefix="/api/meetings"
)


def get_owned_apartment(
    apartment_id,
    user_id
):
    return Apartment.query.filter_by(
        id=apartment_id,
        manager_id=user_id
    ).first()


def meeting_to_dict(meeting):
    return {
        "id": meeting.id,

        "apartment_id":
            meeting.apartment_id,

        "title":
            meeting.title,

        "meeting_type":
            meeting.meeting_type,

        "meeting_date": (
            meeting.meeting_date.isoformat()
            if meeting.meeting_date
            else None
        ),

        "location":
            meeting.location,

        "agenda":
            meeting.agenda,

        "notes":
            meeting.notes,

        "status":
            meeting.status,

        "created_at": (
            meeting.created_at.isoformat()
            if meeting.created_at
            else None
        ),

        "updated_at": (
            meeting.updated_at.isoformat()
            if meeting.updated_at
            else None
        ),
    }


@meetings_bp.route(
    "/apartment/<int:apartment_id>",
    methods=["GET"]
)
@jwt_required()
def get_meetings(apartment_id):
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

    query = Meeting.query.filter_by(
        apartment_id=apartment_id
    )

    year = request.args.get(
        "year",
        type=int
    )

    status = request.args.get(
        "status"
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
                Meeting.meeting_date
            ) == year
        )

    if status in [
        "planned",
        "completed",
        "cancelled"
    ]:
        query = query.filter(
            Meeting.status == status
        )

    if search:
        value = f"%{search}%"

        query = query.filter(
            db.or_(
                Meeting.title.ilike(value),
                Meeting.meeting_type.ilike(value),
                Meeting.location.ilike(value),
                Meeting.agenda.ilike(value)
            )
        )

    meetings = (
        query
        .order_by(
            Meeting.meeting_date.desc(),
            Meeting.id.desc()
        )
        .all()
    )

    return jsonify([
        meeting_to_dict(meeting)
        for meeting in meetings
    ]), 200


@meetings_bp.route(
    "",
    methods=["POST"]
)
@jwt_required()
def create_meeting():
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

    title = (
        data.get(
            "title",
            ""
        )
        or ""
    ).strip()

    meeting_type = (
        data.get(
            "meeting_type",
            "Olağan Toplantı"
        )
        or "Olağan Toplantı"
    ).strip()

    meeting_date_text = data.get(
        "meeting_date"
    )

    location = (
        data.get(
            "location",
            ""
        )
        or ""
    ).strip()

    agenda = (
        data.get(
            "agenda",
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

    status = (
        data.get(
            "status",
            "planned"
        )
        or "planned"
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

    if not title:
        return jsonify({
            "message":
                "Toplantı başlığı zorunludur."
        }), 400

    if not meeting_date_text:
        return jsonify({
            "message":
                "Toplantı tarihi zorunludur."
        }), 400

    if not agenda:
        return jsonify({
            "message":
                "Toplantı gündemi zorunludur."
        }), 400

    if status not in [
        "planned",
        "completed",
        "cancelled"
    ]:
        return jsonify({
            "message":
                "Geçersiz toplantı durumu."
        }), 400

    try:
        meeting_date = datetime.fromisoformat(
            meeting_date_text
        )

    except ValueError:
        return jsonify({
            "message":
                "Geçerli bir toplantı tarihi giriniz."
        }), 400

    meeting = Meeting(
        apartment_id=apartment.id,
        title=title,
        meeting_type=meeting_type,
        meeting_date=meeting_date,
        location=(
            location
            if location
            else None
        ),
        agenda=agenda,
        notes=(
            notes
            if notes
            else None
        ),
        status=status
    )

    db.session.add(
        meeting
    )

    db.session.commit()

    return jsonify({
        "message":
            "Toplantı başarıyla kaydedildi.",

        "meeting":
            meeting_to_dict(
                meeting
            )
    }), 201


@meetings_bp.route(
    "/<int:meeting_id>",
    methods=["PUT"]
)
@jwt_required()
def update_meeting(meeting_id):
    user_id = int(
        get_jwt_identity()
    )

    meeting = (
        Meeting.query
        .join(
            Apartment,
            Meeting.apartment_id
            == Apartment.id
        )
        .filter(
            Meeting.id
            == meeting_id,

            Apartment.manager_id
            == user_id
        )
        .first()
    )

    if not meeting:
        return jsonify({
            "message":
                "Toplantı bulunamadı veya yetkiniz yok."
        }), 404

    data = (
        request.get_json()
        or {}
    )

    title = (
        data.get(
            "title",
            meeting.title
        )
        or ""
    ).strip()

    meeting_type = (
        data.get(
            "meeting_type",
            meeting.meeting_type
        )
        or meeting.meeting_type
    ).strip()

    location = (
        data.get(
            "location",
            meeting.location or ""
        )
        or ""
    ).strip()

    agenda = (
        data.get(
            "agenda",
            meeting.agenda
        )
        or ""
    ).strip()

    notes = (
        data.get(
            "notes",
            meeting.notes or ""
        )
        or ""
    ).strip()

    status = (
        data.get(
            "status",
            meeting.status
        )
        or meeting.status
    ).strip()

    meeting_date_text = data.get(
        "meeting_date"
    )

    if not title:
        return jsonify({
            "message":
                "Toplantı başlığı zorunludur."
        }), 400

    if not agenda:
        return jsonify({
            "message":
                "Toplantı gündemi zorunludur."
        }), 400

    if status not in [
        "planned",
        "completed",
        "cancelled"
    ]:
        return jsonify({
            "message":
                "Geçersiz toplantı durumu."
        }), 400

    if meeting_date_text:
        try:
            meeting_date = datetime.fromisoformat(
                meeting_date_text
            )

        except ValueError:
            return jsonify({
                "message":
                    "Geçerli bir toplantı tarihi giriniz."
            }), 400

    else:
        meeting_date = (
            meeting.meeting_date
        )

    meeting.title = title
    meeting.meeting_type = meeting_type
    meeting.meeting_date = meeting_date
    meeting.location = (
        location
        if location
        else None
    )
    meeting.agenda = agenda
    meeting.notes = (
        notes
        if notes
        else None
    )
    meeting.status = status

    db.session.commit()

    return jsonify({
        "message":
            "Toplantı başarıyla güncellendi.",

        "meeting":
            meeting_to_dict(
                meeting
            )
    }), 200


@meetings_bp.route(
    "/<int:meeting_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_meeting(meeting_id):
    user_id = int(
        get_jwt_identity()
    )

    meeting = (
        Meeting.query
        .join(
            Apartment,
            Meeting.apartment_id
            == Apartment.id
        )
        .filter(
            Meeting.id
            == meeting_id,

            Apartment.manager_id
            == user_id
        )
        .first()
    )

    if not meeting:
        return jsonify({
            "message":
                "Toplantı bulunamadı veya yetkiniz yok."
        }), 404

    db.session.delete(
        meeting
    )

    db.session.commit()

    return jsonify({
        "message":
            "Toplantı başarıyla silindi."
    }), 200