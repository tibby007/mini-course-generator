# -*- coding: utf-8 -*-
from main import db
from sqlalchemy.dialects.sqlite import JSON # Use JSON for flexible content storage
import uuid
from datetime import datetime

# Association table for many-to-many relationship if needed later, but sticking to one-to-many for now.

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False, default="Untitled Course")
    description = db.Column(db.Text, nullable=True)
    outcome = db.Column(db.Text, nullable=False) # Mandatory
    audience = db.Column(db.Text, nullable=True)
    intro_content = db.Column(db.Text, nullable=True) # Store as HTML
    conclusion_content = db.Column(db.Text, nullable=True) # Store as HTML
    share_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    modules = db.relationship("Module", backref="course", lazy=True, cascade="all, delete-orphan", order_by="Module.order")

    def __repr__(self):
        return f"<Course {self.id}: {self.title}>"

class Module(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False, default="Untitled Module")
    order = db.Column(db.Integer, nullable=False)

    lessons = db.relationship("Lesson", backref="module", lazy=True, cascade="all, delete-orphan", order_by="Lesson.order")

    def __repr__(self):
        return f"<Module {self.id}: {self.title} (Order: {self.order})>"

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey("module.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False, default="Untitled Lesson")
    order = db.Column(db.Integer, nullable=False)

    content_blocks = db.relationship("ContentBlock", backref="lesson", lazy=True, cascade="all, delete-orphan", order_by="ContentBlock.order")

    def __repr__(self):
        return f"<Lesson {self.id}: {self.title} (Order: {self.order})>"

class ContentBlock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey("lesson.id"), nullable=False)
    block_type = db.Column(db.String(50), nullable=False) # e.g., "text", "image", "video", "quiz", "action"
    content = db.Column(JSON, nullable=True) # Use JSON to store varied content structures
    # Examples:
    # Text: {"html": "<p>Some text</p>"}
    # Image: {"url": "/static/uploads/image.jpg", "alt": "Description"}
    # Video: {"url": "https://youtube.com/embed/..."}
    # Quiz: {"question": "What is...?", "type": "mc", "options": ["A", "B", "C"], "correct_answer": 0}
    # Action: {"html": "<p>Do this...</p>"}
    order = db.Column(db.Integer, nullable=False)

    def __repr__(self):
        return f"<ContentBlock {self.id}: Type {self.block_type} (Order: {self.order})>"

