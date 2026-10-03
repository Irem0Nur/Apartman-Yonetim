import os
import logging
import random
import secrets
from datetime import datetime, timedelta, timezone

import resend

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_auth_requests

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

from extensions import db
from models import User, Apartment


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
# GOOGLE İLE GİRİŞ
# ---------------------------------------------------------

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


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
# SEND PASSWORD RESET EMAIL
# ---------------------------------------------------------

def send_password_reset_email(
    email,
    reset_code
):
    """
    Resend API üzerinden şifre sıfırlama e-postası gönderir.
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
        <title>Şifre Sıfırlama</title>
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
                Şifrenizi sıfırlamak için aşağıdaki
                kodu kullanabilirsiniz:
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
                    {reset_code}
                </span>

            </div>

            <p>
                Bu kodun geçerlilik süresi:
                <strong>10 dakika</strong>.
            </p>

            <p>
                Eğer bu işlemi siz talep etmediyseniz
                bu e-postayı dikkate almayabilirsiniz,
                şifreniz değişmeyecektir.
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
        "subject": "Apartman Yönetim - Şifre Sıfırlama Kodunuz",
        "html": html_content,
    }

    response = resend.Emails.send(params)

    logger.info(
        "Password reset email sent successfully to %s",
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
        #
        # E-posta doğrulama adımı kaldırıldı: hesaplar
        # oluşturulduğu anda doğrulanmış sayılıyor ve
        # kullanıcı doğrudan giriş yapabiliyor (kod
        # bekleyen bir e-posta sistemine ihtiyaç yok).

        user = User.query.filter_by(
            email=email
        ).first()

        if user:

            # E-posta zaten kayıtlı bir hesaba ait
            return jsonify({
                "message": "Bu e-posta adresi zaten kayıtlı."
            }), 409

        # -------------------------------------------------
        # NEW USER
        # -------------------------------------------------

        user = User(
            name=name,
            email=email,
            password_hash="",
            is_email_verified=True,
        )

        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        # -------------------------------------------------
        # SUCCESS — doğrudan giriş yaptır
        # -------------------------------------------------

        access_token = create_access_token(
            identity=str(user.id)
        )

        return jsonify({

            "message": "Kayıt başarılı.",

            "access_token": access_token,

            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "is_email_verified": True
            }

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


@auth_bp.route(
    "/google",
    methods=["POST"]
)
def google_login():

    try:

        if not GOOGLE_CLIENT_ID:

            return jsonify({
                "message": (
                    "Google ile giriş şu anda "
                    "yapılandırılmamış."
                )
            }), 503

        data = request.get_json()

        credential = (
            data.get("credential")
            if data else None
        )

        if not credential:

            return jsonify({
                "message": (
                    "Google kimlik bilgisi eksik."
                )
            }), 400

        try:
            idinfo = google_id_token.verify_oauth2_token(
                credential,
                google_auth_requests.Request(),
                GOOGLE_CLIENT_ID,
            )
        except ValueError:

            logger.exception(
                "Google token doğrulaması başarısız."
            )

            return jsonify({
                "message": (
                    "Google doğrulaması başarısız."
                )
            }), 401

        email = (
            idinfo.get("email") or ""
        ).strip().lower()

        google_sub = idinfo.get("sub")

        if not email or not idinfo.get("email_verified"):

            return jsonify({
                "message": (
                    "Google hesabınızın e-postası "
                    "doğrulanmamış."
                )
            }), 401

        name = (
            idinfo.get("name")
            or email.split("@")[0]
        )

        # -------------------------------------------------
        # Önce google_id ile, bulunamazsa e-posta ile ara
        # (daha önce e-posta/şifre ile kayıt olmuş bir
        # hesap Google hesabıyla eşleştirilsin).
        # -------------------------------------------------

        user = User.query.filter_by(
            google_id=google_sub
        ).first()

        if not user:
            user = User.query.filter_by(
                email=email
            ).first()

        if user:

            if not user.google_id:
                user.google_id = google_sub

            if not user.is_email_verified:
                user.is_email_verified = True

            db.session.commit()

        else:

            user = User(
                name=name,
                email=email,
                password_hash="",
                is_email_verified=True,
                google_id=google_sub,
            )

            # Google ile oluşturulan hesaplarda normal
            # e-posta/şifre girişi kullanılmayacağı için
            # rastgele, kullanıcıya hiç gösterilmeyen bir
            # şifre atanır.
            user.set_password(
                secrets.token_urlsafe(32)
            )

            db.session.add(user)
            db.session.commit()

        access_token = create_access_token(
            identity=str(user.id)
        )

        return jsonify({

            "message": "Google ile giriş başarılı.",

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
            "Google login error."
        )

        return jsonify({

            "message": (
                "Google ile giriş sırasında "
                "bir hata oluştu."
            ),

            "error": str(e)

        }), 500


# ---------------------------------------------------------
# FORGOT PASSWORD
# ---------------------------------------------------------

@auth_bp.route(
    "/forgot-password",
    methods=["POST"]
)
def forgot_password():

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
        # NEW CODE
        # -------------------------------------------------

        reset_code = generate_verification_code()

        user.password_reset_code = reset_code

        user.password_reset_expires_at = (
            datetime.now(timezone.utc)
            + timedelta(minutes=10)
        )

        db.session.commit()

        # -------------------------------------------------
        # SEND EMAIL
        # -------------------------------------------------

        try:

            send_password_reset_email(
                email,
                reset_code
            )

        except Exception as mail_error:

            logger.exception(
                "Password reset email could not be sent."
            )

            return jsonify({

                "message": (
                    "Şifre sıfırlama kodu oluşturuldu "
                    "ancak e-posta gönderilemedi."
                ),

                "error": str(mail_error)

            }), 503

        return jsonify({

            "message": (
                "Şifre sıfırlama kodu "
                "e-posta adresinize gönderildi."
            ),

            "email": email

        }), 200

    except Exception as e:

        db.session.rollback()

        logger.exception(
            "Forgot password error."
        )

        return jsonify({

            "message": (
                "Şifre sıfırlama kodu gönderilirken "
                "bir hata oluştu."
            ),

            "error": str(e)

        }), 500


# ---------------------------------------------------------
# RESET PASSWORD
# ---------------------------------------------------------

@auth_bp.route(
    "/reset-password",
    methods=["POST"]
)
def reset_password():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "message": "Geçersiz istek."
            }), 400

        email = data.get("email")
        code = data.get("code")
        new_password = data.get("new_password")

        if not email or not code or not new_password:
            return jsonify({
                "message": (
                    "E-posta, kod ve yeni şifre zorunludur."
                )
            }), 400

        email = email.strip().lower()
        code = str(code).strip()

        if len(new_password) < 6:
            return jsonify({
                "message": (
                    "Şifre en az 6 karakter olmalıdır."
                )
            }), 400

        user = User.query.filter_by(
            email=email
        ).first()

        if not user:
            return jsonify({
                "message": "Kullanıcı bulunamadı."
            }), 404

        # -------------------------------------------------
        # CODE CHECK
        # -------------------------------------------------

        if (
            not user.password_reset_code
            or user.password_reset_code != code
        ):

            return jsonify({
                "message": "Şifre sıfırlama kodu hatalı."
            }), 400

        # -------------------------------------------------
        # EXPIRATION CHECK
        # -------------------------------------------------

        if not user.password_reset_expires_at:

            return jsonify({
                "message": "Şifre sıfırlama kodu geçersiz."
            }), 400

        expires_at = user.password_reset_expires_at

        # SQLite/PostgreSQL timezone farklarını
        # güvenli şekilde ele al.

        if expires_at.tzinfo is None:

            expires_at = expires_at.replace(
                tzinfo=timezone.utc
            )

        if datetime.now(timezone.utc) > expires_at:

            return jsonify({
                "message": (
                    "Şifre sıfırlama kodunun süresi dolmuş."
                )
            }), 400

        # -------------------------------------------------
        # RESET PASSWORD
        # -------------------------------------------------

        user.set_password(new_password)

        user.password_reset_code = None

        user.password_reset_expires_at = None

        db.session.commit()

        return jsonify({

            "message": (
                "Şifreniz başarıyla güncellendi. "
                "Yeni şifrenizle giriş yapabilirsiniz."
            )

        }), 200

    except Exception as e:

        db.session.rollback()

        logger.exception(
            "Reset password error."
        )

        return jsonify({

            "message": (
                "Şifre sıfırlanırken bir hata oluştu."
            ),

            "error": str(e)

        }), 500


# ---------------------------------------------------------
# UPDATE NAME
# ---------------------------------------------------------

@auth_bp.route(
    "/update-name",
    methods=["PUT"]
)
@jwt_required()
def update_name():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "message": "Geçersiz istek."
            }), 400

        name = data.get("name")

        if not name or not name.strip():
            return jsonify({
                "message": "Ad soyad zorunludur."
            }), 400

        user_id = get_jwt_identity()

        user = User.query.get(
            int(user_id)
        )

        if not user:
            return jsonify({
                "message": "Kullanıcı bulunamadı."
            }), 404

        user.name = name.strip()

        db.session.commit()

        return jsonify({

            "message": "Ad soyad başarıyla güncellendi.",

            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "is_email_verified": user.is_email_verified,
            }

        }), 200

    except Exception as e:

        db.session.rollback()

        logger.exception(
            "Update name error."
        )

        return jsonify({

            "message": (
                "Ad soyad güncellenirken bir hata oluştu."
            ),

            "error": str(e)

        }), 500


# ---------------------------------------------------------
# CHANGE EMAIL
# ---------------------------------------------------------

@auth_bp.route(
    "/change-email",
    methods=["PUT"]
)
@jwt_required()
def change_email():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "message": "Geçersiz istek."
            }), 400

        new_email = data.get("new_email")
        current_password = data.get("current_password")

        if not new_email or not current_password:
            return jsonify({
                "message": (
                    "Yeni e-posta ve mevcut şifre zorunludur."
                )
            }), 400

        new_email = new_email.strip().lower()

        user_id = get_jwt_identity()

        user = User.query.get(
            int(user_id)
        )

        if not user:
            return jsonify({
                "message": "Kullanıcı bulunamadı."
            }), 404

        if not user.check_password(current_password):
            return jsonify({
                "message": "Mevcut şifre hatalı."
            }), 401

        if new_email == user.email:
            return jsonify({
                "message": (
                    "Yeni e-posta mevcut e-posta "
                    "ile aynı."
                )
            }), 400

        existing = User.query.filter_by(
            email=new_email
        ).first()

        if existing:
            return jsonify({
                "message": (
                    "Bu e-posta adresi başka bir "
                    "hesapta kullanılıyor."
                )
            }), 409

        user.email = new_email

        db.session.commit()

        return jsonify({

            "message": (
                "E-posta adresi başarıyla güncellendi."
            ),

            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "is_email_verified": user.is_email_verified,
            }

        }), 200

    except Exception as e:

        db.session.rollback()

        logger.exception(
            "Change email error."
        )

        return jsonify({

            "message": (
                "E-posta güncellenirken bir hata oluştu."
            ),

            "error": str(e)

        }), 500


# ---------------------------------------------------------
# CHANGE PASSWORD
# ---------------------------------------------------------

@auth_bp.route(
    "/change-password",
    methods=["PUT"]
)
@jwt_required()
def change_password():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "message": "Geçersiz istek."
            }), 400

        current_password = data.get("current_password")
        new_password = data.get("new_password")

        if not current_password or not new_password:
            return jsonify({
                "message": (
                    "Mevcut şifre ve yeni şifre zorunludur."
                )
            }), 400

        if len(new_password) < 6:
            return jsonify({
                "message": (
                    "Yeni şifre en az 6 karakter olmalıdır."
                )
            }), 400

        user_id = get_jwt_identity()

        user = User.query.get(
            int(user_id)
        )

        if not user:
            return jsonify({
                "message": "Kullanıcı bulunamadı."
            }), 404

        if not user.check_password(current_password):
            return jsonify({
                "message": "Mevcut şifre hatalı."
            }), 401

        user.set_password(new_password)

        db.session.commit()

        return jsonify({

            "message": (
                "Şifreniz başarıyla güncellendi."
            )

        }), 200

    except Exception as e:

        db.session.rollback()

        logger.exception(
            "Change password error."
        )

        return jsonify({

            "message": (
                "Şifre güncellenirken bir hata oluştu."
            ),

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


# ---------------------------------------------------------
# EMERGENCY ACCOUNT RECOVERY
#
# Geçici bir yardım uç noktası: e-posta gönderim servisi
# (Resend) belirli adreslere kod gönderemediği için, bu
# endpoint ADMIN_RECOVERY_SECRET ortam değişkenindeki
# gizli anahtarla korunarak, bir hesabın şifresini
# e-postaya gerek kalmadan doğrudan değiştirmeyi sağlar.
# Sorun çözülünce bu endpoint ve ADMIN_RECOVERY_SECRET
# ortam değişkeni kaldırılmalıdır.
# ---------------------------------------------------------

@auth_bp.route(
    "/emergency-recovery",
    methods=["POST"]
)
def emergency_recovery():

    try:

        admin_secret = os.getenv(
            "ADMIN_RECOVERY_SECRET"
        )

        if not admin_secret:

            return jsonify({
                "message": (
                    "Bu özellik şu anda "
                    "yapılandırılmamış."
                )
            }), 503

        data = request.get_json() or {}

        provided_secret = data.get("secret")

        if (
            not provided_secret
            or provided_secret != admin_secret
        ):

            return jsonify({
                "message": "Yetkisiz istek."
            }), 401

        email = (
            data.get("email") or ""
        ).strip().lower()

        new_password = data.get("new_password")

        if not email or not new_password:

            return jsonify({
                "message": (
                    "E-posta ve yeni şifre zorunludur."
                )
            }), 400

        if len(new_password) < 6:

            return jsonify({
                "message": (
                    "Şifre en az 6 karakter olmalıdır."
                )
            }), 400

        user = User.query.filter_by(
            email=email
        ).first()

        if not user:

            return jsonify({
                "message": "Kullanıcı bulunamadı.",
                "email_queried": email
            }), 404

        user.set_password(new_password)

        user.password_reset_code = None

        user.password_reset_expires_at = None

        db.session.commit()

        apartments = Apartment.query.filter_by(
            manager_id=user.id
        ).all()

        return jsonify({

            "message": "Şifre güncellendi.",

            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
            },

            "apartment_count": len(apartments),

            "apartments": [
                apartment.name
                for apartment in apartments
            ]

        }), 200

    except Exception as e:

        db.session.rollback()

        logger.exception(
            "Emergency recovery error."
        )

        return jsonify({

            "message": (
                "İşlem sırasında bir hata oluştu."
            ),

            "error": str(e)

        }), 500