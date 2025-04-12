# AI-Powered Spoken English Practice App

This application helps users improve their spoken English skills through interactive practice modules and AI-driven feedback.

## Features

*   **Practice Modules:**
    *   Introduction & Interview
    *   Long Turn (Cue Card)
    *   Discussion
    *   Pronunciation Drills
    *   Grammar Challenges
*   **Real-time Feedback:** Transcription, grammar correction, pronunciation analysis.
*   **AI Analysis:** Utilizes AI (like Google Gemini) for comprehensive feedback on grammar, pronunciation, fluency, vocabulary, and coherence.
*   **Progress Tracking:** View performance reports and track improvement over time.
*   **User Profiles:** Manage personal settings and goals.
*   **Topic Selection:** Choose specific topics for practice.

## Tech Stack

*   **Frontend:** React, Vite, Tailwind CSS, DaisyUI
*   **Backend:** Python, FastAPI
*   **AI:** Google Gemini API
*   **Database/Storage:** (Specify if using Appwrite or other)

## Project Structure

```
/backend
  /app
    /api      # API endpoints (FastAPI routers)
    /models   # Pydantic schemas
    /services # Business logic, AI interactions
    /core     # Configuration
  main.py     # FastAPI app entry point
  requirements.txt
  .env        # Environment variables (API keys, etc.)
/frontend
  /src
    /components # Reusable React components
    /Pages      # Page-level components
    App.jsx     # Main application component
    main.jsx    # React entry point
  public/
  index.html
  package.json
  vite.config.js
  tailwind.config.js
README.md
tailwind.config.js # Root Tailwind config for shared settings
.gitignore         # Git ignore rules
```

## Setup

### Prerequisites

*   Node.js and npm/yarn/pnpm
*   Python 3.8+ and pip
*   Git

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Create a `.env` file based on the example or context provided, including your `GEMINI_API_KEY` and any other necessary keys.
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
    # or yarn install or pnpm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    # or yarn dev or pnpm dev
    ```
    The frontend will typically be available at `http://localhost:5173` (or another port specified by Vite).

## Usage

1.  Ensure both the backend and frontend servers are running.
2.  Open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
3.  Register or log in to start practicing.

## API Endpoints (Examples)

*   `POST /conversation/chat`: Handles chat interactions.
*   `POST /grammar/correct`: Checks grammar for provided text.
*   `POST /transcription/`: Transcribes uploaded audio.
*   `POST /pronunciation/analyze`: Analyzes pronunciation based on text and audio.
*   `POST /reports/session-summary`: Generates a detailed session report.

*(Add more details as needed)*
