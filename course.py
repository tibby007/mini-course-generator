# course.py
import uuid
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from flask_login import current_user

from main import db   # db = SQLAlchemy(app) is created in main.py


def _uuid() -> str:
    """Return a random 8‑byte uuid4 string (URL‑safe)."""
    return uuid.uuid4().hex[:8]


class Course(db.Model):
    __tablename__ = "course"

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    # -------- basic metadata --------
    title       = db.Column(db.String(120),  nullable=False)
    description = db.Column(db.Text,        nullable=True)
    outcome     = db.Column(db.Text,        nullable=True)
    audience    = db.Column(db.Text,        nullable=True)

    # -------- rich‑text areas (optional) --------
    intro_content      = db.Column(db.Text, nullable=True)
    conclusion_content = db.Column(db.Text, nullable=True)

    # -------- public sharing --------
    share_id   = db.Column(db.String(16),  default=_uuid, unique=True, index=True)

    # -------- timestamps --------
    created_at = db.Column(db.DateTime, default=datetime.utcnow,  nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow,             nullable=False)

    # relationship back‑refs added in user.py
    modules = db.relationship("Module", backref="course", cascade="all, delete-orphan",
                              order_by="Module.position")

    def __repr__(self) -> str:          # for the Flask shell / debugging
        return f"<Course {self.id} {self.title!r}>"


class Module(db.Model):
    __tablename__ = "module"

    id        = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)

    title     = db.Column(db.String(120), nullable=False)
    position  = db.Column(db.Integer,     nullable=False)  # order within the course

    lessons   = db.relationship("Lesson", backref="module", cascade="all, delete-orphan",
                                order_by="Lesson.position")

    def __repr__(self):
        return f"<Module {self.id} {self.title!r}>"


class Lesson(db.Model):
    __tablename__ = "lesson"

    id        = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey("module.id"), nullable=False)

    title     = db.Column(db.String(120), nullable=False)
    position  = db.Column(db.Integer,     nullable=False)

    blocks    = db.relationship("ContentBlock", backref="lesson",
                                cascade="all, delete-orphan",
                                order_by="ContentBlock.position")

    def __repr__(self):
        return f"<Lesson {self.id} {self.title!r}>"


class ContentBlock(db.Model):
    __tablename__ = "content_block"

    id        = db.Column(db.Integer, primary_key=True)      # ← complete line
    lesson_id = db.Column(db.Integer, db.ForeignKey("lesson.id"), nullable=False)
    type      = db.Column(db.String(32),  nullable=False)
    data      = db.Column(db.Text,        nullable=False)
    position  = db.Column(db.Integer,     nullable=False)

