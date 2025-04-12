from fastapi import APIRouter, HTTPException, Depends
from ..models.schemas import ConversationRequest, ConversationResponse, ProficiencyLevel, PracticeType
from ..services.gemini_service import generate_response, generate_interview_questions, analyze_interview_response
import uuid
from datetime import datetime
from typing import Optional, Dict, Any

router = APIRouter(prefix="/conversation", tags=["conversation"])

@router.post("/", response_model=ConversationResponse)
async def chat_with_ai(request: ConversationRequest):
    """
    Chat with the AI conversation partner.
    Returns the AI response and logs the conversation.
    """
    try:
        # Generate a session ID if one isn't provided
        session_id = str(uuid.uuid4())
        
        # Generate response using Gemini API
        response_text = await generate_response(request.messages, request.topic)
        
        # Log conversation (in a production app, this would store in the database)
        # Here we'll just print it for demonstration purposes
        user_message = next((msg.content for msg in request.messages if msg.role == "user"), "")
        print(f"[LOG] Session {session_id} - User: {user_message}")
        print(f"[LOG] Session {session_id} - Assistant: {response_text}")
        
        return {
            "reply": response_text,
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversation generation failed: {str(e)}")

@router.post("/rate", response_model=ConversationResponse)
async def rate_conversation(
    user_id: str,
    session_id: str,
    rating: int,
    feedback: Optional[str] = None
):
    """
    Rate a conversation session.
    Stores the rating in the database for future analysis.
    """
    try:
        # In a production app, this would store the rating in the database
        # For now, we'll just print it
        print(f"[LOG] Rating received for session {session_id}: {rating}/5")
        if feedback:
            print(f"[LOG] Feedback: {feedback}")
            
        return {
            "reply": "Thank you for your feedback!",
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save rating: {str(e)}")

@router.post("/interview/questions", response_model=Dict[str, Any])
async def get_interview_questions(
    proficiency_level: ProficiencyLevel,
    number_of_questions: int = 3
):
    """
    Get interview questions for the Introduction module based on user proficiency.
    Returns a set of questions with follow-ups.
    """
    try:
        questions = await generate_interview_questions(proficiency_level, number_of_questions)
        return {"questions": questions, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate interview questions: {str(e)}")

@router.post("/interview/analyze", response_model=Dict[str, Any])
async def analyze_user_response(
    user_response: str,
    proficiency_level: ProficiencyLevel
):
    """
    Analyze a user's response from the interview module.
    Returns detailed feedback on grammar, vocabulary, and fluency.
    """
    try:
        analysis = await analyze_interview_response(user_response, proficiency_level)
        return {"analysis": analysis, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze response: {str(e)}")