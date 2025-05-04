// JavaScript specific to the course editor page

document.addEventListener("DOMContentLoaded", function() {
    console.log("Editor specific JS loaded.");

    // --- Global Variables & Config --- //
    const courseIdElement = document.querySelector("#structure-panel li[data-type=\"course\"]");
    const courseId = courseIdElement ? courseIdElement.dataset.id : null;
    const structurePanel = document.getElementById("structure-panel");
    const editorPanel = document.getElementById("editor-panel");
    const moduleList = document.getElementById("module-list");
    let quillInstances = {}; // To store Quill editor instances

    if (!courseId) {
        console.error("Could not determine Course ID. Editor functionality may be limited.");
        // Optionally disable features or show an error message
    }

    const quillOptions = {
        modules: {
            toolbar: [
                [{ "header": [1, 2, 3, false] }],
                ["bold", "italic", "underline"],
                [{ "list": "ordered" }, { "list": "bullet" }],
                ["link"],
                ["clean"]
            ]
        },
        theme: "snow"
    };

    // --- Helper Functions --- //

    // Debounce function (remains the same)
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Function to make API requests (remains the same)
    async function apiRequest(url, method = "GET", body = null) {
        const options = {
            method: method,
            headers: {
                "Content-Type": "application/json",
                // Add CSRF token header if needed
            },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || "Unknown error"}`);
            }
            if (response.status === 204 || method === "DELETE") {
                return { message: "Operation successful" };
            }
            return await response.json();
        } catch (error) {
            console.error("API Request Failed:", error);
            alert(`Error: ${error.message}`);
            throw error;
        }
    }

    // Function to initialize Quill editor (remains the same)
    function initializeQuill(containerId, initialContent = "") {
        if (quillInstances[containerId]) {
            quillInstances[containerId].root.innerHTML = initialContent;
            return quillInstances[containerId];
        }
        const editorContainer = document.getElementById(containerId);
        if (editorContainer) {
            const quill = new Quill(editorContainer, quillOptions);
            quill.root.innerHTML = initialContent;
            // Store the instance on the DOM element for easier access in ai_interactions.js
            editorContainer.__quill = quill; 
            quillInstances[containerId] = quill;
            return quill;
        }
        return null;
    }

    // --- Best Practice Integration (remains the same) --- //
    const outcomeTextarea = document.getElementById("course-outcome");
    if (outcomeTextarea) {
        const outcomeCounter = document.createElement("div");
        outcomeCounter.style.fontSize = "0.8em";
        outcomeCounter.style.marginTop = "5px";
        outcomeCounter.style.color = "#6c757d";
        outcomeTextarea.parentNode.appendChild(outcomeCounter);
        function updateOutcomeCounter() {
            const maxLength = 200;
            const currentLength = outcomeTextarea.value.length;
            outcomeCounter.textContent = `${currentLength}/${maxLength} characters. Keep it specific and actionable!`;
            outcomeCounter.style.color = currentLength > maxLength ? "red" : "#6c757d";
        }
        outcomeTextarea.addEventListener("input", updateOutcomeCounter);
        updateOutcomeCounter();
    }
    const audienceTextarea = document.getElementById("course-audience");
    if (audienceTextarea) {
        const audienceCounter = document.createElement("div");
        audienceCounter.style.fontSize = "0.8em";
        audienceCounter.style.marginTop = "5px";
        audienceCounter.style.color = "#6c757d";
        audienceTextarea.parentNode.appendChild(audienceCounter);
        function updateAudienceCounter() {
            const maxLength = 300;
            const currentLength = audienceTextarea.value.length;
            audienceCounter.textContent = `${currentLength}/${maxLength} characters. Focus on their starting point and goals.`;
            audienceCounter.style.color = currentLength > maxLength ? "red" : "#6c757d";
        }
        audienceTextarea.addEventListener("input", updateAudienceCounter);
        updateAudienceCounter();
    }

    // --- Editor Panel Loading & Saving --- //

    async function loadEditorContent(itemType, itemId) {
        console.log(`Loading editor content for ${itemType} ID: ${itemId}`);
        const editorPanels = {
            "course": document.getElementById("course-settings-view"),
            "intro": document.getElementById("intro-view"),
            "module": document.getElementById("module-view"),
            "lesson": document.getElementById("lesson-view"),
            "conclusion": document.getElementById("conclusion-view")
        };
        Object.values(editorPanels).forEach(panel => { if(panel) panel.style.display = "none"; });
        const targetPanel = editorPanels[itemType];
        if (!targetPanel) return;

        try {
            targetPanel.style.display = "block";
            if (itemType === "course") {
                // Data loaded via Flask form initially
            } else if (itemType === "intro") {
                const data = await apiRequest(`/editor/api/course/${courseId}/intro`);
                initializeQuill("intro-content-editor", data.content || "");
            } else if (itemType === "module") {
                const data = await apiRequest(`/editor/api/module/${itemId}/details`);
                targetPanel.querySelector("input[name=\"module_title\"]").value = data.title;
                targetPanel.querySelector("input[name=\"current_module_id\"]").value = itemId;
            } else if (itemType === "lesson") {
                const data = await apiRequest(`/editor/api/lesson/${itemId}/details`);
                targetPanel.querySelector("input[name=\"lesson_title\"]").value = data.title;
                targetPanel.querySelector("input[name=\"current_lesson_id\"]").value = itemId;
                renderContentBlocks(itemId, data.blocks);
            } else if (itemType === "conclusion") {
                const data = await apiRequest(`/editor/api/course/${courseId}/conclusion`);
                initializeQuill("conclusion-content-editor", data.content || "");
            }
        } catch (error) {
            console.error(`Failed to load content for ${itemType} ${itemId}:`, error);
            targetPanel.style.display = "none";
            alert(`Failed to load content for ${itemType}. Please try again.`);
        }
    }

    // Save Course Settings (Title, Desc, Outcome, Audience)
    editorPanel.querySelector(".save-settings-btn")?.addEventListener("click", async () => {
        const title = document.getElementById("course-title")?.value;
        const description = document.getElementById("course-description")?.value;
        const outcome = document.getElementById("course-outcome")?.value;
        const audience = document.getElementById("course-audience")?.value;

        if (!outcome) {
            alert("Learning Outcome is mandatory.");
            return;
        }

        try {
            await apiRequest(`/editor/course/${courseId}/settings`, "POST", {
                title,
                description,
                outcome,
                audience
            });
            alert("Course settings saved.");
            // Update course title in header/tab if needed
            document.title = `Edit Course: ${title || "New Course"} - Mini-Course Creator`;
        } catch (error) {
            // Error already alerted by apiRequest
        }
    });

    // Save Intro Content (remains the same)
    editorPanel.querySelector(".save-intro-btn")?.addEventListener("click", async () => {
        const quill = quillInstances["intro-content-editor"];
        if (quill) {
            const content = quill.root.innerHTML;
            await apiRequest(`/editor/course/${courseId}/intro`, "POST", { content });
            alert("Introduction saved.");
        }
    });

    // Save Conclusion Content (remains the same)
    editorPanel.querySelector(".save-conclusion-btn")?.addEventListener("click", async () => {
        const quill = quillInstances["conclusion-content-editor"];
        if (quill) {
            const content = quill.root.innerHTML;
            await apiRequest(`/editor/course/${courseId}/conclusion`, "POST", { content });
            alert("Conclusion saved.");
        }
    });

    // Save Module Title (remains the same)
    editorPanel.querySelector(".save-module-btn")?.addEventListener("click", async () => {
        const moduleId = editorPanel.querySelector("input[name=\"current_module_id\"]").value;
        const title = editorPanel.querySelector("input[name=\"module_title\"]").value;
        if (moduleId && title) {
            const data = await apiRequest(`/editor/module/${moduleId}`, "PUT", { title });
            const moduleLi = structurePanel.querySelector(`li[data-type=\"module\"][data-id=\"${moduleId}\"] .item-title`);
            if (moduleLi) moduleLi.textContent = data.module.title;
            alert("Module title saved.");
        }
    });

    // Save Lesson Title (remains the same)
    editorPanel.querySelector(".save-lesson-btn")?.addEventListener("click", async () => {
        const lessonId = editorPanel.querySelector("input[name=\"current_lesson_id\"]").value;
        const title = editorPanel.querySelector("input[name=\"lesson_title\"]").value;
        if (lessonId && title) {
            const data = await apiRequest(`/editor/lesson/${lessonId}`, "PUT", { title });
            const lessonLi = structurePanel.querySelector(`li[data-type=\"lesson\"][data-id=\"${lessonId}\"] .item-title`);
            if (lessonLi) lessonLi.textContent = data.lesson.title;
            alert("Lesson title saved.");
        }
    });

    // --- Content Block Rendering & Management --- //

    function renderContentBlocks(lessonId, blocks) {
        const blocksArea = document.getElementById("content-blocks-area");
        blocksArea.innerHTML = ""; // Clear existing
        if (!blocks || blocks.length === 0) {
            blocksArea.innerHTML = "<p>No content blocks yet. Add one below!</p>";
            return;
        }
        // Sort blocks by order before rendering
        blocks.sort((a, b) => a.order - b.order);
        blocks.forEach(block => {
            const blockElement = createBlockElement(lessonId, block);
            blocksArea.appendChild(blockElement);
        });
    }

    function createBlockElement(lessonId, block) {
        const blockElement = document.createElement("div");
        blockElement.className = "content-block";
        blockElement.dataset.blockId = block.id;
        blockElement.dataset.order = block.order;
        blockElement.dataset.blockType = block.block_type; // Add block type for AI targeting

        let editorHTML = "";
        let aiControlsHTML = ""; // To hold AI buttons/suggestions
        const editorId = `block-editor-${block.id}`;

        switch (block.block_type) {
            case "text":
            case "action":
                editorHTML = `<div class=\"block-editor\" id=\"${editorId}\"></div>`;
                aiControlsHTML = `
                    <button type=\"button\" class=\"btn btn-info btn-sm ai-btn\" id=\"ai-generate-text-btn\" title=\"Generate draft content based on lesson title\">✍️ AI Generate</button>
                `;
                break;
            case "image":
                editorHTML = `
                    <div class=\"block-editor form-group\">
                        <label>Image URL:</label>
                        <input type=\"text\" class=\"form-control image-url\" value=\"${block.content.url || \"\"}\">
                        <label>Alt Text:</label>
                        <input type=\"text\" class=\"form-control image-alt\" value=\"${block.content.alt || \"\"}\">
                    </div>`;
                aiControlsHTML = `
                    <button type=\"button\" class=\"btn btn-info btn-sm ai-btn\" id=\"ai-suggest-image-btn\" title=\"Suggest image ideas based on lesson title\">🖼️ AI Suggest Image</button>
                    <div class=\"ai-suggestion ai-image-suggestion\" style=\"display: none;\"></div>
                `;
                break;
            case "video":
                editorHTML = `
                    <div class=\"block-editor form-group\">
                        <label>Video URL (YouTube/Vimeo):</label>
                        <input type=\"text\" class=\"form-control video-url\" value=\"${block.content.url || \"\"}\">
                        <span class=\"tooltip-container\" data-concept=\"bp6_media\"><span class=\"tooltip-icon\">?</span><span class=\"tooltip-text\">Keep videos short (&lt; 5 mins)!</span></span>
                    </div>`;
                // No AI controls for video currently
                break;
            case "quiz":
                let optionsHTML = (block.content.options || []).map((opt, index) => `
                    <div class=\"quiz-option-item\">
                        <input type=\"radio\" name=\"correct_answer_${block.id}\" value=\"${index}\" ${block.content.correct_answer == index ? "checked" : ""}>
                        <input type=\"text\" value=\"${opt}\" class=\"form-control quiz-option-text\">
                        <button type=\"button\" class=\"btn btn-danger btn-xs remove-option-btn\">&times;</button>
                    </div>`).join("");
                editorHTML = `
                    <div class=\"block-editor form-group quiz-editor\">
                        <label>Question:</label>
                        <input type=\"text\" class=\"form-control quiz-question\" value=\"${block.content.question || \"\"}\">
                        <label>Type:</label>
                        <select class=\"form-control quiz-type\">
                            <option value=\"mc\" ${block.content.type === \"mc\" ? \"selected\" : \"\"}>Multiple Choice</option>
                            <option value=\"tf\" ${block.content.type === \"tf\" ? \"selected\" : \"\"}>True/False</option>
                        </select>
                        <label>Options (Select Correct Answer):</label>
                        <div class=\"quiz-options-editor\">
                            ${optionsHTML}
                        </div>
                        <button type="button" class=\"btn btn-secondary btn-sm add-option-btn\">+ Add Option</button>
                    </div>`;
                 aiControlsHTML = `
                    <button type=\"button\" class=\"btn btn-info btn-sm ai-btn\" id=\"ai-generate-quiz-btn\" title=\"Generate quiz question and options based on lesson title\">✍️ AI Generate Quiz</button>
                `;
                break;
            default:
                editorHTML = `<p>Unsupported block type: ${block.block_type}</p>`;
        }

        blockElement.innerHTML = `
            <div class=\"content-block-header\">
                <span>${block.block_type.charAt(0).toUpperCase() + block.block_type.slice(1)} Block</span>
                <div>
                    <button type=\"button\" class=\"btn btn-secondary btn-xs move-block-up\" title=\"Move Up\">&#9650;</button>
                    <button type=\"button\" class=\"btn btn-secondary btn-xs move-block-down\" title=\"Move Down\">&#9660;</button>
                    <button type=\"button\" class=\"btn btn-primary btn-xs save-block-btn\">Save</button>
                    <button type=\"button\" class=\"btn btn-danger btn-xs delete-block-btn\">Delete</button>
                </div>
            </div>
            ${editorHTML}
            <div class=\"ai-controls\" style=\"margin-top: 10px;\">
                ${aiControlsHTML} 
            </div>
        `;

        // Initialize Quill after appending if needed
        if (block.block_type === "text" || block.block_type === "action") {
            setTimeout(() => {
                initializeQuill(editorId, block.content.html || "");
            }, 0);
        }

        // Add event listeners for block actions
        blockElement.querySelector(".save-block-btn")?.addEventListener("click", () => saveContentBlock(block.id));
        blockElement.querySelector(".delete-block-btn")?.addEventListener("click", () => deleteContentBlock(block.id, blockElement));
        blockElement.querySelector(".move-block-up")?.addEventListener("click", () => moveItem("block", block.id, "up"));
        blockElement.querySelector(".move-block-down")?.addEventListener("click", () => moveItem("block", block.id, "down"));

        // Quiz specific listeners
        if (block.block_type === "quiz") {
            blockElement.querySelector(".add-option-btn")?.addEventListener("click", (e) => addQuizOption(e.target.closest(".quiz-editor")));
            blockElement.querySelector(".quiz-options-editor")?.addEventListener("click", (e) => {
                if (e.target.classList.contains("remove-option-btn")) {
                    e.target.closest(".quiz-option-item").remove();
                }
            });
            // Add listener for quiz type change if needed (e.g., to adjust options for T/F)
        }

        return blockElement;
    }

    // Add Quiz Option
    function addQuizOption(quizEditor) {
        const optionsContainer = quizEditor.querySelector(".quiz-options-editor");
        const blockId = quizEditor.closest(".content-block").dataset.blockId;
        const newIndex = optionsContainer.children.length;
        const optionElement = document.createElement("div");
        optionElement.className = "quiz-option-item";
        optionElement.innerHTML = `
            <input type=\"radio\" name=\"correct_answer_${blockId}\" value=\"${newIndex}\">
            <input type=\"text\" value=\"New Option\" class=\"form-control quiz-option-text\">
            <button type=\"button\" class=\"btn btn-danger btn-xs remove-option-btn\">&times;</button>
        `;
        optionsContainer.appendChild(optionElement);
    }

    // Save Content Block
    async function saveContentBlock(blockId) {
        const blockElement = document.querySelector(`.content-block[data-block-id=\"${blockId}\"]`);
        if (!blockElement) return;

        const blockType = blockElement.dataset.blockType;
        let content = {};

        switch (blockType) {
            case "text":
            case "action":
                const quill = quillInstances[`block-editor-${blockId}`];
                content.html = quill ? quill.root.innerHTML : "";
                break;
            case "image":
                content.url = blockElement.querySelector(".image-url").value;
                content.alt = blockElement.querySelector(".image-alt").value;
                break;
            case "video":
                content.url = blockElement.querySelector(".video-url").value;
                break;
            case "quiz":
                content.question = blockElement.querySelector(".quiz-question").value;
                content.type = blockElement.querySelector(".quiz-type").value;
                content.options = Array.from(blockElement.querySelectorAll(".quiz-option-text")).map(input => input.value);
                const checkedRadio = blockElement.querySelector(`input[name=\"correct_answer_${blockId}\"]:checked`);
                content.correct_answer = checkedRadio ? parseInt(checkedRadio.value) : -1; // Use -1 or null for no answer selected
                break;
        }

        try {
            await apiRequest(`/editor/block/${blockId}`, "PUT", { content });
            alert("Block saved.");
        } catch (error) {
            // Error already handled by apiRequest
        }
    }

    // Delete Content Block
    async function deleteContentBlock(blockId, blockElement) {
        if (confirm("Are you sure you want to delete this content block?")) {
            try {
                await apiRequest(`/editor/block/${blockId}`, "DELETE");
                blockElement.remove();
                alert("Block deleted.");
            } catch (error) {
                // Error handled by apiRequest
            }
        }
    }

    // Add Content Block Button
    document.getElementById("add-content-block-btn")?.addEventListener("click", async () => {
        const lessonId = editorPanel.querySelector("input[name=\"current_lesson_id\"]").value;
        const blockType = document.getElementById("add-block-type").value;
        if (!lessonId) {
            alert("Please select a lesson first.");
            return;
        }
        try {
            const data = await apiRequest(`/editor/lesson/${lessonId}/blocks`, "POST", { block_type: blockType });
            const newBlockElement = createBlockElement(lessonId, data.block);
            const blocksArea = document.getElementById("content-blocks-area");
            // Remove the "No content blocks yet" message if present
            const placeholder = blocksArea.querySelector("p");
            if (placeholder && placeholder.textContent.includes("No content blocks")) {
                placeholder.remove();
            }
            blocksArea.appendChild(newBlockElement);
        } catch (error) {
            // Error handled by apiRequest
        }
    });

    // --- Structure Panel Management --- //

    // Event delegation for structure panel clicks
    structurePanel?.addEventListener("click", async (event) => {
        const target = event.target;
        const listItem = target.closest("li[data-type]");

        if (listItem) {
            // Handle item selection
            if (!target.closest(".actions") && !target.closest(".add-lesson-btn")) {
                structurePanel.querySelectorAll("li").forEach(li => li.classList.remove("active"));
                listItem.classList.add("active");
                const itemType = listItem.dataset.type;
                const itemId = listItem.dataset.id;
                loadEditorContent(itemType, itemId);
            }
        }

        // Handle Add Lesson button
        if (target.classList.contains("add-lesson-btn")) {
            const moduleId = target.dataset.moduleId;
            try {
                const data = await apiRequest(`/editor/module/${moduleId}/lessons`, "POST");
                const lessonList = structurePanel.querySelector(`.lesson-list[data-module-id=\"${moduleId}\"]`);
                const newLessonLi = createStructureListItem("lesson", data.lesson);
                lessonList.appendChild(newLessonLi);
            } catch (error) {
                // Error handled by apiRequest
            }
        }

        // Handle Delete button
        if (target.classList.contains("delete-item")) {
            const itemLi = target.closest("li[data-type]");
            const itemType = itemLi.dataset.type;
            const itemId = itemLi.dataset.id;
            if (confirm(`Are you sure you want to delete this ${itemType}?`)) {
                try {
                    await apiRequest(`/editor/${itemType}/${itemId}`, "DELETE");
                    itemLi.remove();
                    // If the deleted item was active, load default view (e.g., course settings)
                    if (itemLi.classList.contains("active")) {
                        structurePanel.querySelector("li[data-type=\"course\"]").click();
                    }
                } catch (error) {
                    // Error handled by apiRequest
                }
            }
        }

        // Handle Move Up/Down buttons
        if (target.classList.contains("move-up")) {
            const itemLi = target.closest("li[data-type]");
            moveItem(itemLi.dataset.type, itemLi.dataset.id, "up");
        }
        if (target.classList.contains("move-down")) {
            const itemLi = target.closest("li[data-type]");
            moveItem(itemLi.dataset.type, itemLi.dataset.id, "down");
        }
    });

    // Add Module Button
    document.getElementById("add-module-btn")?.addEventListener("click", async () => {
        try {
            const data = await apiRequest(`/editor/course/${courseId}/modules`, "POST");
            const newModuleLi = createStructureListItem("module", data.module);
            moduleList.appendChild(newModuleLi);
        } catch (error) {
            // Error handled by apiRequest
        }
    });

    // Function to create structure list items (Module/Lesson)
    function createStructureListItem(type, item) {
        const li = document.createElement("li");
        li.dataset.type = type;
        li.dataset.id = item.id;
        li.dataset.order = item.order;

        let lessonListHTML = "";
        if (type === "module") {
            lessonListHTML = `
                <button type=\"button\" class=\"btn btn-secondary btn-xs add-lesson-btn\" data-module-id=\"${item.id}\">+ Add Lesson</button>
                <ul class=\"lesson-list\" data-module-id=\"${item.id}\"></ul>
            `;
        }

        li.innerHTML = `
            <span class=\"item-title\">${item.title}</span>
            <div class=\"actions\">
                <button type=\"button\" class=\"move-up\" title=\"Move Up\">&#9650;</button>
                <button type=\"button\" class=\"move-down\" title=\"Move Down\">&#9660;</button>
                <button type=\"button\" class=\"delete-item\" title=\"Delete ${type}\">&times;</button>
            </div>
            ${lessonListHTML}
        `;
        return li;
    }

    // Function to handle moving items (Modules, Lessons, Blocks)
    async function moveItem(itemType, itemId, direction) {
        const itemElement = document.querySelector(`[data-${itemType === \"block\" ? \"block-id\" : \"id\"}=\"${itemId}\"]`);
        if (!itemElement) return;

        const parentList = itemElement.parentNode;
        const sibling = direction === "up" ? itemElement.previousElementSibling : itemElement.nextElementSibling;

        if (!sibling) return; // Already at top/bottom

        try {
            // API call to update order on the backend
            await apiRequest(`/editor/${itemType}/${itemId}/move`, "POST", { direction });

            // Update DOM order
            if (direction === "up") {
                parentList.insertBefore(itemElement, sibling);
            } else {
                parentList.insertBefore(sibling, itemElement);
            }
            // Optionally update data-order attributes if needed, though backend is source of truth
        } catch (error) {
            alert(`Failed to move ${itemType}.`);
        }
    }

    // --- Initial Load --- //
    // Load Course Settings view by default
    const initialItem = structurePanel?.querySelector("li.active");
    if (initialItem) {
        loadEditorContent(initialItem.dataset.type, initialItem.dataset.id);
    } else {
        // Fallback if no active item found (shouldn't happen with default HTML)
        loadEditorContent("course", courseId);
    }

});

