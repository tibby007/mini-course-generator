# keep any imports you already have
from main import db
from datetime import datetime
import uuid

# ⬇️  replace your current Course class with this one
class Course(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    title       = db.Column(db.String(150),  nullable=False)

    description = db.Column(db.Text,         nullable=True)   # now nullable
    outcome     = db.Column(db.Text,         nullable=True)   # now nullable
    audience    = db.Column(db.Text,         nullable=True)   # now nullable
    intro_content      = db.Column(db.Text,  nullable=True)   # now nullable
    conclusion_content = db.Column(db.Text,  nullable=True)   # now nullable

    share_id    = db.Column(db.String(36),   nullable=False, unique=True, default=lambda: str(uuid.uuid4()))

    created_at  = db.Column(db.DateTime,     default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime,     default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Course {self.title}>"

