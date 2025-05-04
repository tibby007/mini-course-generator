# main_routes.py  – place in project root next to main.py
from datetime import datetime
from flask import (
    Blueprint,
    render_template,
    abort,
    url_for,
    redirect,
    request,
    flash,
)
from flask_login import login_required, current_user
from main import db                       # ← your SQLAlchemy db instance
from course import Course                 # ← your Course model

main_bp = Blueprint("main_bp", __name__)

# ------------------------------------------------------------------
# Home / landing
# ------------------------------------------------------------------
@main_bp.route("/")
def index():
    """Landing page.  Authenticated users go straight to dashboard."""
    if current_user.is_authenticated:
        return redirect(url_for("main_bp.dashboard"))

    # TODO: replace with your React/Tailwind front page later
    return render_template("index.html")


# ------------------------------------------------------------------
# Dashboard
# ------------------------------------------------------------------
@main_bp.route("/dashboard")
@login_required
def dashboard():
    """User dashboard listing their own courses."""
    user_courses = (
        Course.query.filter_by(user_id=current_user.id)
        .order_by(Course.updated_at.desc())
        .all()
    )
    return render_template("dashboard.html", courses=user_courses)


# ------------------------------------------------------------------
# Create‑a‑course  (what the template expects!)
# ------------------------------------------------------------------
@main_bp.route("/course/new", methods=["GET", "POST"])
@login_required
def create_course():
    """
    Create a new course.

    Very bare‑bones for now: on GET show a page with a simple form;
    on POST create the record and redirect to the dashboard.
    Replace with your nicer UI later.
    """
    if request.method == "POST":
        title = request.form.get("title", "").strip()

        if not title:
            flash("Title is required.", "danger")
            return render_template("create_course.html")

        new_course = Course(
            title=title,
            user_id=current_user.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.session.add(new_course)
        db.session.commit()

        flash("Course created!", "success")
        return redirect(url_for("main_bp.dashboard"))

    # GET
    return render_template("create_course.html")


# ------------------------------------------------------------------
# Public course view
# ------------------------------------------------------------------
@main_bp.route("/course/<course_share_id>")
def view_course(course_share_id):
    """Public view of a course identified by its share_id."""
    course = Course.query.filter_by(share_id=course_share_id).first()
    if not course:
        abort(404)
    return render_template("view_course.html", course=course)
