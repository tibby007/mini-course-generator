# /home/ubuntu/mini-course-creator/main_routes.py
from flask import Blueprint, render_template, abort, url_for, redirect
from flask_login import login_required, current_user
# Assuming models are in the root directory now
from course import Course

main_bp = Blueprint("main_bp", __name__)

@main_bp.route("/")
def index():
    """Render the main landing page (index.html)."""
    if current_user.is_authenticated:
        return redirect(url_for("main_bp.dashboard"))
    # This should eventually use the user's updated React/Tailwind design,
    # but for now, it uses the existing index.html template.
    return render_template("index.html")

@main_bp.route("/dashboard")
@login_required
def dashboard():
    """Render the user's dashboard with their courses."""
    # Fetch courses for the current user
    user_courses = Course.query.filter_by(user_id=current_user.id).order_by(Course.updated_at.desc()).all()
    return render_template("dashboard.html", courses=user_courses)

@main_bp.route("/course/<course_share_id>")
def view_course(course_share_id):
    """Render the public view of a course using its share_id."""
    # Fetch course by share_id
    course = Course.query.filter_by(share_id=course_share_id).first()
    if not course:
        abort(404) # Course not found
    # Render the course view page
    return render_template("view_course.html", course=course)

