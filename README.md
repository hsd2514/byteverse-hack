# AI-Powered Spoken English Practice App

This application helps users improve their spoken English skills through interactive practice modules and AI-driven feedback.

## Features

*   **Practice Modules:**
    *   Introduction & Interview (`PracticePage.jsx` - Intro Tab)
    *   Long Turn / Cue Card (`PracticePage.jsx` - Cue Card Tab)
    *   Discussion (`PracticePage.jsx` - Discussion Tab)
    *   Pronunciation Drills (`PracticePage.jsx` - Pronunciation Tab)
    *   Grammar Challenges (`PracticePage.jsx` - Grammar Tab)
*   **Real-time Feedback:**
    *   Transcription via Voice Input (`VoiceInput.jsx`)
    *   Grammar Correction (`GrammarFeedback.jsx`, `/grammar/correct` endpoint)
    *   Pronunciation Analysis (`PronunciationFeedback.jsx`, `/pronunciation/analyze` endpoint)
    *   Highlighting issues directly on the transcript (`PracticePage.jsx`)
*   **AI Analysis:** Utilizes Google Gemini (`gemini_service.py`) for:
    *   Generating questions (Interview, Discussion)
    *   Evaluating responses (Discussion)
    *   Generating grammar challenges
    *   Comprehensive session reports (`/reports/session-summary`)
*   **Progress Tracking:** View performance reports and track improvement over time (`ProgressPage.jsx`, `/reports/progress` endpoint).
*   **User Profiles:** Manage personal settings, goals, and view stats (`ProfilePage.jsx`).
*   **Topic Selection:** Choose specific topics for practice (`TopicSelector.jsx`, `PracticePage.jsx`).
*   **Achievements:** Track milestones (`/reports/achievements/{user_id}` endpoint).

## Tech Stack

*   **Frontend:** React, Vite, Tailwind CSS, DaisyUI (`package.json`, `tailwind.config.js`)
*   **Backend:** Python, FastAPI (`main.py`, `api/`)
*   **AI:** Google Gemini API (`gemini_service.py`)
*   **Database/Storage:** Appwrite (implied by `.env`)

## Project Structure

```
/backend
  /app
    /api      # API endpoints (FastAPI routers: conversation.py, practice.py, reports.py, etc.)
    /models   # Pydantic schemas (schemas.py)
    /services # Business logic, AI interactions (gemini_service.py, lesson_service.py)
    /core     # Configuration (potentially)
  main.py     # FastAPI app entry point
  requirements.txt # Python dependencies
  .env        # Environment variables (API keys, Appwrite config)
/frontend
  /src
    /components # Reusable React components (VoiceInput.jsx, Navbar.jsx, Feedback.jsx, etc.)
    /Pages      # Page-level components (HomePage.jsx, PracticePage.jsx, ProfilePage.jsx, etc.)
    App.jsx     # Main application component
    main.jsx    # React entry point
    index.css   # Main CSS imports
    App.css     # Custom CSS styles
  public/
  index.html
  package.json
  vite.config.js
  tailwind.config.js # Frontend Tailwind config
  postcss.config.js
  eslint.config.js
README.md          # This file
.gitignore         # Root Git ignore rules
```

## Setup

### Prerequisites

*   Node.js and npm (or yarn/pnpm) (`package.json`)
*   Python 3.8+ and pip (`requirements.txt`)
*   Git

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment (recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Create or verify the `.env` file in the `backend` directory with your `GEMINI_API_KEY` and Appwrite credentials (`.env` example).
5.  Run the backend server:
    ```bash
    uvicorn main:app --reload
    ```
    The API will typically be available at `http://localhost:8000`.

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    The frontend will typically be available at `http://localhost:5173` (or another port specified by Vite).

## Usage

1.  Ensure both the backend and frontend servers are running.
2.  Open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
3.  Register or log in (`Login.jsx`) to start practicing.

## API Endpoints (Examples from Code)

*   `/practice/session/start` (POST): Initialize a practice session.
*   `/conversation/interview/questions` (POST): Get interview questions.
*   `/practice/cue-card` (POST): Get a cue card topic.
*   `/practice/discussion/questions` (POST): Get discussion questions.
*   `/practice/discussion/evaluate` (POST): Evaluate a discussion response.
*   `/practice/grammar/challenges` (POST): Get grammar exercises.
*   `/grammar/correct` (POST): Check grammar in provided text.
*   `/pronunciation/analyze` (POST): Analyze pronunciation based on text and audio transcription.
*   `/transcription/` (POST): Endpoint likely used by `VoiceInput.jsx` to get text from audio.
*   `/reports/session-summary` (POST): Generate a detailed session report.
*   `/reports/progress` (POST): Get user progress statistics over time.
*   `/reports/achievements/{user_id}` (GET): Retrieve user achievements.

*(This list is based on observed code and may not be exhaustive.)*
