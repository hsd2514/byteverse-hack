import os
import shutil
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from dotenv import load_dotenv

from ..models.schemas import (
    PracticeType, ProficiencyLevel, PracticeSessionRequest,
    PracticeSessionResponse, CueCardRequest, CueCardResponse,
    FeedbackRequest, FeedbackSummaryResponse, TranscriptionResponse
)
from ..services.gemini_service import generate_response
from ..services.whisper_service import transcribe_audio
import uuid

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.account import Account

# Load environment variables from .env file
load_dotenv()

# Initialize Appwrite client
client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))  # Replace with your Appwrite endpoint
client.set_project(os.getenv('APPWRITE_PROJECT_ID'))  # Replace with your Appwrite project ID
client.set_key(os.getenv('APPWRITE_API_KEY'))  # Replace with your Appwrite API key

db = Databases(client)
account = Account(client)

router = APIRouter(prefix="/practice", tags=["practice"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define upload directory relative to this file's location or use absolute path
UPLOAD_DIR = "temp_audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

@router.post("/session/feedback", response_model=Dict[str, Any])
async def get_session_feedback(request: dict):
    """
    Get AI-generated feedback on a practice session.
    
    Analyzes the user's transcript and provides detailed feedback using Gemini.
    """
    feedback = {} # Initialize feedback dict
    try:
        # Import necessary functions from gemini_service here
        from ..services.gemini_service import (
            analyze_pronunciation,
            analyze_grammar_response,
            evaluate_discussion_response,
            evaluate_cue_card_response,
            evaluate_general_speaking
        )
        
        # Extract information from the request
        practice_type = request.get("practice_type", "general")
        transcript = request.get("text", "")
        question = request.get("question", "")
        # Get proficiency level string and convert to enum
        proficiency_level_str = request.get("proficiency_level", ProficiencyLevel.INTERMEDIATE.value)
        try:
            proficiency_level = ProficiencyLevel(proficiency_level_str)
        except ValueError:
            proficiency_level = ProficiencyLevel.INTERMEDIATE # Default if invalid string
            
        corrections = request.get("corrections", [])
        pronunciation_analysis = request.get("pronunciation_analysis", {})
        
        if not transcript:
            # Return a specific error structure if no transcript
            return {
                "error": "No transcript provided for analysis",
                "success": False,
                "practice_type": practice_type,
                "transcript": transcript,
                "question": question,
                # Include default score/feedback structure even on input error
                "task_completion_score": None, 
                "coherence_score": None,
                "grammar_score": None,
                "vocabulary_score": None, 
                "fluency_score": None,
                "pronunciation_score": None, # Ensure this is included if applicable
                "overall_score": None,
                "band_descriptor": None,
                "strengths": [],
                "areas_to_improve": [],
                "suggested_exercises": [],
                "punctuation_feedback": None,
                "sentence_structure_feedback": None
            }
            
        # Get the appropriate service based on practice type
        # Use the imported functions directly
        if practice_type == "pronunciation":
            feedback = await analyze_pronunciation(transcript, pronunciation_analysis, proficiency_level)
        elif practice_type == "grammar":
            feedback = await analyze_grammar_response(transcript, question, corrections, proficiency_level)
        elif practice_type == "discussion":
            feedback = await evaluate_discussion_response(question, transcript, proficiency_level)
        elif practice_type == "cue_card":
            feedback = await evaluate_cue_card_response(question, transcript, proficiency_level)
        else:
            # General speaking assessment
            feedback = await evaluate_general_speaking(question, transcript, proficiency_level, corrections, pronunciation_analysis)
        
        # Add basic metadata to the response
        feedback["practice_type"] = practice_type
        feedback["transcript"] = transcript
        feedback["question"] = question
        # Success is true if no exception occurred AND the service didn't return an explicit error key
        feedback["success"] = "error" not in feedback 
        
        # Ensure expected fields are present (even if None)
        # Use setdefault which adds the key only if it's missing
        feedback.setdefault("task_completion_score", None)
        feedback.setdefault("coherence_score", None)
        feedback.setdefault("grammar_score", None)
        feedback.setdefault("vocabulary_score", None)
        feedback.setdefault("fluency_score", None)
        feedback.setdefault("pronunciation_score", None) # Ensure this is included
        feedback.setdefault("overall_score", None)
        feedback.setdefault("band_descriptor", None)
        feedback.setdefault("strengths", [])
        feedback.setdefault("areas_to_improve", [])
        feedback.setdefault("suggested_exercises", [])
        feedback.setdefault("punctuation_feedback", None)
        feedback.setdefault("sentence_structure_feedback", None)
        # If the service returned an error (e.g., from fallback), keep it
        feedback.setdefault("error", None) 

        return feedback
        
    except Exception as e:
        logger.error(f"Error in AI feedback generation endpoint: {str(e)}", exc_info=True) 
        # Construct a detailed error response matching the expected structure
        error_message = f"Failed to generate feedback: {str(e)}"
        # Return a structure consistent with successful responses but indicating failure
        return {
            "error": error_message,
            "success": False,
            "practice_type": request.get("practice_type", "unknown"),
            "transcript": request.get("text", ""),
            "question": request.get("question", ""),
            "task_completion_score": None, 
            "coherence_score": None,
            "grammar_score": None, # Use None instead of arbitrary numbers
            "vocabulary_score": None, 
            "fluency_score": None,
            "pronunciation_score": None, # Ensure this is included
            "overall_score": None,
            "band_descriptor": None,
            "strengths": ["Unable to analyze strengths due to technical error."],
            "areas_to_improve": ["Analysis failed. Please try again later."],
            "suggested_exercises": ["Please try again later."],
            "punctuation_feedback": "Punctuation analysis unavailable due to error.", 
            "sentence_structure_feedback": "Sentence structure analysis unavailable due to error." 
        }

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

@router.post("/transcribe", response_model=TranscriptionResponse)
async def handle_transcription(
    audio_file: UploadFile = File(...)
):
    """
    Receives audio file, saves it temporarily, transcribes it, 
    and returns the transcription text and pronunciation analysis.
    """
    file_path = None
    try:
        # Ensure the upload directory exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        # Extract file extension from filename or use .webm as default
        filename = audio_file.filename
        file_extension = os.path.splitext(filename)[1].lower() if filename and "." in filename else ".webm"
        
        # Create a temporary file path with proper extension
        file_path = os.path.join(UPLOAD_DIR, f"{datetime.now().strftime('%Y%m%d%H%M%S')}_recording{file_extension}")
        
        logger.info(f"Saving uploaded audio file to: {file_path} (Content-Type: {audio_file.content_type})")
        
        # Save the uploaded file
        content = await audio_file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)
            
        logger.info(f"Audio file saved successfully. Size: {len(content)} bytes. Starting transcription for {file_path}")

        # Call the transcription service
        result = await transcribe_audio(file_path)
        
        logger.info(f"Transcription result for {file_path}: Success={result.get('success')}")

        if not result or not result.get("success"):
            error_msg = result.get("error", "Transcription failed")
            logger.error(f"Transcription failed for {file_path}: {error_msg}")
            # Return the structure expected by TranscriptionResponse on error
            return TranscriptionResponse(
                text="", 
                pronunciation_analysis={"error": error_msg}, 
                success=False, 
                error=error_msg
            )

        # Return the successful result matching TranscriptionResponse schema
        return TranscriptionResponse(
            text=result.get("text", ""),
            pronunciation_analysis=result.get("pronunciation_analysis", {}),
            success=True,
            error=None
        )

    except Exception as e:
        logger.error(f"Error in /transcribe endpoint: {str(e)}", exc_info=True)
        # Ensure error response matches the schema
        return TranscriptionResponse(
            text="", 
            pronunciation_analysis={"error": f"Server error during transcription: {str(e)}"}, 
            success=False, 
            error=f"Server error during transcription: {str(e)}"
        )
    finally:
        # Clean up the temporary file
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Temporary file deleted: {file_path}")
            except Exception as e:
                logger.error(f"Error deleting temporary file {file_path}: {e}")

@router.post("/auth/register")
async def register_user(email: str, password: str):
    try:
        user = account.create(email=email, password=password)
        return {"success": True, "user": user}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/auth/login")
async def login_user(email: str, password: str):
    try:
        session = account.create_session(email=email, password=password)
        return {"success": True, "session": session}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/feedback")
async def save_feedback(user_id: str, feedback: str):
    try:
        result = db.create_document(
            database_id="YOUR_DATABASE_ID",  # Replace with your database ID
            collection_id="YOUR_COLLECTION_ID",  # Replace with your collection ID
            document_id="unique()",
            data={"user_id": user_id, "feedback": feedback}
        )
        return {"success": True, "document": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/feedback/{user_id}")
async def get_feedback(user_id: str):
    try:
        documents = db.list_documents(
            database_id="YOUR_DATABASE_ID",  # Replace with your database ID
            collection_id="YOUR_COLLECTION_ID",  # Replace with your collection ID
            queries=["user_id=" + user_id]
        )
        return {"success": True, "feedback": documents}
    except Exception as e:
        return {"success": False, "error": str(e)}