# LinguaLearn: AI-Powered Spoken English Practice App

![LinguaLearn Logo]

## Overview

LinguaLearn is an interactive web application designed to help users improve their spoken English skills through various practice modules, leveraging AI for real-time feedback and analysis. The application focuses on simulating speaking exam scenarios (like IELTS/TOEFL) and providing detailed performance reports to accelerate language learning.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Development Workflow](#development-workflow)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

### Practice Modules (`PracticePage.jsx`)
* **Introduction & Interview (Intro Tab)**
  * Respond to general questions about yourself
  * Practice basic conversational skills
  * Receive feedback on grammar and fluency

* **Long Turn / Cue Card (Cue Card Tab)**
  * Speak for 1-2 minutes on a given topic
  * Timed preparation and response periods
  * Focused on extended speaking practice

* **Discussion (Discussion Tab)**
  * Engage in deeper conversations on abstract topics
  * Practice advanced speaking skills and critical thinking
  * AI-powered conversational partner

* **Pronunciation Drills (Pronunciation Tab)**
  * Focus on specific sounds and pronunciation patterns
  * Detailed phonetic feedback
  * Visual pronunciation guides

* **Grammar Challenges (Grammar Tab)**
  * Identify and correct grammar mistakes
  * Real-time grammar checking
  * Targeted practice on problem areas

### AI-Powered Feedback System

* **Speech Recognition & Transcription**
  * Real-time voice to text conversion
  * Support for various accents
  * High accuracy transcription via Whisper API

* **Grammar Analysis**
  * Automatic error detection and correction
  * Explanation of grammar rules
  * Statistical analysis of common mistakes

* **Pronunciation Assessment**
  * Detailed phonetic analysis
  * Word-level pronunciation scoring
  * Intonation and stress pattern evaluation

* **Performance Analytics**
  * Comprehensive scoring across multiple dimensions
  * Progress tracking over time
  * Personalized improvement recommendations

* **Visual Feedback**
  * Error highlighting directly on transcripts
  * Interactive charts and metrics
  * Visual progress indicators

### User Experience Features

* **Personalized User Profiles**
  * Custom learning goals and preferences
  * Progress statistics and achievements
  * Learning history and session records

* **Theme Customization**
  * Light and dark modes
  * Accessibility features
  * Responsive design for all devices

* **Topic Selection**
  * Wide range of practice topics
  * Difficulty levels from beginner to advanced
  * Special topic sets for specific exams (IELTS, TOEFL)

## System Architecture

LinguaLearn follows a modern client-server architecture with a React frontend and FastAPI backend. For a detailed overview of the system architecture and data flow, please refer to our [Architecture Document](ARCHITECTURE.md).

![System Architecture Flow Diagram](flow.png)

## Tech Stack

### Frontend
* **Framework**: React 18.x
* **Build Tool**: Vite
* **CSS Framework**: Tailwind CSS with DaisyUI components
* **State Management**: React Hooks
* **Charting**: Chart.js with React wrappers
* **Audio Processing**: Web Audio API

### Backend
* **Framework**: FastAPI (Python 3.11+)
* **API Documentation**: Swagger UI / ReDoc
* **Speech Recognition**: OpenAI 
* **Language Models**: Google Gemini API
* **Audio Processing**: FFmpeg


## Project Structure

```
/backend
  /app
    /api      # API endpoints (FastAPI routers)
      /routes
      __init__.py
      auth.py
      conversation.py
      grammar.py
      lesson.py
      practice.py
      reports.py  
      transcription.py
    /models   # Pydantic schemas
      __init__.py
      schemas.py
    /services # Business logic, AI interactions
      __init__.py
      gemini_service.py
      grammar_service.py
      lesson_service.py
      whisper_service.py
    /utils    # Utility functions
      __init__.py
    /audio_uploads  # Temporary storage for uploaded audio
  /audio_storage    # Persistent audio storage
  /logs             # Application logs
  /temp_audio       # Temporary audio processing
  /tools            # FFmpeg binaries and tools
  main.py           # FastAPI app entry point
  requirements.txt  # Python dependencies
  .env              # Environment variables

/frontend
  /public           # Static assets
  /src
    /assets         # Images and other assets
    /components     # Reusable React components
      ChatInterface.jsx
      Feedback.jsx
      GrammarFeedback.jsx
      Login.jsx
      Navbar.jsx
      PronunciationFeedback.jsx
      QAAvatar.jsx
      Register.jsx
      TopicSelector.jsx
      VoiceInput.jsx
    /Pages          # Page-level components
      PracticePage.jsx
    /services       # Frontend services and API clients
    App.css         # Application styles
    App.jsx         # Main application component
    index.css       # Global styles
    main.jsx        # React entry point
  index.html        # HTML template
  package.json      # NPM dependencies and scripts
  vite.config.js    # Vite configuration
  tailwind.config.js # Tailwind CSS configuration
  postcss.config.js # PostCSS configuration
  eslint.config.js  # ESLint configuration

README.md           # Project documentation
ARCHITECTURE.md     # Architecture documentation
.gitignore          # Git ignore rules
```

## Setup Instructions

### Prerequisites

* **Node.js**: v16.x or newer
* **npm**: v8.x or newer (or yarn/pnpm)
* **Python**: 3.11 or newer
* **pip**: Latest version
* **FFmpeg**: For audio processing (included in /backend/tools)
* **Git**: For version control

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the `backend` directory with the following variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   AUDIO_UPLOAD_DIR=./audio_uploads
   AUDIO_STORAGE_DIR=./audio_storage
   TEMP_AUDIO_DIR=./temp_audio
   LOG_LEVEL=INFO
   ENVIRONMENT=development
   ```

5. Run the backend server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`, with documentation at `/docs` or `/redoc`.

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables by creating a `.env` file:
   ```
   VITE_API_URL=http://localhost:8000
   VITE_APP_ENV=development
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173` (or another port specified by Vite).

## Usage Guide

1. **Getting Started**
   * Ensure both backend and frontend servers are running
   * Open your web browser and navigate to `http://localhost:5173`
   * Register a new account or log in with existing credentials

2. **Practice Modules**
   * From the dashboard, select your desired practice module
   * Follow the on-screen instructions for each exercise
   * Record your spoken responses when prompted
   * Review feedback and suggested improvements

3. **Tracking Progress**
   * Visit the Progress page to see your improvement over time
   * Check achievements to celebrate milestones
   * Review past practice sessions and scores

4. **Customizing Experience**
   * Update your profile with learning goals
   * Select topics that interest you
   * Adjust difficulty levels as you improve

5. **Advanced Features**
   * Download your practice audio for offline review
   * Schedule regular practice sessions
   * Generate comprehensive progress reports

## API Documentation

The backend provides a comprehensive RESTful API with the following key endpoints:

### Authentication

* `POST /auth/register`: Create a new user account
* `POST /auth/login`: Authenticate and receive token
* `GET /auth/user`: Get current user profile

### Practice Sessions

* `POST /practice/session/start`: Initialize a practice session
* `GET /practice/session/{session_id}`: Retrieve session details
* `POST /practice/session/feedback`: Get AI feedback on session performance

### Speaking Practice

* `POST /conversation/interview/questions`: Get interview questions
* `POST /practice/cue-card`: Get a cue card topic
* `POST /practice/discussion/questions`: Get discussion questions
* `POST /practice/discussion/evaluate`: Evaluate a discussion response

### Skills Assessment

* `POST /practice/grammar/challenges`: Get grammar exercises
* `POST /grammar/correct`: Check grammar in provided text
* `POST /pronunciation/analyze`: Analyze pronunciation based on audio

### Speech Processing

* `POST /transcription/`: Convert audio to text transcript
* `POST /transcription/with-feedback`: Get transcript with analysis

### User Data

* `GET /reports/session-summary/{session_id}`: Get detailed session report
* `GET /reports/progress/{user_id}`: Get user progress statistics
* `GET /reports/achievements/{user_id}`: Retrieve user achievements

For complete API documentation with request/response schemas, visit the running application at `/docs` endpoint.

## Development Workflow

1. **Branch Management**
   * `main`: Production-ready code
   * `develop`: Integration branch
   * Feature branches: `feature/feature-name`

2. **Code Style**
   * Frontend: ESLint and Prettier
   * Backend: Black and isort

3. **Testing**
   * Frontend: Jest and React Testing Library
   * Backend: Pytest

4. **Pull Requests**
   * Create PR against `develop` branch
   * Require code review
   * Pass all automated tests

## Future Roadmap

- [ ] Mobile application version
- [ ] Group practice sessions
- [ ] AI-powered speaking partners with custom personalities
- [ ] Expanded language support beyond English
- [ ] Curriculum integration for educational institutions
- [ ] Offline mode functionality

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

* [OpenAI](https://openai.com/) for Whisper API
* [Google](https://ai.google.dev/) for Gemini API
* [FastAPI](https://fastapi.tiangolo.com/)
* [React](https://reactjs.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [DaisyUI](https://daisyui.com/)
* [FFmpeg](https://ffmpeg.org/)


