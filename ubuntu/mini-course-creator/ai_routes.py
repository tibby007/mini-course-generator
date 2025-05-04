# /home/ubuntu/mini-course-creator/ai_routes.py

from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user

# Import the AI service instance (assuming it's initialized in ai_service.py)
# We might need to adjust imports based on Flask app structure (e.g., using factory pattern)
try:
    from ai_service import ai_service_instance
except ImportError:
    # Handle potential circular import or structure issues if ai_service needs app context
    # This is a simplified approach; a factory pattern is often better.
    from ai_service import ai_service_instance

ai_bp = Blueprint('ai_bp', __name__, url_prefix='/ai')

@ai_bp.route('/generate_text', methods=['POST'])
@login_required
def generate_text_route():
    """Endpoint to generate lesson text content."""
    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    try:
        # Add user context if needed by the real AI model
        # user_info = f"User: {current_user.id}"
        generated_text = ai_service_instance.generate_lesson_text(prompt)
        return jsonify({"generated_text": generated_text})
    except Exception as e:
        current_app.logger.error(f"AI text generation failed: {e}")
        return jsonify({"error": "Failed to generate text"}), 500

@ai_bp.route('/generate_quiz', methods=['POST'])
@login_required
def generate_quiz_route():
    """Endpoint to generate quiz content."""
    data = request.get_json()
    context = data.get('context')

    if not context:
        return jsonify({"error": "Context is required"}), 400

    try:
        # Add user context if needed
        generated_quiz = ai_service_instance.generate_quiz(context)
        return jsonify({"generated_quiz": generated_quiz})
    except Exception as e:
        current_app.logger.error(f"AI quiz generation failed: {e}")
        return jsonify({"error": "Failed to generate quiz"}), 500

# Add other AI routes here later (suggest_structure, analyze_outcome, explain_concept, suggest_image_concept)




@ai_bp.route("/analyze_outcome", methods=["POST"])
@login_required
def analyze_outcome_route():
    """Endpoint to analyze learning outcome text."""
    data = request.get_json()
    outcome_text = data.get("outcome_text")

    if not outcome_text:
        return jsonify({"error": "Outcome text is required"}), 400

    try:
        suggestion = ai_service_instance.analyze_outcome(outcome_text)
        return jsonify({"suggestion": suggestion})
    except Exception as e:
        current_app.logger.error(f"AI outcome analysis failed: {e}")
        return jsonify({"error": "Failed to analyze outcome"}), 500




@ai_bp.route("/analyze_audience", methods=["POST"])
@login_required
def analyze_audience_route():
    """Endpoint to analyze target audience text."""
    data = request.get_json()
    audience_text = data.get("audience_text")

    if not audience_text:
        return jsonify({"error": "Audience text is required"}), 400

    try:
        suggestion = ai_service_instance.analyze_audience(audience_text)
        return jsonify({"suggestion": suggestion})
    except Exception as e:
        current_app.logger.error(f"AI audience analysis failed: {e}")
        return jsonify({"error": "Failed to analyze audience"}), 500




@ai_bp.route("/suggest_structure", methods=["POST"])
@login_required
def suggest_structure_route():
    """Endpoint to suggest course structure."""
    data = request.get_json()
    topic = data.get("topic")

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    try:
        structure = ai_service_instance.suggest_course_structure(topic)
        # Add specific handling for workflow automation topics if needed
        if "workflow automation" in topic.lower():
            # Potentially modify or add specific modules/lessons for this topic
            structure["modules"].append({
                "title": "Module 4: Identifying Automation Opportunities (AI)",
                "lessons": [
                    "4.1: Exercise: List Your Top 5 Tasks",
                    "4.2: Analyzing Tasks for Automation Potential",
                    "4.3: Prioritizing Opportunities"
                ]
            })
        return jsonify({"suggested_structure": structure})
    except Exception as e:
        current_app.logger.error(f"AI structure suggestion failed: {e}")
        return jsonify({"error": "Failed to suggest structure"}), 500




@ai_bp.route("/explain", methods=["POST"])
@login_required
def explain_concept_route():
    """Endpoint to get an explanation for a concept."""
    data = request.get_json()
    concept_key = data.get("concept_key")

    if not concept_key:
        return jsonify({"error": "Concept key is required"}), 400

    try:
        explanation = ai_service_instance.explain_concept(concept_key)
        # Basic markdown processing (replace **text** with <strong>text</strong>)
        # In a real app, use a proper Markdown library
        explanation = explanation.replace("**", "<strong>", 1).replace("**", "</strong>", 1)
        explanation = explanation.replace("*", "<em>", 1).replace("*", "</em>", 1)
        return jsonify({"explanation": explanation})
    except Exception as e:
        current_app.logger.error(f"AI explanation failed for key {concept_key}: {e}")
        return jsonify({"error": "Failed to get explanation"}), 500

@ai_bp.route("/suggest_image_concept", methods=["POST"])
@login_required
def suggest_image_concept_route():
    """Endpoint to suggest image concepts."""
    data = request.get_json()
    context = data.get("context")

    if not context:
        return jsonify({"error": "Context is required"}), 400

    try:
        suggestion = ai_service_instance.suggest_image_concept(context)
        return jsonify({"suggestion": suggestion})
    except Exception as e:
        current_app.logger.error(f"AI image concept suggestion failed: {e}")
        return jsonify({"error": "Failed to suggest image concept"}), 500

