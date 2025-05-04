// /home/ubuntu/mini-course-creator/ai_interactions.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("AI Interactions JS Loaded");

    // --- Modal Elements ---
    const aiPopupModal = document.getElementById("ai-popup-modal");
    const aiPopupContent = document.getElementById("ai-popup-content");
    const modalCloseButtons = aiPopupModal?.querySelectorAll("[data-dismiss=\"modal\"]");

    // --- Helper Functions ---
    function showLoading(button) {
        if (button) {
            button.disabled = true;
            // Use text or add a spinner class
            button.innerHTML = 
                `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...`; 
        }
    }

    function hideLoading(button, originalContent) {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalContent; // Restore original button content (might include icons)
        }
    }

    function displaySuggestion(elementId, suggestionText) {
        const suggestionEl = document.getElementById(elementId);
        if (suggestionEl) {
            suggestionEl.textContent = suggestionText;
            suggestionEl.style.display = "block"; // Make sure it's visible
        }
    }

    function displayError(button, message = "AI request failed.") {
        // TODO: Implement user-friendly error display (e.g., toast notification)
        console.error(message);
        alert(message); // Simple alert for now
    }

    function showModal(contentHtml) {
        if (aiPopupModal && aiPopupContent) {
            aiPopupContent.innerHTML = contentHtml;
            aiPopupModal.style.display = "block";
        }
    }

    function hideModal() {
        if (aiPopupModal) {
            aiPopupModal.style.display = "none";
            aiPopupContent.innerHTML = "<p>Loading explanation...</p>"; // Reset content
        }
    }

    async function callAiEndpoint(endpoint, data, button, originalButtonContent) {
        showLoading(button);
        try {
            const response = await fetch(`/ai${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Add CSRF token header if Flask-WTF CSRF protection is enabled globally
                    // "X-CSRFToken": getCsrfToken() 
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); // Try to get error details
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            hideLoading(button, originalButtonContent);
            return result;

        } catch (error) {
            console.error(`Error calling ${endpoint}:`, error);
            displayError(button, `AI request failed: ${error.message}`);
            hideLoading(button, originalButtonContent); // Ensure button is re-enabled on error
            return null; // Indicate failure
        }
    }

    // --- Modal Event Listeners ---
    if (modalCloseButtons) {
        modalCloseButtons.forEach(button => {
            button.addEventListener("click", hideModal);
        });
    }
    // Close modal if clicking outside the content
    if (aiPopupModal) {
        aiPopupModal.addEventListener("click", (event) => {
            if (event.target === aiPopupModal) {
                hideModal();
            }
        });
    }

    // --- Event Listeners for AI Features (using event delegation) ---
    const editorPanel = document.getElementById("editor-panel"); 
    const structurePanel = document.getElementById("structure-panel"); // For tooltips there too
    const mainContainer = document.body; // Use body as a fallback container

    const delegateContainer = editorPanel || mainContainer; // Prefer editor panel if available

    delegateContainer.addEventListener("click", async (event) => {
        const target = event.target;

        // --- AI Button Clicks ---
        if (target.matches(".ai-btn")) {
            const button = target;
            const originalButtonContent = button.innerHTML; // Store original HTML content
            let result = null;

            // Generate Text
            if (button.id === "ai-generate-text-btn") { // Assuming dynamic buttons get this ID/class
                const blockElement = button.closest(".content-block");
                const targetTextArea = blockElement?.querySelector("textarea"); // Or Quill editor div
                const quillEditorDiv = blockElement?.querySelector(".ql-editor"); // Check for Quill

                if (!targetTextArea && !quillEditorDiv) {
                    console.error("Target editor not found for AI text generation."); return;
                }
                let prompt = document.getElementById("lesson-title-input")?.value || "lesson content";
                prompt = prompt.trim();
                if (!prompt) { alert("Please provide a lesson title for context."); return; }

                result = await callAiEndpoint("/generate_text", { prompt }, button, originalButtonContent);
                if (result?.generated_text) {
                    if (quillEditorDiv && quillEditorDiv.__quill) { // Check if Quill instance exists
                        quillEditorDiv.__quill.setText(result.generated_text);
                    } else if (targetTextArea) {
                        targetTextArea.value = result.generated_text;
                    }
                }
            }
            // Generate Quiz
            else if (button.id === "ai-generate-quiz-btn") { // Assuming dynamic buttons get this ID/class
                 const blockElement = button.closest(".content-block[data-block-type=\"quiz\"]");
                 const questionInput = blockElement?.querySelector("input[name$=\"-question\"]");
                 const optionsContainer = blockElement?.querySelector(".quiz-options-container");

                 if (!blockElement || !questionInput || !optionsContainer) {
                     console.error("Required elements not found for AI quiz generation."); return;
                 }
                 let context = document.getElementById("lesson-title-input")?.value || "lesson context";
                 context = context.trim();

                 result = await callAiEndpoint("/generate_quiz", { context }, button, originalButtonContent);
                 if (result?.generated_quiz) {
                     const quiz = result.generated_quiz;
                     questionInput.value = quiz.question;
                     // TODO: Update options UI based on editor.js structure
                     console.log("Generated Quiz:", quiz); 
                     alert("AI Generated Quiz (check console). UI update needed.");
                 }
            }
            // Analyze Outcome
            else if (button.id === "ai-analyze-outcome-btn") {
                const outcomeInput = document.getElementById("course-outcome");
                const outcomeText = outcomeInput?.value.trim();
                if (!outcomeText) { alert("Please enter a learning outcome first."); return; }
                result = await callAiEndpoint("/analyze_outcome", { outcome_text: outcomeText }, button, originalButtonContent);
                if (result?.suggestion) {
                    displaySuggestion("ai-outcome-suggestion", `AI Suggestion: ${result.suggestion}`);
                }
            }
            // Analyze Audience
            else if (button.id === "ai-analyze-audience-btn") {
                const audienceInput = document.getElementById("course-audience");
                const audienceText = audienceInput?.value.trim();
                if (!audienceText) { alert("Please enter a target audience first."); return; }
                result = await callAiEndpoint("/analyze_audience", { audience_text: audienceText }, button, originalButtonContent);
                if (result?.suggestion) {
                    displaySuggestion("ai-audience-suggestion", `AI Suggestion: ${result.suggestion}`);
                }
            }
            // Suggest Structure
            else if (button.id === "ai-suggest-structure-btn") {
                const courseTitleInput = document.getElementById("course-title");
                const topic = courseTitleInput?.value.trim();
                if (!topic) { alert("Please enter a course title (topic) first."); return; }
                result = await callAiEndpoint("/suggest_structure", { topic }, button, originalButtonContent);
                if (result?.suggested_structure) {
                    const structureHtml = "<strong>AI Suggested Structure:</strong><pre>" + JSON.stringify(result.suggested_structure, null, 2) + "</pre>";
                    displaySuggestion("ai-structure-suggestion", structureHtml); // Display raw JSON for now
                    // TODO: Format structure suggestion nicely
                }
            }
             // Suggest Image Concept
            else if (button.id === "ai-suggest-image-btn") { // Assuming dynamic buttons get this ID/class
                const blockElement = button.closest(".content-block");
                const suggestionElement = blockElement?.querySelector(".ai-image-suggestion"); // Placeholder element
                if (!suggestionElement) { console.error("Image suggestion element not found."); return; }
                
                let context = document.getElementById("lesson-title-input")?.value || "lesson content";
                context = context.trim();
                
                result = await callAiEndpoint("/suggest_image_concept", { context }, button, originalButtonContent);
                if (result?.suggestion) {
                    suggestionElement.textContent = `AI Suggestion: ${result.suggestion}`;
                    suggestionElement.style.display = "block";
                }
            }
        }

        // --- Tooltip Icon Click for AI Explanation Popup ---
        // Check if the click is on the icon itself or its container
        const tooltipContainer = target.closest(".tooltip-container[data-concept]");
        if (tooltipContainer) {
            const conceptKey = tooltipContainer.dataset.concept;
            if (conceptKey) {
                event.preventDefault(); // Prevent default if it's a link
                showModal("<p>Fetching AI explanation...</p>"); // Show loading state in modal
                
                // Call AI endpoint without showing loading on the icon itself
                const result = await callAiEndpoint("/explain", { concept_key: conceptKey }, null, null);
                
                if (result?.explanation) {
                    showModal(result.explanation); // Display fetched explanation
                } else {
                    showModal("<p>Sorry, couldn't fetch an explanation for this topic.</p>"); // Show error in modal
                }
            }
        }
    });

    // --- Add AI buttons dynamically in editor.js --- 
    // This part needs modification in editor.js to include buttons like:
    // `<button type="button" class="btn btn-info btn-sm ai-btn ai-generate-text-btn" id="ai-generate-text-btn">✍️ AI Generate</button>`
    // `<button type="button" class="btn btn-info btn-sm ai-btn ai-generate-quiz-btn" id="ai-generate-quiz-btn">✍️ AI Generate Quiz</button>`
    // `<button type="button" class="btn btn-info btn-sm ai-btn ai-suggest-image-btn" id="ai-suggest-image-btn">🖼️ AI Suggest Image</button>`
    // And suggestion divs: `<div class="ai-suggestion ai-image-suggestion"></div>`
    console.log("Reminder: Update editor.js to include AI buttons and suggestion divs within dynamic content blocks.");

});

