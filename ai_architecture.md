# Mini-Course Creator AI Integration Architecture

This document outlines the proposed architecture for integrating AI features into the Flask-based Mini-Course Creator application.

## 1. Overview

The architecture aims to integrate AI capabilities seamlessly into the existing Flask application structure, enhancing user experience without requiring a complete overhaul. It focuses on modularity, allowing for easier implementation, testing, and future expansion of AI features.

Key components:
*   **Frontend (Jinja2 Templates + JavaScript):** Modified existing templates to include UI elements for triggering AI actions. JavaScript handles asynchronous calls to the backend and updates the UI with AI responses.
*   **Backend (Flask):** New API endpoints handle AI requests, orchestrate calls to the AI Service Layer, and return results to the frontend.
*   **AI Service Layer:** A dedicated Python module within the Flask application encapsulates all interactions with external AI models/APIs.

## 2. AI Service Layer (`ai_service.py`)

*   **Purpose:** To abstract the communication with the chosen AI model/API (e.g., OpenAI GPT, Google Gemini, or another LLM).
*   **Implementation:**
    *   A Python class or set of functions within `ai_service.py`.
    *   Methods for specific AI tasks identified (e.g., `suggest_course_structure(topic)`, `generate_lesson_text(prompt)`, `generate_quiz(context)`, `explain_concept(concept_key)`).
    *   Handles API key management (likely via environment variables or a configuration file).
    *   Includes basic error handling for API calls.
    *   Designed to be easily swappable if the underlying AI provider changes.
*   **Configuration:** AI provider details (API endpoint, key) will be stored in the Flask app configuration.

## 3. Backend Integration (Flask)

*   **New API Endpoints:** Create a new Flask Blueprint (e.g., `ai_bp`) for AI-related routes.
    *   `POST /ai/suggest_structure`: Takes course topic/objective, returns suggested modules/lessons.
    *   `POST /ai/generate_text`: Takes lesson title/prompt, returns generated text content.
    *   `POST /ai/generate_quiz`: Takes lesson context, returns quiz questions/answers.
    *   `POST /ai/analyze_outcome`: Takes learning outcome text, returns suggestions.
    *   `POST /ai/explain`: Takes a context key (e.g., 'bp1_specificity'), returns a dynamic explanation for popups.
    *   `POST /ai/suggest_image_concept`: Takes lesson context, returns image ideas.
*   **Request Handling:**
    *   Endpoints receive data (e.g., topic, prompt, context) from frontend AJAX requests.
    *   Input validation and sanitization.
    *   Call appropriate methods in the `ai_service.py` layer.
    *   Format AI responses into JSON suitable for the frontend.
    *   Handle potential long-running AI calls (consider asynchronous task queues like Celery if calls are consistently slow, though initial implementation might use synchronous calls for simplicity).
*   **Authentication:** Ensure these endpoints are protected and only accessible by logged-in users.

## 4. Frontend Integration (Jinja2 Templates + JavaScript)

*   **UI Elements:**
    *   Add buttons/icons (e.g., "✨ Suggest Structure", "✍️ AI Generate", "💡 Explain More") to relevant sections in the Jinja2 templates (`edit_course.html`, potentially others).
    *   Use CSS (potentially adapting Tailwind classes from the user's example) for styling.
*   **JavaScript (`ai_interactions.js` - New File):**
    *   Add event listeners to the new UI elements.
    *   On trigger, gather necessary context from the DOM (e.g., course title input, lesson text area).
    *   Use the Fetch API or jQuery AJAX to make asynchronous POST requests to the Flask AI endpoints.
    *   Display loading indicators while waiting for responses.
    *   Handle responses:
        *   Populate text areas or suggestion boxes with generated content.
        *   Display suggestions or analysis results.
        *   Open modal dialogs or popups (using a library like Bootstrap's Modal or a custom solution) to show explanations fetched from `/ai/explain`.
    *   Handle errors gracefully (e.g., display an error message if the AI call fails).
*   **Homepage Styling:** Adapt the visual design (colors, fonts, layout, Tailwind classes) from the user-provided React component (`pasted_content.txt`) into the existing Jinja2 templates (`base.html`, `index.html`, `login.html`, `register.html`, `dashboard.html`) and `style.css`. This involves translating the structure and classes, not running React itself.

## 5. Data Flow Example (Content Generation)

1.  User clicks "AI Generate Text" button in a lesson's text block editor.
2.  JavaScript (`ai_interactions.js`) captures the lesson title or a user prompt.
3.  JS sends a POST request to `/ai/generate_text` with the prompt data.
4.  Flask endpoint receives the request, validates it.
5.  Flask calls `ai_service.generate_lesson_text(prompt)`.
6.  `ai_service` calls the external AI API.
7.  AI API returns generated text.
8.  `ai_service` returns text to Flask endpoint.
9.  Flask endpoint formats the response as JSON and sends it back to the browser.
10. JavaScript receives the JSON response.
11. JS updates the text area content with the generated text and hides the loading indicator.

## 6. Popup Information System

*   **Trigger:** Clicking designated 'Learn More' icons (e.g., `(?)` icons enhanced or replaced).
*   **Mechanism:**
    *   Each icon will have a unique identifier or data attribute representing the concept (e.g., `data-concept=
