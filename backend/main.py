from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI-Powered Spoken English App", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with actual frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routes
from app.api.transcription import router as transcription_router
from app.api.conversation import router as conversation_router
from app.api.grammar import router as grammar_router
from app.api.practice import router as practice_router
from app.api.reports import router as reports_router
from app.api.auth import router as auth_router
# from app.api.lesson import router as lesson_router
# from app.api.user import router as user_router

app.include_router(transcription_router)
app.include_router(conversation_router)
app.include_router(grammar_router)
app.include_router(practice_router)
app.include_router(reports_router)
app.include_router(auth_router) # Register the auth router
# app.include_router(lesson_router)
# app.include_router(user_router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the AI-Powered Spoken English App API",
        "modules": [
            "Introduction & Interview Module",
            "Long Turn (Cue Card) Module",
            "Discussion Module",
            "Pronunciation Drills Module", 
            "Grammar & Punctuation Challenges Module",
            "AI-Generated Feedback & Report Module"
        ],
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)