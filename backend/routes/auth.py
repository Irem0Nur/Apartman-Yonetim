import os
import logging
import random
from datetime import datetime, timedelta, timezone

import resend

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

from extensions import db
from models import User


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


# ---------------------------------------------------------
# LOGGING
# ---------------------------------------------------------

logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# RESEND CONFIGURATION
# ---------------------------------------------------------

RESEND_API_KEY = os.getenv("RESEND_API_KEY")

RESEND_FROM_EMAIL = os.getenv(
    "RESEND_FROM_EMAIL",
    "onboarding@resend.dev"
)

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


# ---------------------------------------------------------
# VERIFICATION CODE
# ---------------------------------------------------------

def generate_verification_code():
    """
    6 haneli doğrulama kodu oluşturur.
    """
    return str(random.randint(100000, 999999))


# ---------------------------------------------------------
# SEND VERIFICATION EMAIL
# ---------------------------------------------------------

def send_verification_email(
    email,
    verification_code
):
    """
    Resend API üzerinden doğrulama e-postası gönderir.
    """

    if not RESEND_API_KEY:
        raise RuntimeError(
            "RESEND_API_KEY environment variable tanımlı değil."
        )

    html_content = f"""
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <title>E-posta Doğrulama</title>
    </head>

    <body
        style="
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 30px;
        "
    >

        <div
            style="
                max-width: 500px;
                margin: auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
            "
        >

            <h2 style="text-align: center;">
                Apartman Yönetim
            </h2>

            <p>
                Merhaba,
            </p>

            <p>
                Hesabınızı doğrulamak için aşağıdaki
                doğrulama kodunu kullanabilirsiniz:
            </p>

            <div
                style="
                    text-align: center;
                    margin: 30px 0;
                "
            >

                <span
                    style="
                        display: inline-block;
                        background-color: #eeeeee;
                        padding: 15px 30px;
                        font-size: 30px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        border-radius: 8px;
                    "
                >
                    {verification_code}
                </span>

            </div>

            <p>
                Bu kodun geçerlilik süresi:
                <strong>10 dakika</strong>.
            </p>

            <p>
                Eğer bu işlemi siz gerçekleştirmediyseniz
                bu e-postayı dikkate almayabilirsiniz.
            </p>

            <hr>

            <p
                style="
                    font-size: 12px;
                    color: #777;
                "
            >
                Apartman Yönetim Sistemi
            </p>

        </div>

    </body>
    </html>
    """

    params = {
        "from": RESEND_FROM_EMAIL,
        "to": [email],
        "subject": "Apartman Yönetim - E-posta Doğrulama Kodunuz",
        "html": html_content,
    }

    response = resend.Emails.send(params)

    logger.info(
        "Verification email sent successfully to %s",
        email
    )

    return response


# ---------------------------------------------------------
# REGISTER
# ---------------------------------------------------------

@auth_bp.route(
    "/register",
    methods=["POST"]
)
def register():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "message": "Geçersiz istek."
            }), 400

        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        # -------------------------------------------------
        # VALIDATION
        # -------------------------------------------------

        if not name or not email or not password:
            return jsonify({
                "message": "Ad, e-posta ve şifre zorunludur."
            }), 400

        email = email.strip().lower()

        if len(password) < 6:
            return jsonify({
                "message": "Şifre en az 6 karakter olmalıdır."
            }), 400

        # -------------------------------------------------
        # EXISTING USER
        # -------------------------------------------------

        user = User.query.filter_by(
            email=email
        ).first()

        verification_code = generate_verification_code()

        verification_expires_at = (
            datetime.now(timezone.utc)
            + timedelta(minutes=10)
        )

        if user:

            # Daha önce doğrulanmış kullanıcı
            if user.is_email_verified:
                return jsonify({
                    "message": "Bu e-posta adresi zaten kayıtlı."
                }), 409

            # Kullanıcı var fakat doğrulanmamış
            user.email_verification_code = verification_code
            user.email_verification_expires_at = (
                verification_expires_at
            )

            user.set_password(password)

        else:

            # -------------------------------------------------
            # NEW USER
            # -------------------------------------------------

            user = User(
                name=name,
                email=email,
                password_hash="",
                is_email_verified=False,
                email_verification_code=verification_code,
                email_verification_expires_at=(
                    verification_expires_at
                ),
            )

            user.set_password(password)

            db.session.add(user)

        db.session.commit()

        # -------------------------------------------------
        # SEND EMAIL
        # -------------------------------------------------

        try:

            send_verification_email(
                email,
                verification_code
            )

        except Exception as mail_error:

            logger.exception(
                "Verification email could not be sent."
            )

            return jsonify({
                "message": (
                    "Hesabınız oluşturuldu ancak "
                    "doğrulama e-postası gönderilemedi."
                ),
                "error": str(mail_error),
                "email": email,
                "requires_verification": True
            }), 503

        # -------------------------------------------------
        # SUCCESS
        # -------------------------------------------------

        return jsonify({
            "message": (
                "Kayıt başarılı. "
                "E-posta adresinize doğrulama kodu gönderildi."
            ),
            "email": email,
            "requires_verification": True
        }), 201

    except Exception as e:

        db.session.rollback()

        logger.exception(
            "Register error."
        )

        return jsonify({
            "message": "Kayıt sırasında bir hata oluştu.",
            "error": str(e)
        }), 500


# ---------------------------------------------------------
# VERIFY EMAIL
# ---------------------------------------------------------

@auth_bp.route(
    "/verify-email",
    methods=["POST"]
)
def verify_email():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "message": "Geçersiz istek."
            }), 400

        email = data.get("email")
        code = data.get("code")

        if not email or not code:
            return jsonify({
                "message": "E-posta ve doğrulama kodu zorunludur."
            }), 400

        email = email.strip().lower()
        code = str(code).strip()

        user = User.query.filter_by(
            email=email
        ).first()

        if not user:
            return jsonify({
                "message": "Kullanıcı bulunamadı."
            }), 404

        # -------------------------------------------------
        # ALREADY VERIFIED
        # -------------------------------------------------

        if user.is_email_verified:

            return jsonify({
                "message": "E-posta adresi zaten doğrulanmış."
            }), 200

        # -------------------------------------------------
        # CODE CHECK
        # -------------------------------------------------

        if user.email_verification_code != code:

            return jsonify({
                "message": "Doğrulama kodu hatalı."
            }), 400

        # -------------------------------------------------
        # EXPIRATION CHECK
        # -------------------------------------------------

        if not user.email_verification_expires_at:

            return jsonify({
                "message": "Doğrulama kodu geçersiz."
            }), 400

        expires_at = user.email_verification_expires_at

        # SQLite/PostgreSQL timezone farklarını
        # güvenli şekilde ele al.

        if expires_at.tzinfo is None:

            expires_at = expires_at.replace(
                tzinfo=timezone.utc
            )

        if datetime.now(timezone.utc) > expires_at:

            return jsonify({
                "message": "Doğrulama kodunun süresi dolmuş."
            }), 400

        # -------------------------------------------------
        # VERIFY
        # -------------------------------------------------

        user.is_email_verified = True

        user.email_verification_code = None

        user.email_verification_expires_at = None

        db.session.commit()

        # -------------------------------------------------
        # JWT
        # -------------------------------------------------

        access_token = create_access_token(
            identity=str(user.id)
        )

        return jsonify({

            "message": (
                "E-posta adresi başarıyla doğrulandı."
            ),

            "access_token": access_token,

            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "is_email_verified": True
            }

        }), 200

    except Exception as e:

        db.session.rollback()

        logger.exception(
            "Email verification error."
        )

        return jsonify({

            "message": (
                "E-posta doğrulama sırasında "
                "bir hata oluştu."
            ),

            "error": str(e)

        }), 500


# ---------------------------------------------------------
# RESEND VERIFICATION
# ---------------------------------------------------------

@auth_bp.route(
    "/resend-verification",
    methods=["POST"]
)
def resend_verification():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "message": "Geçersiz istek."
            }), 400

        email = data.get("email")

        if not email:
            return jsonify({
                "message": "E-posta adresi zorunludur."
            }), 400

        email = email.strip().lower()

        user = User.query.filter_by(
            email=email
        ).first()

        if not user:

            return jsonify({
                "message": "Kullanıcı bulunamadı."
            }), 404

        # -------------------------------------------------
        # ALREADY VERIFIED
        # -------------------------------------------------

        if user.is_email_verified:

            return jsonify({
                "message": (
                    "Bu e-posta adresi zaten doğrulanmış."
                )
            }), 400

        # -------------------------------------------------
        # NEW CODE
        # -------------------------------------------------

        verification_code = generate_verification_code()

        user.email_verification_code = verification_code

        user.email_verification_expires_at = (
            datetime.now(timezone.utc)
            + timedelta(minutes=10)
        )

        db.session.commit()

        # -------------------------------------------------
        # SEND EMAIL
        # -------------------------------------------------

        try:

            send_verification_email(
                email,
                verification_code
            )

        except Exception as mail_error:

            logger.exception(
                "Resend verification email failed."
            )

            return jsonify({

                "message": (
                    "Yeni doğrulama kodu oluşturuldu "
                    "ancak e-posta gönderilemedi."
                ),

                "error": str(mail_error)

            }), 503

        return jsonify({

            "message": (
                "Yeni doğrulama kodu "
                "e-posta adresinize gönderildi."
            )

        }), 200

    except Exception as e:

        db.session.rollback()

        logger.exception(
            "Resend verification error."
        )

        return jsonify({

            "message": (
                "Doğrulama kodu gönderilirken "
                "bir hata oluştu."
            ),

            "error": str(e)

        }), 500


# ---------------------------------------------------------
# LOGIN
# ---------------------------------------------------------

@auth_bp.route(
    "/login",
    methods=["POST"]
)
def login():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "message": "Geçersiz istek."
            }), 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:

            return jsonify({
                "message": (
                    "E-posta ve şifre zorunludur."
                )
            }), 400

        email = email.strip().lower()

        user = User.query.filter_by(
            email=email
        ).first()

        if not user:

            return jsonify({
                "message": (
                    "E-posta veya şifre hatalı."
                )
            }), 401

        if not user.check_password(password):

            return jsonify({
                "message": (
                    "E-posta veya şifre hatalı."
                )
            }), 401

        # -------------------------------------------------
        # EMAIL VERIFICATION
        # -------------------------------------------------

        if not user.is_email_verified:

            return jsonify({

                "message": (
                    "Lütfen önce e-posta adresinizi doğrulayın."
                ),

                "requires_verification": True,

                "email": user.email

            }), 403

        # -------------------------------------------------
        # JWT
        # -------------------------------------------------

        access_token = create_access_token(
            identity=str(user.id)
        )

        return jsonify({

            "message": "Giriş başarılı.",

            "access_token": access_token,

            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "is_email_verified": True
            }

        }), 200

    except Exception as e:

        logger.exception(
            "Login error."
        )

        return jsonify({

            "message": "Giriş sırasında bir hata oluştu.",

            "error": str(e)

        }), 500


# ---------------------------------------------------------
# CURRENT USER
# ---------------------------------------------------------

@auth_bp.route(
    "/me",
    methods=["GET"]
)
@jwt_required()
def me():

    try:

        user_id = get_jwt_identity()

        user = User.query.get(
            int(user_id)
        )

        if not user:

            return jsonify({
                "message": "Kullanıcı bulunamadı."
            }), 404

        return jsonify({

            "id": user.id,

            "name": user.name,

            "email": user.email,

            "is_email_verified": user.is_email_verified

        }), 200

    except Exception as e:

        logger.exception(
            "Current user error."
        )

        return jsonify({

            "message": (
                "Kullanıcı bilgileri alınamadı."
            ),

            "error": str(e)

        }), 500