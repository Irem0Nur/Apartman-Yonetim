from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from extensions import db, migrate
from models import User, Apartment, Unit, Resident
from routes.auth import auth_bp
from routes.apartments import apartments_bp
from routes.units import units_bp
from routes.people import people_bp
from routes.dues import dues_bp
from routes.payments import payments_bp

app = Flask(__name__)

app.config.from_object(Config)

CORS(app)

db.init_app(app)
migrate.init_app(app, db)

jwt = JWTManager(app)

app.register_blueprint(auth_bp)
app.register_blueprint(apartments_bp)
app.register_blueprint(units_bp)
app.register_blueprint(people_bp)
app.register_blueprint(dues_bp)
app.register_blueprint(payments_bp)


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


if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )