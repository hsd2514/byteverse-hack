from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional

from app.models.schemas import (
    LessonResponse, 
    LessonRequest, 
    LessonListResponse,
    LessonExercise,
    LessonTopicResponse
)
from app.services.lesson_service import LessonService

router = APIRouter(
    prefix="/lessons",
    tags=["lessons"],
    responses={404: {"description": "Not found"}},
)

# Dependency to get the lesson service
def get_lesson_service():
    return LessonService()

@router.get("/", response_model=List[LessonListResponse])
async def get_all_lessons(
    service: LessonService = Depends(get_lesson_service)
):
    """Get all available lessons"""
    return service.get_all_lessons()

@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: str,
    service: LessonService = Depends(get_lesson_service)
):
    """Get detailed information about a specific lesson"""
    lesson = service.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.get("/{lesson_id}/topics", response_model=LessonTopicResponse)
async def get_lesson_topics(
    lesson_id: str,
    topic_type: str = Query("conversation", description="Type of topics to retrieve: conversation, cue_card, or discussion"),
    service: LessonService = Depends(get_lesson_service)
):
    """Get topics for a lesson based on type"""
    lesson = service.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    topics = []
    if topic_type == "conversation":
        topics = service.get_lesson_topics(lesson_id)
    elif topic_type == "cue_card":
        topics = service.get_cue_card_topics(lesson_id)
    elif topic_type == "discussion":
        topics = service.get_discussion_questions(lesson_id)
    else:
        raise HTTPException(status_code=400, detail="Invalid topic type")
    
    return {"lesson_id": lesson_id, "topic_type": topic_type, "topics": topics}

@router.post("/{lesson_id}/exercises", response_model=List[LessonExercise])
async def get_lesson_exercises(
    lesson_id: str,
    request: LessonRequest,
    service: LessonService = Depends(get_lesson_service)
):
    """Generate or retrieve exercises for a specific lesson"""
    lesson = service.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    exercises = service.generate_exercises(
        lesson_id, 
        difficulty=request.difficulty, 
        focus_areas=request.focus_areas
    )
    
    return exercises