# -*- coding: utf-8 -*-
from flask import Blueprint, jsonify, request, abort, render_template
from flask_login import login_required, current_user
from course import Course, Module, Lesson, ContentBlock
from main import db
from sqlalchemy import func
import json # For handling JSON content in ContentBlock

editor_bp = Blueprint("editor", __name__)

# Helper function to get course and check ownership
def get_course_or_404(course_id):
    course = Course.query.get_or_404(course_id)
    if course.user_id != current_user.id:
        abort(403) # Forbidden
    return course

# --- Course Editor Main Route --- #
@editor_bp.route("/course/<int:course_id>", methods=["GET", "POST"])
@login_required
def edit_course(course_id):
    course = get_course_or_404(course_id)
    # Import form here to avoid circular dependency if form uses models
    from src.routes.main import CourseSettingsForm
    form = CourseSettingsForm(obj=course) # Pre-populate form with course data

    if form.validate_on_submit(): # Handles basic course settings update
        course.title = form.title.data
        course.description = form.description.data
        course.outcome = form.outcome.data
        course.audience = form.audience.data
        # Intro/Conclusion content updated via separate API calls
        db.session.commit()
        # Return JSON response for AJAX form submission if needed, or redirect
        # For now, assume standard form post redirects back or shows success
        flash("Course settings updated.", "success")
        return redirect(url_for("editor.edit_course", course_id=course.id))

    # For GET request, render the editor page
    return render_template("edit_course.html", course=course, form=form)

# --- API Routes for Editor Actions (Called via JavaScript) --- #

# --- Course Intro/Conclusion --- #
@editor_bp.route("/course/<int:course_id>/intro", methods=["POST"])
@login_required
def update_intro(course_id):
    course = get_course_or_404(course_id)
    data = request.get_json()
    if not data or "content" not in data:
        abort(400, "Missing content in request")
    course.intro_content = data["content"] # Assuming content is sanitized HTML from editor
    db.session.commit()
    return jsonify({"message": "Introduction updated successfully"})

@editor_bp.route("/course/<int:course_id>/conclusion", methods=["POST"])
@login_required
def update_conclusion(course_id):
    course = get_course_or_404(course_id)
    data = request.get_json()
    if not data or "content" not in data:
        abort(400, "Missing content in request")
    course.conclusion_content = data["content"] # Assuming content is sanitized HTML
    db.session.commit()
    return jsonify({"message": "Conclusion updated successfully"})

# --- Modules --- #
@editor_bp.route("/course/<int:course_id>/modules", methods=["POST"])
@login_required
def add_module(course_id):
    course = get_course_or_404(course_id)
    # Determine the order for the new module
    max_order = db.session.query(func.max(Module.order)).filter_by(course_id=course.id).scalar()
    new_order = (max_order or 0) + 1
    new_module = Module(course_id=course.id, title="New Module", order=new_order)
    db.session.add(new_module)
    db.session.commit()
    return jsonify({"message": "Module added", "module": {"id": new_module.id, "title": new_module.title, "order": new_module.order}})

@editor_bp.route("/module/<int:module_id>", methods=["PUT", "DELETE"])
@login_required
def modify_module(module_id):
    module = Module.query.get_or_404(module_id)
    course = get_course_or_404(module.course_id) # Checks ownership

    if request.method == "PUT":
        data = request.get_json()
        if not data or "title" not in data:
            abort(400, "Missing title")
        module.title = data["title"]
        db.session.commit()
        return jsonify({"message": "Module updated", "module": {"id": module.id, "title": module.title}})

    elif request.method == "DELETE":
        # Adjust order of subsequent modules before deleting
        modules_to_shift = Module.query.filter(
            Module.course_id == module.course_id,
            Module.order > module.order
        ).order_by(Module.order).all()
        for m in modules_to_shift:
            m.order -= 1

        db.session.delete(module)
        db.session.commit()
        return jsonify({"message": "Module deleted"})

# --- Lessons --- #
@editor_bp.route("/module/<int:module_id>/lessons", methods=["POST"])
@login_required
def add_lesson(module_id):
    module = Module.query.get_or_404(module_id)
    course = get_course_or_404(module.course_id) # Check ownership
    max_order = db.session.query(func.max(Lesson.order)).filter_by(module_id=module.id).scalar()
    new_order = (max_order or 0) + 1
    new_lesson = Lesson(module_id=module.id, title="New Lesson", order=new_order)
    db.session.add(new_lesson)
    db.session.commit()
    return jsonify({"message": "Lesson added", "lesson": {"id": new_lesson.id, "title": new_lesson.title, "order": new_lesson.order}})

@editor_bp.route("/lesson/<int:lesson_id>", methods=["PUT", "DELETE"])
@login_required
def modify_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    course = get_course_or_404(lesson.module.course_id) # Check ownership

    if request.method == "PUT": # Update title
        data = request.get_json()
        if not data or "title" not in data:
            abort(400, "Missing title")
        lesson.title = data["title"]
        db.session.commit()
        return jsonify({"message": "Lesson updated", "lesson": {"id": lesson.id, "title": lesson.title}})

    elif request.method == "DELETE":
        # Adjust order of subsequent lessons in the same module
        lessons_to_shift = Lesson.query.filter(
            Lesson.module_id == lesson.module_id,
            Lesson.order > lesson.order
        ).order_by(Lesson.order).all()
        for l in lessons_to_shift:
            l.order -= 1

        db.session.delete(lesson)
        db.session.commit()
        return jsonify({"message": "Lesson deleted"})

# --- Content Blocks --- #
@editor_bp.route("/lesson/<int:lesson_id>/blocks", methods=["POST"])
@login_required
def add_content_block(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    course = get_course_or_404(lesson.module.course_id) # Check ownership
    data = request.get_json()
    if not data or "block_type" not in data:
        abort(400, "Missing block_type")

    block_type = data["block_type"]
    # Default content based on type
    default_content = {}
    if block_type == "text":
        default_content = {"html": "<p>New text block</p>"}
    elif block_type == "image":
        default_content = {"url": "", "alt": ""}
    elif block_type == "video":
        default_content = {"url": ""}
    elif block_type == "quiz":
        default_content = {"question": "New Quiz Question?", "type": "mc", "options": ["Option 1", "Option 2"], "correct_answer": 0}
    elif block_type == "action":
        default_content = {"html": "<p>New action step</p>"}
    else:
        abort(400, "Invalid block_type")

    max_order = db.session.query(func.max(ContentBlock.order)).filter_by(lesson_id=lesson.id).scalar()
    new_order = (max_order or 0) + 1
    new_block = ContentBlock(lesson_id=lesson.id, block_type=block_type, content=default_content, order=new_order)
    db.session.add(new_block)
    db.session.commit()
    # Return the full block data so frontend can render it
    return jsonify({"message": "Content block added", "block": {"id": new_block.id, "block_type": new_block.block_type, "content": new_block.content, "order": new_block.order}})

@editor_bp.route("/block/<int:block_id>", methods=["PUT", "DELETE"])
@login_required
def modify_content_block(block_id):
    block = ContentBlock.query.get_or_404(block_id)
    course = get_course_or_404(block.lesson.module.course_id) # Check ownership

    if request.method == "PUT": # Update content
        data = request.get_json()
        if not data or "content" not in data:
            abort(400, "Missing content")
        # Basic validation/sanitization might be needed here depending on content type
        block.content = data["content"]
        db.session.commit()
        return jsonify({"message": "Block updated", "block": {"id": block.id, "content": block.content}})

    elif request.method == "DELETE":
        # Adjust order of subsequent blocks in the same lesson
        blocks_to_shift = ContentBlock.query.filter(
            ContentBlock.lesson_id == block.lesson_id,
            ContentBlock.order > block.order
        ).order_by(ContentBlock.order).all()
        for b in blocks_to_shift:
            b.order -= 1

        db.session.delete(block)
        db.session.commit()
        return jsonify({"message": "Block deleted"})

# --- Reordering API --- #
@editor_bp.route("/reorder", methods=["POST"])
@login_required
def reorder_items():
    data = request.get_json()
    if not data or "item_type" not in data or "item_id" not in data or "new_order" not in data:
        abort(400, "Missing parameters for reordering")

    item_type = data["item_type"]
    item_id = data["item_id"]
    new_order = int(data["new_order"]) # 1-based index from frontend?

    if item_type == "module":
        item = Module.query.get_or_404(item_id)
        course = get_course_or_404(item.course_id)
        siblings = Module.query.filter_by(course_id=item.course_id).order_by(Module.order).all()
        target_class = Module
        filter_attr = Module.course_id
        parent_id = item.course_id
    elif item_type == "lesson":
        item = Lesson.query.get_or_404(item_id)
        course = get_course_or_404(item.module.course_id)
        siblings = Lesson.query.filter_by(module_id=item.module_id).order_by(Lesson.order).all()
        target_class = Lesson
        filter_attr = Lesson.module_id
        parent_id = item.module_id
    elif item_type == "block":
        item = ContentBlock.query.get_or_404(item_id)
        course = get_course_or_404(item.lesson.module.course_id)
        siblings = ContentBlock.query.filter_by(lesson_id=item.lesson_id).order_by(ContentBlock.order).all()
        target_class = ContentBlock
        filter_attr = ContentBlock.lesson_id
        parent_id = item.lesson_id
    else:
        abort(400, "Invalid item_type")

    old_order = item.order
    if new_order == old_order:
        return jsonify({"message": "No change in order"})

    # Shift other items
    if new_order < old_order:
        # Moving up: Shift items between new_order and old_order down by 1
        items_to_shift = target_class.query.filter(
            filter_attr == parent_id,
            target_class.order >= new_order,
            target_class.order < old_order
        ).all()
        for sibling in items_to_shift:
            sibling.order += 1
    else: # new_order > old_order
        # Moving down: Shift items between old_order and new_order up by 1
        items_to_shift = target_class.query.filter(
            filter_attr == parent_id,
            target_class.order > old_order,
            target_class.order <= new_order
        ).all()
        for sibling in items_to_shift:
            sibling.order -= 1

    # Set the new order for the moved item
    item.order = new_order
    db.session.commit()

    # Optional: Renumber all siblings sequentially to ensure no gaps
    # all_siblings = target_class.query.filter(filter_attr == parent_id).order_by(target_class.order).all()
    # for i, sibling in enumerate(all_siblings):
    #     sibling.order = i + 1
    # db.session.commit()

    return jsonify({"message": f"{item_type.capitalize()} reordered successfully"})

# --- API to get item details for editor --- #
@editor_bp.route("/api/course/<int:course_id>/details", methods=["GET"])
@login_required
def get_course_details(course_id):
    course = get_course_or_404(course_id)
    # Return data needed for the course settings panel
    return jsonify({
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "outcome": course.outcome,
        "audience": course.audience
    })

@editor_bp.route("/api/course/<int:course_id>/intro", methods=["GET"])
@login_required
def get_intro_content(course_id):
    course = get_course_or_404(course_id)
    return jsonify({"content": course.intro_content})

@editor_bp.route("/api/course/<int:course_id>/conclusion", methods=["GET"])
@login_required
def get_conclusion_content(course_id):
    course = get_course_or_404(course_id)
    return jsonify({"content": course.conclusion_content})

@editor_bp.route("/api/module/<int:module_id>/details", methods=["GET"])
@login_required
def get_module_details(module_id):
    module = Module.query.get_or_404(module_id)
    get_course_or_404(module.course_id) # Check ownership
    return jsonify({"id": module.id, "title": module.title})

@editor_bp.route("/api/lesson/<int:lesson_id>/details", methods=["GET"])
@login_required
def get_lesson_details(lesson_id):
    lesson = Lesson.query.options(joinedload(Lesson.content_blocks)).get_or_404(lesson_id)
    get_course_or_404(lesson.module.course_id) # Check ownership
    blocks = sorted(lesson.content_blocks, key=lambda b: b.order)
    return jsonify({
        "id": lesson.id,
        "title": lesson.title,
        "blocks": [
            {"id": b.id, "block_type": b.block_type, "content": b.content, "order": b.order}
            for b in blocks
        ]
    })

