from fastapi import APIRouter, HTTPException
from ..models.schemas import FeedbackSummaryRequest, FeedbackSummaryResponse, ProgressStatsRequest, ProgressStatsResponse
from ..services.gemini_service import generate_comprehensive_report, generate_progress_trends
from typing import Dict, Any, List, Optional

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/session-summary", response_model=Dict[str, Any])
async def get_session_report(request: FeedbackSummaryRequest):
    """
    Generate a comprehensive report on a completed practice session.
    Returns detailed feedback and analytics on all aspects of performance.
    """
    try:
        # In a real implementation, this would fetch the session data from the database
        # For now, we'll use mock data for demonstration
        
        # Mock session data
        session_data = {
            "practice_type": "cue_card",
            "transcript": "Yesterday I visit my grandmother house. She was very happy to see me. We talked about many things and eat dinner together. She tell me stories about when she was young.",
            "audio_duration_seconds": 45,
            "grammar_corrections": [
                {"original": "I visit", "suggestion": "I visited", "type": "grammar"},
                {"original": "grandmother house", "suggestion": "grandmother's house", "type": "grammar"},
                {"original": "eat", "suggestion": "ate", "type": "grammar"},
                {"original": "She tell", "suggestion": "She told", "type": "grammar"}
            ],
            "pronunciation_scores": [
                {"text": "Yesterday", "confidence": 0.92},
                {"text": "I visit", "confidence": 0.85},
                {"text": "my grandmother house", "confidence": 0.78},
                {"text": "She was very happy", "confidence": 0.88},
                {"text": "to see me", "confidence": 0.91},
                {"text": "We talked about many things", "confidence": 0.86},
                {"text": "and eat dinner together", "confidence": 0.82},
                {"text": "She tell me stories", "confidence": 0.79},
                {"text": "about when she was young", "confidence": 0.84}
            ]
        }
        
        report = await generate_comprehensive_report(
            user_id=request.user_id,
            session_id=request.session_id,
            session_data=session_data
        )
        
        return {"report": report, "success": True}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate session report: {str(e)}")

@router.post("/progress", response_model=Dict[str, Any])
async def get_progress_stats(request: ProgressStatsRequest):
    """
    Generate progress statistics and trends over time.
    Returns analytics on improvement across different skill areas.
    """
    try:
        # In a real implementation, this would fetch session history from the database
        # For now, we'll use mock data for demonstration
        
        # Mock session history data
        session_history = [
            {
                "date": "2025-04-10",
                "practice_type": "introduction",
                "scores": {
                    "grammar": 7.2,
                    "pronunciation": 6.8,
                    "fluency": 6.5,
                    "vocabulary": 7.0
                }
            },
            {
                "date": "2025-04-11",
                "practice_type": "cue_card",
                "scores": {
                    "grammar": 7.5,
                    "pronunciation": 7.0,
                    "fluency": 6.8,
                    "vocabulary": 7.2
                }
            },
            {
                "date": "2025-04-12",
                "practice_type": "discussion",
                "scores": {
                    "grammar": 7.8,
                    "pronunciation": 7.3,
                    "fluency": 7.0,
                    "vocabulary": 7.5
                }
            }
        ]
        
        trends = await generate_progress_trends(
            user_id=request.user_id,
            session_history=session_history,
            time_period=request.time_period
        )
        
        return {"trends": trends, "success": True}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate progress statistics: {str(e)}")

@router.get("/user-stats/{user_id}", response_model=Dict[str, Any])
async def get_user_statistics(user_id: str):
    """
    Get overall statistics for a user across all practice types.
    """
    try:
        # In a real implementation, this would calculate statistics from the database
        # For now, we'll return mock statistics
        
        return {
            "total_sessions": 15,
            "total_practice_time_minutes": 180,
            "practice_distribution": {
                "introduction": 3,
                "cue_card": 5,
                "discussion": 4,
                "pronunciation": 2,
                "grammar": 1
            },
            "average_scores": {
                "grammar": 7.8,
                "pronunciation": 7.2,
                "fluency": 6.9,
                "vocabulary": 7.5,
                "coherence": 7.3,
                "overall": 7.3
            },
            "improvement_areas": [
                "Past tense verb forms",
                "Th sound pronunciation",
                "Sentence stress patterns"
            ],
            "strength_areas": [
                "Vocabulary range",
                "Logical organization",
                "Vowel sounds"
            ],
            "suggested_focus": "Fluency and rhythm",
            "success": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user statistics: {str(e)}")

@router.get("/achievements/{user_id}", response_model=Dict[str, Any])
async def get_user_achievements(user_id: str):
    """
    Get user achievements and milestones.
    """
    try:
        # In a real implementation, this would fetch achievements from the database
        # For now, we'll return mock achievements
        
        return {
            "total_achievements": 5,
            "achievements": [
                {
                    "id": "consecutive_practice",
                    "name": "Consistent Learner",
                    "description": "Practiced for 3 days in a row",
                    "date_earned": "2025-04-10"
                },
                {
                    "id": "pronunciation_master",
                    "name": "Pronunciation Pro",
                    "description": "Achieved 90% accuracy in pronunciation drills",
                    "date_earned": "2025-04-11"
                },
                {
                    "id": "grammar_guru",
                    "name": "Grammar Guru",
                    "description": "Corrected 10 grammar challenges successfully",
                    "date_earned": "2025-04-12"
                },
                {
                    "id": "fluent_speaker",
                    "name": "Fluent Speaker",
                    "description": "Spoke for 2 minutes without significant pauses",
                    "date_earned": "2025-04-12"
                },
                {
                    "id": "vocabulary_builder",
                    "name": "Vocabulary Builder",
                    "description": "Used 50 unique words in discussions",
                    "date_earned": "2025-04-12"
                }
            ],
            "next_achievements": [
                {
                    "id": "debate_master",
                    "name": "Debate Master",
                    "description": "Successfully complete 5 discussion sessions",
                    "progress": "4/5"
                },
                {
                    "id": "tongue_twister",
                    "name": "Tongue Twister Pro",
                    "description": "Master 10 difficult tongue twisters",
                    "progress": "7/10"
                }
            ],
            "success": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user achievements: {str(e)}")