from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db, migrate, jwt, mail

from models import (
    User,
    Apartment,
    Unit,
    Resident,
)

from routes.auth import auth_bp
from routes.apartments import apartments_bp
from routes.units import units_bp
from routes.people import people_bp
from routes.dues import dues_bp
from routes.payments import payments_bp
from routes.transactions import transactions_bp
from routes.cash import cash_bp
from routes.decisions import decisions_bp
from routes.meetings import meetings_bp


app = Flask(__name__)

app.config.from_object(Config)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://apartman-yonetim-e3ur.onrender.com",
            ]
        }
    },
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)


# ---------------------------------------------------------
# EXTENSIONS
# ---------------------------------------------------------

db.init_app(app)
migrate.init_app(app, db)
jwt.init_app(app)
mail.init_app(app)


# ---------------------------------------------------------
# BLUEPRINTS
# ---------------------------------------------------------

app.register_blueprint(auth_bp)
app.register_blueprint(apartments_bp)
app.register_blueprint(units_bp)
app.register_blueprint(people_bp)
app.register_blueprint(dues_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(cash_bp)
app.register_blueprint(decisions_bp)
app.register_blueprint(meetings_bp)


# ---------------------------------------------------------
# TEST ROUTES
# ---------------------------------------------------------

@app.route("/")
def home():
    return jsonify({
        "message": "Apartman Yönetim API çalışıyor"
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "database": "connected"
    })


# ---------------------------------------------------------
# RUN
# ---------------------------------------------------------

if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )