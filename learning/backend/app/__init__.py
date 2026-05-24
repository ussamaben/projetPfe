from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import Config
from flask import send_from_directory

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()





def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Complete CORS Configuration
    CORS(app, resources={
        r"/auth/*": {
            "origins": "http://localhost:3000",
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Type"]
        },
        r"/manager/*": {
            "origins": "http://localhost:3000",
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 600
        },
        
         r"/*": {
        "origins": "http://localhost:3000",
        "methods": ["GET", "POST", "PUT", "OPTIONS", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 600
    }
    })
    

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    from app.routes.auth_routes import auth_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.manager_routes import manager_bp
    #from app.routes.upload_route import upload_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(manager_bp, url_prefix='/manager')
    #app.register_blueprint(upload_bp, url_prefix='/upload')

    with app.app_context():
        db.create_all()

    return app

