from datetime import datetime, timedelta
import secrets

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from flask_mail import Message
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db, mail
from models import User


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


def generate_verification_code():
    return f"{secrets.randbelow(1000000):06d}"


def send_verification_email(user, code):
    msg = Message(
        subject="ApartmanYönet E-posta Doğrulama Kodu",
        recipients=[user.email],
    )

    msg.body = f"""
Merhaba {user.name},

ApartmanYönet hesabınızı doğrulamak için aşağıdaki kodu kullanın:

{code}

Bu kod 10 dakika boyunca geçerlidir.

Eğer bu kaydı siz oluşturmadıysanız bu e-postayı dikkate almayabilirsiniz.
"""

    mail.send(msg)


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json() or {}

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not name:
            return jsonify({
                "message": "Ad soyad zorunludur."
            }), 400

        if not email:
            return jsonify({
                "message": "E-posta adresi zorunludur."
            }), 400

        if not password:
            return jsonify({
                "message": "Şifre zorunludur."
            }), 400

        if len(password) < 8:
            return jsonify({
                "message": "Şifre en az 8 karakter olmalıdır."
            }), 400

        if not any(char.isalpha() for char in password):
            return jsonify({
                "message": "Şifre en az 1 harf içermelidir."
            }), 400

        if not any(char.isdigit() for char in password):
            return jsonify({
                "message": "Şifre en az 1 rakam içermelidir."
            }), 400

        user = User.query.filter_by(email=email).first()

        verification_code = generate_verification_code()
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        if user:
            if user.is_email_verified:
                return jsonify({
                    "message": "Bu e-posta adresiyle kayıtlı bir hesap zaten var."
                }), 409

            user.name = name
            user.password_hash = generate_password_hash(password)
            user.email_verification_code = verification_code
            user.email_verification_expires_at = expires_at

        else:
            user = User(
                name=name,
                email=email,
                password_hash=generate_password_hash(password),
                is_email_verified=False,
                email_verification_code=verification_code,
                email_verification_expires_at=expires_at,
            )

            db.session.add(user)

        db.session.commit()

        try:
            send_verification_email(
                user,
                verification_code
            )

        except Exception as mail_error:
            print(
                "MAIL SEND ERROR:",
                repr(mail_error)
            )

            return jsonify({
                "message": "Doğrulama e-postası gönderilemedi."
            }), 500

        return jsonify({
            "message": "Doğrulama kodu e-posta adresinize gönderildi.",
            "email": user.email,
            "requires_verification": True,
        }), 201

    except Exception as error:
        db.session.rollback()

        print(
            "REGISTER ERROR:",
            repr(error)
        )

        return jsonify({
            "message": "Kayıt sırasında beklenmeyen bir hata oluştu."
        }), 500


@auth_bp.route("/verify-email", methods=["POST"])
def verify_email():
    data = request.get_json() or {}

    email = data.get(
        "email",
        ""
    ).strip().lower()

    code = data.get(
        "code",
        ""
    ).strip()

    if not email or not code:
        return jsonify({
            "message": "E-posta ve doğrulama kodu zorunludur."
        }), 400

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:
        return jsonify({
            "message": "Kullanıcı bulunamadı."
        }), 404

    if user.is_email_verified:
        return jsonify({
            "message": "E-posta adresi zaten doğrulanmış."
        }), 400

    if not user.email_verification_code:
        return jsonify({
            "message": "Geçerli bir doğrulama kodu bulunamadı."
        }), 400

    if (
        user.email_verification_expires_at is None
        or datetime.utcnow() > user.email_verification_expires_at
    ):
        return jsonify({
            "message": "Doğrulama kodunun süresi dolmuş."
        }), 400

    if user.email_verification_code != code:
        return jsonify({
            "message": "Doğrulama kodu hatalı."
        }), 400

    user.is_email_verified = True
    user.email_verification_code = None
    user.email_verification_expires_at = None

    db.session.commit()

    access_token = create_access_token(
        identity=str(user.id)
    )

    return jsonify({
        "message": "E-posta başarıyla doğrulandı.",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
    }), 200


@auth_bp.route(
    "/resend-verification",
    methods=["POST"]
)
def resend_verification():
    try:
        data = request.get_json() or {}

        email = data.get(
            "email",
            ""
        ).strip().lower()

        if not email:
            return jsonify({
                "message": "E-posta adresi zorunludur."
            }), 400

        user = User.query.filter_by(
            email=email
        ).first()

        if not user:
            return jsonify({
                "message": "Kullanıcı bulunamadı."
            }), 404

        if user.is_email_verified:
            return jsonify({
                "message": "E-posta adresi zaten doğrulanmış."
            }), 400

        verification_code = generate_verification_code()

        user.email_verification_code = verification_code

        user.email_verification_expires_at = (
            datetime.utcnow()
            + timedelta(minutes=10)
        )

        db.session.commit()

        send_verification_email(
            user,
            verification_code
        )

        return jsonify({
            "message": "Yeni doğrulama kodu gönderildi."
        }), 200

    except Exception as error:
        db.session.rollback()

        print(
            "RESEND VERIFICATION ERROR:",
            repr(error)
        )

        return jsonify({
            "message": "Doğrulama e-postası gönderilemedi."
        }), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    if not email or not password:
        return jsonify({
            "message": "E-posta ve şifre zorunludur."
        }), 400

    user = User.query.filter_by(
        email=email
    ).first()

    if not user or not check_password_hash(
        user.password_hash,
        password
    ):
        return jsonify({
            "message": "E-posta veya şifre hatalı."
        }), 401

    if not user.is_email_verified:
        return jsonify({
            "message": "Lütfen önce e-posta adresinizi doğrulayın.",
            "requires_verification": True,
            "email": user.email,
        }), 403

    access_token = create_access_token(
        identity=str(user.id)
    )

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()

    user = db.session.get(
        User,
        int(user_id)
    )

    if not user:
        return jsonify({
            "message": "Kullanıcı bulunamadı."
        }), 404

    if not user.is_email_verified:
        return jsonify({
            "message": "E-posta adresi doğrulanmamış."
        }), 403

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
    }), 200