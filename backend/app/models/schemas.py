from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from enum import Enum


class PracticeType(str, Enum):
    """Types of practice modules available in the system"""
    INTRODUCTION = "introduction"
    CUE_CARD = "cue_card"
    DISCUSSION = "discussion"
    PRONUNCIATION = "pronunciation"
    GRAMMAR = "grammar"
    REPORT = "report"


class ProficiencyLevel(str, Enum):
    """User proficiency levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class PronunciationScore(BaseModel):
    """Pronunciation score for a segment of text"""
    text: str
    confidence: float
    start: float
    end: float


class WordPronunciationDetail(BaseModel):
    """Detailed pronunciation analysis for a single word"""
    word: str
    score: float
    confidence: float
    suggestion: Optional[str] = None
    phonemes: Optional[List[Dict[str, Any]]] = None


class TranscriptionResponse(BaseModel):
    """Response from the speech-to-text service"""
    text: str
    pronunciation_analysis: Dict[str, Any] # Added - To hold Gemini's text-based analysis
    success: bool
    error: Optional[str] = None


class GrammarCorrectionRequest(BaseModel):
    """Request for grammar correction"""
    text: str
    strict_mode: bool = True  # Toggle for strict vs. lenient correction


class GrammarCorrection(BaseModel):
    """A single grammar correction"""
    original: str
    suggestion: str
    start: int
    end: int
    type: str = "grammar"  # grammar, spelling, punctuation, style
    explanation: Optional[str] = None


class GrammarCorrectionResponse(BaseModel):
    """Response from grammar correction service"""
    corrected_text: str
    corrections: List[GrammarCorrection]
    success: bool
    error: Optional[str] = None


class ConversationMessage(BaseModel):
    """Message in a conversation"""
    role: str  # "user" or "assistant"
    content: str


class ConversationRequest(BaseModel):
    """Request for AI conversation"""
    messages: List[ConversationMessage]
    topic: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    difficulty_level: Optional[ProficiencyLevel] = None
    practice_type: Optional[PracticeType] = None


class ConversationResponse(BaseModel):
    """Response from AI conversation service"""
    reply: str
    success: bool
    error: Optional[str] = None


class LessonRequest(BaseModel):
    """Request for lesson content"""
    user_id: str
    difficulty: ProficiencyLevel = ProficiencyLevel.INTERMEDIATE
    focus_areas: Optional[List[str]] = None


class LessonExercise(BaseModel):
    """An exercise within a lesson"""
    type: str  # "grammar", "vocabulary", "pronunciation", etc.
    instruction: str
    content: str
    options: Optional[List[str]] = None
    answer: Optional[str] = None


class LessonResponse(BaseModel):
    """Full lesson details"""
    id: str
    title: str
    level: ProficiencyLevel
    description: str
    topics: List[str]
    cue_card_topics: List[str]
    discussion_questions: List[str]
    exercises: Optional[List[LessonExercise]] = None


class LessonListResponse(BaseModel):
    """Summary of lesson for listings"""
    id: str
    title: str
    level: ProficiencyLevel
    description: str


class LessonTopicResponse(BaseModel):
    """Topics associated with a lesson"""
    lesson_id: str
    topic_type: str
    topics: List[str]


# ---- New models for the enhanced language learning modules ----

class UserProfile(BaseModel):
    """User profile with preferences and learning history"""
    user_id: str
    username: str
    email: Optional[str] = None
    native_language: str
    learning_language: str
    proficiency_level: ProficiencyLevel
    daily_goal_minutes: int = 15
    created_at: datetime
    last_login: datetime


class SessionFeedback(BaseModel):
    """Feedback on a practice session"""
    grammar_score: float
    pronunciation_score: float
    fluency_score: float
    vocabulary_score: Optional[float] = None
    coherence_score: Optional[float] = None
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]


class PronunciationAnalysis(BaseModel):
    """Pronunciation analysis of a user's speech"""
    overall_score: float
    word_details: List[WordPronunciationDetail]
    common_issues: List[str]
    practice_suggestions: List[str]


class FluentyStat(BaseModel):
    """Statistics related to speech fluency"""
    words_per_minute: float
    pause_count: int
    avg_pause_duration: float
    filler_word_count: int
    common_filler_words: List[str]


class PracticeSession(BaseModel):
    """Record of a practice session"""
    session_id: str
    user_id: str
    practice_type: PracticeType
    topic: Optional[str] = None
    topic_id: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    transcript: Optional[str] = None
    feedback: Optional[SessionFeedback] = None
    pronunciation_analysis: Optional[PronunciationAnalysis] = None
    fluency_stats: Optional[FluentyStat] = None


class PracticeSessionRequest(BaseModel):
    """Request to create or update a practice session"""
    user_id: str
    practice_type: PracticeType
    topic_id: Optional[str] = None
    difficulty_level: Optional[ProficiencyLevel] = None


class PracticeSessionResponse(BaseModel):
    """Response with practice session details"""
    session_id: str
    prompt: str
    instructions: str
    timer_seconds: Optional[int] = None
    example_answer: Optional[str] = None
    success: bool
    error: Optional[str] = None


class TranscriptionRequest(BaseModel):
    """Request for audio transcription with session context"""
    session_id: str
    user_id: str
    practice_type: PracticeType
    # Audio file will be sent as form data


class FeedbackRequest(BaseModel):
    """Request for AI feedback on a practice session"""
    session_id: str
    user_id: str
    practice_type: PracticeType
    transcript: str
    audio_duration_seconds: Optional[int] = None


class FeedbackSummaryRequest(BaseModel):
    """Request for overall session summary"""
    user_id: str
    session_id: str


class FeedbackSummaryResponse(BaseModel):
    """Detailed feedback summary for a session"""
    grammar_score: float
    pronunciation_score: float
    fluency_score: float
    vocabulary_score: Optional[float] = None
    strengths: List[str]
    areas_to_improve: List[str]
    suggested_exercises: List[str]
    performance_trend: Optional[str] = None
    progress_percentage: Optional[float] = None
    success: bool
    error: Optional[str] = None


class ProgressStatsRequest(BaseModel):
    """Request for user progress statistics"""
    user_id: str
    time_period: Optional[str] = "month"  # day, week, month, all


class ProgressStatsResponse(BaseModel):
    """User progress statistics"""
    grammar_accuracy: List[float]
    pronunciation_scores: List[float]
    vocabulary_growth: List[int]
    sessions_completed: List[int]
    practice_distribution: Dict[str, int]
    time_labels: List[str]
    success: bool
    error: Optional[str] = None


class GrammarChallengeRequest(BaseModel):
    """Request for grammar challenge exercises"""
    user_id: str
    difficulty_level: ProficiencyLevel
    focus_area: Optional[str] = None  # tenses, articles, prepositions, etc.


class GrammarChallenge(BaseModel):
    """Grammar challenge exercise"""
    id: str
    incorrect_sentence: str
    correct_sentence: str
    focus_area: str
    explanation: str


class GrammarChallengeResponse(BaseModel):
    """Response with grammar challenges"""
    challenges: List[GrammarChallenge]
    success: bool
    error: Optional[str] = None


class PronunciationDrillRequest(BaseModel):
    """Request for pronunciation drill exercises"""
    user_id: str
    difficulty_level: ProficiencyLevel
    focus_phonemes: Optional[List[str]] = None  # th, r, l, etc.


class PronunciationDrill(BaseModel):
    """Pronunciation drill exercise"""
    id: str
    text: str
    focus_phoneme: Optional[str] = None
    difficulty: str
    type: str  # tongue_twister, minimal_pair, sentence, etc.
    ipa_transcription: Optional[str] = None


class PronunciationDrillResponse(BaseModel):
    """Response with pronunciation drills"""
    drills: List[PronunciationDrill]
    success: bool
    error: Optional[str] = None


class CueCardRequest(BaseModel):
    """Request for cue card topic"""
    user_id: str
    difficulty_level: ProficiencyLevel
    category: Optional[str] = None  # travel, work, education, etc.


class CueCard(BaseModel):
    """Cue card for speaking practice"""
    id: str
    title: str
    prompts: List[str]
    preparation_time_seconds: int = 60
    speaking_time_seconds: int = 120


class CueCardResponse(BaseModel):
    """Response with cue card"""
    cue_card: CueCard
    example_answer: Optional[str] = None
    success: bool
    error: Optional[str] = None


class DiscussionQuestionRequest(BaseModel):
    """Request for discussion questions"""
    user_id: str
    difficulty_level: ProficiencyLevel
    related_to_cue_card: Optional[str] = None  # cue card id
    topic: Optional[str] = None


class DiscussionQuestion(BaseModel):
    """Discussion question for advanced practice"""
    id: str
    question: str
    follow_up_questions: List[str]
    related_vocabulary: Optional[List[str]] = None


class DiscussionQuestionResponse(BaseModel):
    """Response with discussion questions"""
    questions: List[DiscussionQuestion]
    success: bool
    error: Optional[str] = None


class UserPerformanceMetrics(BaseModel):
    """Detailed metrics of user performance"""
    grammar_score: float
    punctuation_score: float
    pronunciation_score: float
    fluency_score: float
    response_time_ms: Optional[int] = None