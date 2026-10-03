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
    # SMTP2GO EMAIL API
    # ---------------------------------------------------------
    SMTP2GO_API_KEY = os.getenv("SMTP2GO_API_KEY")

    SMTP2GO_SENDER_EMAIL = os.getenv(
        "SMTP2GO_SENDER_EMAIL"
    )

    # ---------------------------------------------------------
    # EMAIL SETTINGS
    # ---------------------------------------------------------
    MAIL_TIMEOUT = int(
        os.getenv("MAIL_TIMEOUT", "10")
    )