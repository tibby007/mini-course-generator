# course.py  – all course‑related tables
import uuid, datetime as dt
from main import db

def _uuid():
    return str(uuid.uuid4())

class Course(db.Model):
    __tablename__ = "course"

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    title       = db.Column(db.String(120),  nullable=False)
    description = db.Column(db.Text,        nullable=True)
    outcome     = db.Column(db.Text,        nullable=True)
    audience    = db.Column(db.Text,        nullable=True)

    intro_content      = db.Column(db.Text)
    conclusion_content = db.Column(db.Text)

    share_id   = db.Column(db.String(36), default=_uuid, unique=True, nullable=False)
    created_at = db.Column(db.DateTime,   default=dt.datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime,   default=dt.datetime.utcnow,
                           onupdate=dt.datetime.utcnow,               nullable=False)

    modules = db.relationship("Module", backref="course", cascade="all, delete-orphan")

class Module(db.Model):
    __tablename__ = "module"

    id        = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)

    title       = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)

    order = db.Column(db.Integer, nullable=False)

    lessons = db.relationship("Lesson", backref="module", cascade="all, delete-orphan")

class Lesson(db.Model):
    __tablename__ = "lesson"

    id        = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey("module.id"), nullable=False)

    title = db.Column(db.Stri

