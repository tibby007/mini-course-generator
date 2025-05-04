# -*- coding: utf-8 -*-
import sys
import os
# Ensure the project root is in the path if running main.py directly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import uuid
# ----- TEMPORARY: wipe stale SQLite file so the new schema can be created -----
import os

db_path = os.path.join(os.getcwd(), "instance", "minicourse.db")
if os.path.exists(db_path):
    print("• Removing old SQLite DB so we can recreate it with the new schema")
    os.remove(db_path)
# ----------------------------------------------------------------------------- 

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__, 
                static_folder="static",  # Standard Flask static folder
                static_url_path="/static", 
                template_folder=".") # Templates in root
    
    app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key-12345") # Use a fixed dev key for now

    # Configure SQLite database in instance folder relative to app root
    instance_path = os.path.join(app.root_path, "instance")
    os.makedirs(instance_path, exist_ok=True)
    db_path = os.path.join(instance_path, "minicourse.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["WTF_CSRF_ENABLED"] = False # Disable CSRF for easier testing with JS fetch

    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth_bp.login" # Use blueprint name

    # Import models here to ensure they are registered with SQLAlchemy
    # Import models directly from root
    from user import User
    from course import Course, Module, Lesson, ContentBlock

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Import and register blueprints directly from root
    from main_routes import main_bp
    from auth import auth_bp
    from editor import editor_bp
    from ai_routes import ai_bp # AI routes are in the root

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(editor_bp, url_prefix="/editor")
    app.register_blueprint(ai_bp) # Registered with /ai prefix in ai_routes.py

    with app.app_context():
        print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        db.create_all() # Create database tables if they don't exist
        print("Database tables created (if not exist).")

    return app

app = create_app()

if __name__ == "__main__":
    print("Starting Flask development server...")
    # Make sure to listen on 0.0.0.0 for external access if needed (e.g., via expose_port)
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
