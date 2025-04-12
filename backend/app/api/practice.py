from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    PracticeType, ProficiencyLevel, PracticeSessionRequest,
    PracticeSessionResponse, CueCardRequest, CueCardResponse,
    FeedbackRequest, FeedbackSummaryResponse
)
from ..services.gemini_service import generate_response
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

router = APIRouter(prefix="/practice", tags=["practice"])

@router.post("/session/start", response_model=PracticeSessionResponse)
async def start_practice_session(request: PracticeSessionRequest):
    """
    Start a new practice session of the specified type.
    Returns session details with instructions.
    """
    try:
        # Generate a new session ID
        session_id = str(uuid.uuid4())
        
        # Determine instructions based on practice type
        if request.practice_type == PracticeType.INTRODUCTION:
            prompt = "Please introduce yourself and tell me about your interests."
            instructions = "Speak for about 1-2 minutes about yourself and your interests."
            timer_seconds = 120
            
        elif request.practice_type == PracticeType.CUE_CARD:
            prompt = "Describe a memorable trip you have taken."
            instructions = "You have 1 minute to prepare, then speak for 2 minutes on the topic."
            timer_seconds = 120
            
        elif request.practice_type == PracticeType.DISCUSSION:
            prompt = "Let's discuss the advantages and disadvantages of technology in education."
            instructions = "This is a discussion practice. Respond to questions and express your opinions."
            timer_seconds = None
            
        elif request.practice_type == PracticeType.PRONUNCIATION:
            prompt = "Practice these challenging words and phrases."
            instructions = "Listen carefully to each example and repeat it as accurately as possible."
            timer_seconds = None
            
        elif request.practice_type == PracticeType.GRAMMAR:
            prompt = "Correct the grammar in the following sentences."
            instructions = "Listen to each sentence, identify the error, and repeat the sentence with correct grammar."
            timer_seconds = None
            
        else:
            prompt = "Let's practice your English speaking skills."
            instructions = "Follow the prompts and speak clearly and confidently."
            timer_seconds = None
        
        # In a real implementation, this would be stored in a database
        # For now, we'll just return the session information
        return {
            "session_id": session_id,
            "prompt": prompt,
            "instructions": instructions,
            "timer_seconds": timer_seconds,
            "example_answer": None,
            "success": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start practice session: {str(e)}")

@router.post("/cue-card", response_model=CueCardResponse)
async def get_cue_card(request: CueCardRequest):
    """
    Get a cue card speaking topic based on user level.
    """
    try:
        # In a real implementation, this would fetch from a database
        # For now, we'll generate a simple cue card based on level
        
        if request.difficulty_level == ProficiencyLevel.BEGINNER:
            title = "Describe your favorite hobby"
            prompts = [
                "What is your favorite hobby?",
                "When did you start this hobby?",
                "Why do you enjoy it?",
                "How often do you practice this hobby?"
            ]
            preparation_time = 60
            speaking_time = 90
            
        elif request.difficulty_level == ProficiencyLevel.INTERMEDIATE:
            title = "Describe a memorable trip"
            prompts = [
                "Where did you go?",
                "When did you go there?",
                "Who did you go with?",
                "What did you do during the trip?",
                "Why was it memorable for you?"
            ]
            preparation_time = 60
            speaking_time = 120
            
        else:  # ADVANCED
            title = "Discuss the impact of technology on society"
            prompts = [
                "What are some major technological changes in recent years?",
                "How have these technologies affected daily life?",
                "What are the positive and negative aspects of increasing technological dependence?",
                "How do you think technology will change society in the next decade?",
                "Should there be more regulation of technology? Why or why not?"
            ]
            preparation_time = 60
            speaking_time = 180
        
        cue_card = {
            "id": str(uuid.uuid4()),
            "title": title,
            "prompts": prompts,
            "preparation_time_seconds": preparation_time,
            "speaking_time_seconds": speaking_time
        }
        
        # Generate an example answer (in a real app, this could be fetched from a database)
        example_answer = "In a real implementation, this would provide a sample answer for reference."
        
        return {
            "cue_card": cue_card,
            "example_answer": example_answer,
            "success": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate cue card: {str(e)}")

@router.post("/session/feedback", response_model=FeedbackSummaryResponse)
async def get_session_feedback(request: FeedbackRequest):
    """
    Get AI-generated feedback on a practice session.
    """
    try:
        # In a real implementation, this would analyze the session data
        # For demonstration, we'll return mock feedback
        
        return {
            "grammar_score": 8.5,
            "pronunciation_score": 7.8,
            "fluency_score": 7.2,
            "vocabulary_score": 8.0,
            "strengths": [
                "Good use of transition words",
                "Varied sentence structure",
                "Appropriate vocabulary for the topic"
            ],
            "areas_to_improve": [
                "Occasional issues with past tense forms",
                "Some pronunciation difficulties with 'th' sounds",
                "Hesitations in longer sentences"
            ],
            "suggested_exercises": [
                "Practice past tense verbs in context",
                "Focused pronunciation exercises on 'th' sounds",
                "Fluency drills with longer sentences"
            ],
            "progress_percentage": 15,  # Improvement percentage
            "success": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate feedback: {str(e)}")

@router.post("/discussion/questions", response_model=Dict[str, Any])
async def get_discussion_questions(
    topic: str,
    proficiency_level: ProficiencyLevel,
    number_of_questions: int = 3
):
    """
    Get discussion questions related to a specific topic.
    Returns questions with follow-ups and relevant vocabulary.
    """
    try:
        from ..services.gemini_service import generate_discussion_questions
        
        questions = await generate_discussion_questions(
            topic=topic,
            proficiency_level=proficiency_level,
            number_of_questions=number_of_questions
        )
        
        return {"questions": questions, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate discussion questions: {str(e)}")

@router.post("/discussion/evaluate", response_model=Dict[str, Any])
async def evaluate_discussion(
    question: str,
    user_response: str,
    proficiency_level: ProficiencyLevel
):
    """
    Evaluate user's response to a discussion question.
    Returns detailed feedback with scores and suggestions.
    """
    try:
        from ..services.gemini_service import evaluate_discussion_response
        
        evaluation = await evaluate_discussion_response(
            question=question,
            user_response=user_response,
            proficiency_level=proficiency_level
        )
        
        return {"evaluation": evaluation, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate response: {str(e)}")

@router.post("/pronunciation/drills", response_model=Dict[str, Any])
async def get_pronunciation_drills(
    proficiency_level: ProficiencyLevel,
    focus_phonemes: Optional[List[str]] = None
):
    """
    Get pronunciation drill exercises based on user's level and focus areas.
    Returns exercises with IPA transcriptions and pronunciation tips.
    """
    try:
        from ..services.gemini_service import generate_pronunciation_drills
        
        drills = await generate_pronunciation_drills(
            proficiency_level=proficiency_level,
            focus_phonemes=focus_phonemes
        )
        
        return {"drills": drills, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate pronunciation drills: {str(e)}")

@router.post("/pronunciation/analyze", response_model=Dict[str, Any])
async def analyze_pronunciation(
    original_text: str,
    user_audio_transcription: str,
    proficiency_level: ProficiencyLevel
):
    """
    Analyze a user's pronunciation attempt against the original text.
    Returns detailed feedback with pronunciation analysis.
    """
    try:
        from ..services.gemini_service import analyze_pronunciation_attempt
        
        analysis = await analyze_pronunciation_attempt(
            original_text=original_text,
            user_audio_transcription=user_audio_transcription,
            proficiency_level=proficiency_level
        )
        
        return {"analysis": analysis, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze pronunciation: {str(e)}")

@router.post("/grammar/challenges", response_model=Dict[str, Any])
async def get_grammar_challenges(
    proficiency_level: ProficiencyLevel,
    focus_area: Optional[str] = None
):
    """
    Get grammar challenge exercises based on user's level and focus areas.
    Returns exercises with incorrect and correct sentences.
    """
    try:
        from ..services.gemini_service import generate_grammar_challenges
        
        challenges = await generate_grammar_challenges(
            proficiency_level=proficiency_level,
            focus_area=focus_area
        )
        
        return {"challenges": challenges, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate grammar challenges: {str(e)}")

@router.post("/grammar/evaluate", response_model=Dict[str, Any])
async def evaluate_grammar(
    incorrect_sentence: str,
    expected_correction: str,
    user_correction: str
):
    """
    Evaluate a user's grammar correction attempt.
    Returns detailed feedback on the correction accuracy.
    """
    try:
        from ..services.gemini_service import evaluate_grammar_correction
        
        evaluation = await evaluate_grammar_correction(
            incorrect_sentence=incorrect_sentence,
            expected_correction=expected_correction,
            user_correction=user_correction
        )
        
        return {"evaluation": evaluation, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate grammar correction: {str(e)}")