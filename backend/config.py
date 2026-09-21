import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:
    # ---------------------------------------------------------
    # DATABASE
    # ---------------------------------------------------------
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///apartman.db"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ---------------------------------------------------------
    # JWT
    # ---------------------------------------------------------
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "dev-secret-key-change-this"
    )

    # Kullanıcı oturumunun geçerlilik süresi
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)

    # ---------------------------------------------------------
    # RESEND EMAIL API
    # ---------------------------------------------------------
    RESEND_API_KEY = os.getenv("RESEND_API_KEY")

    RESEND_FROM_EMAIL = os.getenv(
        "RESEND_FROM_EMAIL",
        "onboarding@resend.dev"
    )

    # ---------------------------------------------------------
    # EMAIL SETTINGS
    # ---------------------------------------------------------
    MAIL_TIMEOUT = int(
        os.getenv("MAIL_TIMEOUT", "10")
    )