# Mini-Course Creator Wireframes

This document describes the wireframes for the Mini-Course Creator tool, outlining the layout, components, and flow for key screens. The color scheme will primarily use blue for structural elements and navigation, with orange accents for buttons and interactive elements.

## 1. Login/Registration Page

*   **Layout:** Centered form on a simple background.
*   **Components:**
    *   App Logo/Title ("Mini-Course Creator")
    *   Tabs/Links for "Login" and "Register"
    *   **Login Form:** Email Input, Password Input, "Login" Button (Orange), Forgot Password Link.
    *   **Register Form:** Name Input, Email Input, Password Input, Confirm Password Input, "Register" Button (Orange).
*   **Color Scheme:** Blue background elements, orange buttons.

## 2. Dashboard Page

*   **Layout:** Top navigation bar, main content area displaying a list of courses.
*   **Components:**
    *   **Navigation Bar (Blue):** App Logo, "My Courses" Title, "Create New Course" Button (Orange), User Profile/Logout Link.
    *   **Main Area:**
        *   Heading: "Your Mini-Courses"
        *   List of existing courses:
            *   Each course displayed as a card with Title, Description Snippet, Edit Button, Share Button, Delete Button.
        *   If no courses exist, display a message: "You haven't created any courses yet. Click 'Create New Course' to start!"
*   **Color Scheme:** Blue navigation, white/light grey content area, orange buttons.

## 3. Course Editor View

*   **Layout:** Top navigation bar, left-side navigation/structure panel, main content editing area on the right.
*   **Components:**
    *   **Navigation Bar (Blue):** App Logo, Course Title (editable), "Save" Button, "Preview" Button (Orange), "Share" Button, User Profile/Logout Link.
    *   **Left Panel (Course Structure):**
        *   Heading: "Course Structure"
        *   "Add Module" Button.
        *   List of Modules:
            *   Each module name displayed.
            *   Up/Down arrows for reordering modules.
            *   "Add Lesson" button within each module.
            *   List of Lessons within each module:
                *   Lesson title displayed.
                *   Up/Down arrows for reordering lessons within the module.
                *   Clicking a module/lesson loads its content in the right panel.
    *   **Right Panel (Content Editor):** This area changes based on what's selected in the left panel.
        *   **If Course Root Selected (Initial State):**
            *   **Course Title:** Input field.
            *   **Course Description:** Text area.
            *   **Learning Outcome:** Text area (Mandatory). Tooltip icon with Best Practice #1 info.
            *   **Target Audience:** Text area. Tooltip icon with Best Practice #2 info.
        *   **If Introduction Section Selected:**
            *   Heading: "Introduction"
            *   Rich Text Editor for content. Tooltip icon with Best Practice #7 info.
        *   **If Module Selected:**
            *   **Module Title:** Input field.
        *   **If Lesson Selected:**
            *   **Lesson Title:** Input field.
            *   **Content Blocks Area:**
                *   "Add Content Block" dropdown/buttons (Text, Image, Video, Quiz, Action Step).
                *   Existing content blocks displayed sequentially:
                    *   **Text Block:** Rich Text Editor (Basic: Bold, List). Tooltip icon with Best Practice #3 info.
                    *   **Image Block:** Upload button or URL input field. Tooltip icon with Best Practice #6 info.
                    *   **Video Block:** Embed URL input (YouTube/Vimeo). Tooltip icon with Best Practice #6 info (suggest <5 mins).
                    *   **Quiz Block:** Question Input, Options (Multiple Choice/True/False setup), Correct Answer selection. Tooltip icon with Best Practice #5 info.
                    *   **Action Step Block:** Rich Text Editor for instructions/links. Tooltip icon with Best Practice #4 info.
                *   Each block has delete/edit options.
        *   **If Conclusion Section Selected:**
            *   Heading: "Conclusion"
            *   Rich Text Editor for content. Tooltip icon with Best Practice #8 info.
*   **Color Scheme:** Blue navigation/structure panel, white/light grey editing area, orange buttons/accents, subtle tooltips.

## 4. Course Preview/View Page (Shared Link)

*   **Layout:** Simple, clean layout focused on content consumption. Responsive design for mobile.
*   **Components:**
    *   Course Title
    *   Course Description
    *   Left Sidebar (or Accordion on Mobile): Navigation through Modules and Lessons.
    *   Main Content Area: Displays the content of the selected lesson (Text, Images, Embedded Videos, Quizzes).
    *   Navigation Buttons: "Previous Lesson", "Next Lesson".
*   **Color Scheme:** Clean, readable theme, possibly using the blue/orange sparingly for headers or navigation highlights.


