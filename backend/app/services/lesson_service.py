from typing import List, Optional, Dict, Any
import json
from pathlib import Path

# In a production environment, this would likely be stored in a database
# For now, we'll use a hardcoded set of lessons

class LessonService:
    def __init__(self):
        self.lessons = [
            {
                "id": "travel-conversations",
                "title": "Travel Conversations",
                "level": "Intermediate",
                "description": "Practice vocabulary and phrases for navigating airports, hotels, and tourist sites.",
                "topics": ["Airport Check-in", "Hotel Reservation", "Asking for Directions"],
                "cue_card_topics": [
                    "Describe a memorable journey you've taken",
                    "Talk about your favorite vacation destination",
                    "Describe an ideal travel companion"
                ],
                "discussion_questions": [
                    "What are the advantages and disadvantages of traveling alone?",
                    "How has technology changed the way we travel?",
                    "What are some cultural norms travelers should be aware of?"
                ]
            },
            {
                "id": "food-ordering",
                "title": "Ordering Food",
                "level": "Beginner",
                "description": "Learn how to order food at restaurants, ask about ingredients, and express preferences.",
                "topics": ["Restaurant Vocabulary", "Dietary Restrictions", "Making Reservations"],
                "cue_card_topics": [
                    "Describe your favorite dish and how it's prepared",
                    "Talk about a memorable dining experience",
                    "Describe the food from your hometown or country"
                ],
                "discussion_questions": [
                    "How do eating habits differ across cultures?",
                    "What factors influence your choice of restaurant?",
                    "How important is food in understanding a new culture?"
                ]
            },
            {
                "id": "job-interviews",
                "title": "Job Interviews",
                "level": "Advanced",
                "description": "Master vocabulary and techniques for successful job interviews in English.",
                "topics": ["Common Interview Questions", "Discussing Experience", "Salary Negotiation"],
                "cue_card_topics": [
                    "Describe your ideal workplace",
                    "Talk about a challenge you overcame at work",
                    "Describe your career goals for the next five years"
                ],
                "discussion_questions": [
                    "How has the job market changed in recent years?",
                    "What skills do you think will be most valuable in the future?",
                    "How do cultural differences impact workplace communication?"
                ]
            },
            {
                "id": "weather-smalltalk",
                "title": "Weather Small Talk",
                "level": "Beginner",
                "description": "Learn common expressions and vocabulary for discussing weather in casual conversations.",
                "topics": ["Seasons", "Weather Forecasts", "Climate Change"],
                "cue_card_topics": [
                    "Describe the weather in your hometown",
                    "Talk about your favorite season and why you like it",
                    "Describe an extreme weather event you experienced"
                ],
                "discussion_questions": [
                    "How does weather affect people's mood and behavior?",
                    "How has climate change affected your region?",
                    "What are some cultural differences in how people talk about weather?"
                ]
            }
        ]

    def get_all_lessons(self) -> List[Dict[str, Any]]:
        """Return all available lessons with basic information"""
        return [
            {
                "id": lesson["id"],
                "title": lesson["title"],
                "level": lesson["level"],
                "description": lesson["description"]
            }
            for lesson in self.lessons
        ]

    def get_lesson_by_id(self, lesson_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific lesson"""
        for lesson in self.lessons:
            if lesson["id"] == lesson_id:
                return lesson
        return None

    def get_lesson_topics(self, lesson_id: str) -> List[str]:
        """Get conversation topics for a specific lesson"""
        lesson = self.get_lesson_by_id(lesson_id)
        if lesson:
            return lesson.get("topics", [])
        return []

    def get_cue_card_topics(self, lesson_id: str) -> List[str]:
        """Get cue card topics for a specific lesson"""
        lesson = self.get_lesson_by_id(lesson_id)
        if lesson:
            return lesson.get("cue_card_topics", [])
        return []

    def get_discussion_questions(self, lesson_id: str) -> List[str]:
        """Get discussion questions for a specific lesson"""
        lesson = self.get_lesson_by_id(lesson_id)
        if lesson:
            return lesson.get("discussion_questions", [])
        return []

    def generate_exercises(self, lesson_id: str, difficulty: str = "intermediate", 
                          focus_areas: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Generate practice exercises for a lesson based on difficulty and focus areas"""
        # In a production app, this would dynamically generate or fetch exercises
        # For now, returning mock data based on the lesson
        
        exercises = []
        lesson = self.get_lesson_by_id(lesson_id)
        
        if not lesson:
            return exercises
            
        # Basic vocabulary exercise
        exercises.append({
            "type": "vocabulary",
            "instruction": f"Match the {lesson['title']} vocabulary with their definitions",
            "content": "Match the words to their definitions",
            "options": ["A. Definition 1", "B. Definition 2", "C. Definition 3"],
            "answer": "B. Definition 2"
        })
        
        # Grammar exercise
        exercises.append({
            "type": "grammar",
            "instruction": "Complete the sentences with the correct verb form",
            "content": "If I _____ (have) more time, I would learn another language.",
            "answer": "had"
        })
        
        # Conversation practice
        exercises.append({
            "type": "conversation",
            "instruction": "Practice this dialogue with the virtual tutor",
            "content": f"A typical conversation about {lesson['title']}",
            "options": None,
            "answer": None
        })
        
        return exercises