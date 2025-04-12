import os
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from ..models.schemas import ConversationMessage, ProficiencyLevel, PracticeType

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

async def generate_response(messages: List[ConversationMessage], topic: Optional[str] = None) -> str:
    """
    Generate a contextual response using the Gemini API
    
    Parameters:
    - messages: List of conversation messages
    - topic: Optional conversation topic to focus on
    
    Returns:
    - Generated response text
    """
    try:
        # Configure the model - using the latest Gemini 1.5 Pro model for improved capabilities
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Format conversation history for the model
        chat_history = []
        for msg in messages:
            role = "user" if msg.role == "user" else "model"
            chat_history.append({"role": role, "parts": [msg.content]})
        
        # Start a chat session
        chat = model.start_chat(history=chat_history)
        
        # Create the prompt with language learning context
        prompt = "You are a helpful language learning assistant. "
        
        if topic:
            prompt += f"The conversation is about: {topic}. "
        
        prompt += """
        Provide clear, natural responses that help the language learner practice.
        Use natural, conversational language appropriate for their level.
        Gently correct any major grammar mistakes in your response by mentioning the correction.
        Ask follow-up questions to keep the conversation going.
        """
        
        # Generate response
        response = chat.send_message(prompt)
        return response.text
        
    except Exception as e:
        # Log error and return friendly message
        print(f"Gemini API Error: {str(e)}")
        return "I'm sorry, I couldn't generate a response. Please try again."

async def generate_interview_questions(proficiency_level: ProficiencyLevel, number_of_questions: int = 3) -> Dict[str, Any]:
    """
    Generate interview questions for the Introduction module based on user proficiency
    
    Parameters:
    - proficiency_level: User's current proficiency level
    - number_of_questions: Number of questions to generate
    
    Returns:
    - Dictionary containing generated questions and follow-ups
    """
    try:
        # Configure the model - using Gemini 1.5 Pro
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Create prompt based on proficiency level
        if proficiency_level == ProficiencyLevel.BEGINNER:
            complexity = "simple, everyday topics like hobbies, family, or daily routines"
        elif proficiency_level == ProficiencyLevel.INTERMEDIATE:
            complexity = "moderate difficulty on topics like work experiences, travel, education, or current events"
        else:  # ADVANCED
            complexity = "complex topics requiring detailed explanations, such as cultural differences, abstract concepts, policy discussions, or technical subjects"
        
        prompt = f"""
        Generate {number_of_questions} interview questions for an English language learner at {proficiency_level} level.
        Questions should be about {complexity}.
        For each question, provide 2 follow-up questions that an interviewer might ask.
        Format the response as a JSON object with this structure:
        {{
            "questions": [
                {{
                    "main_question": "The main question text",
                    "follow_ups": ["Follow-up question 1", "Follow-up question 2"]
                }}
            ]
        }}
        Only return the JSON object, nothing else.
        """
        
        # Generate response
        response = model.generate_content(prompt)
        return response.text
    
    except Exception as e:
        # Log error and return friendly message
        print(f"Gemini API Error: {str(e)}")
        return {"error": "Failed to generate interview questions"}

async def analyze_interview_response(
    user_response: str, 
    proficiency_level: ProficiencyLevel
) -> Dict[str, Any]:
    """
    Analyze user's interview response for feedback
    
    Parameters:
    - user_response: The user's transcribed response
    - proficiency_level: User's current proficiency level
    
    Returns:
    - Dictionary with grammar feedback, pronunciation feedback, and fluency analysis
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        prompt = f"""
        Analyze this English language learner's response at {proficiency_level} level:
        
        "{user_response}"
        
        Provide detailed feedback on:
        1. Grammar issues (identify up to 3 main issues)
        2. Vocabulary usage (appropriate for level, any misused words)
        3. Fluency assessment (natural flow, hesitations, appropriate use of discourse markers)
        4. 2-3 specific suggestions for improvement
        
        Format the response as a JSON object with this structure:
        {{
            "grammar_feedback": {{
                "issues": ["Issue 1", "Issue 2", "Issue 3"],
                "corrections": ["Correction 1", "Correction 2", "Correction 3"]
            }},
            "vocabulary_feedback": {{
                "strengths": ["Strength 1", "Strength 2"],
                "suggestions": ["Suggestion 1", "Suggestion 2"]
            }},
            "fluency_assessment": "Detailed assessment of fluency",
            "improvement_tips": ["Tip 1", "Tip 2", "Tip 3"]
        }}
        Only return the JSON object, nothing else.
        """
        
        response = model.generate_content(prompt)
        return response.text
    
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return {"error": "Failed to analyze response"}

async def generate_discussion_questions(topic: str, proficiency_level: ProficiencyLevel, number_of_questions: int = 3) -> Dict[str, Any]:
    """
    Generate discussion questions related to a specific topic
    
    Parameters:
    - topic: The discussion topic or cue card title
    - proficiency_level: User's current proficiency level
    - number_of_questions: Number of questions to generate
    
    Returns:
    - Dictionary containing generated questions and follow-ups
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Adjust complexity based on proficiency level
        if proficiency_level == ProficiencyLevel.BEGINNER:
            complexity = "simple, with basic vocabulary and direct questions"
        elif proficiency_level == ProficiencyLevel.INTERMEDIATE:
            complexity = "moderate, requiring some analysis and explanation"
        else:  # ADVANCED
            complexity = "sophisticated, requiring critical thinking, hypothetical scenarios, and abstract reasoning"
        
        prompt = f"""
        Generate {number_of_questions} discussion questions related to: "{topic}"
        
        The questions should be {complexity} for an English language learner at {proficiency_level} level.
        
        For each question:
        - Include 2 follow-up questions
        - Add 3-5 relevant vocabulary words or phrases that might be useful in discussing this topic
        
        Format the response as a JSON object with this structure:
        {{
            "questions": [
                {{
                    "main_question": "The main question text",
                    "follow_ups": ["Follow-up question 1", "Follow-up question 2"],
                    "vocabulary": ["word/phrase 1", "word/phrase 2", "word/phrase 3"]
                }}
            ]
        }}
        Only return the JSON object, nothing else.
        """
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return {"error": "Failed to generate discussion questions"}

async def evaluate_discussion_response(
    question: str,
    user_response: str,
    proficiency_level: ProficiencyLevel
) -> Dict[str, Any]:
    """
    Evaluate a user's response in a discussion
    
    Parameters:
    - question: The original discussion question
    - user_response: The user's transcribed response
    - proficiency_level: User's current proficiency level
    
    Returns:
    - Dictionary with detailed evaluation of the response
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        prompt = f"""
        Evaluate this English language learner's response at {proficiency_level} level.
        
        Question: {question}
        
        Response: "{user_response}"
        
        Provide a detailed evaluation focusing on:
        1. Relevance to the question (how well they addressed the topic)
        2. Grammar and language accuracy
        3. Vocabulary usage and range
        4. Logical organization and coherence
        5. Use of examples or supporting details
        
        Format the response as a JSON object with this structure:
        {{
            "relevance_score": 8.5,  # Score out of 10
            "grammar_score": 7.5,    # Score out of 10
            "vocabulary_score": 8.0,  # Score out of 10
            "organization_score": 7.0,  # Score out of 10
            "supporting_details_score": 6.5,  # Score out of 10
            "overall_score": 7.5,  # Overall average
            "strengths": ["Strength 1", "Strength 2"],
            "areas_for_improvement": ["Area 1", "Area 2"],
            "suggested_phrases": ["Better phrase 1", "Better phrase 2"],
            "follow_up_question": "A natural follow-up question to continue the conversation"
        }}
        Only return the JSON object, nothing else.
        """
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return {"error": "Failed to evaluate response"}

async def generate_pronunciation_drills(
    proficiency_level: ProficiencyLevel,
    focus_phonemes: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Generate pronunciation drill exercises with focus on specific phonemes
    
    Parameters:
    - proficiency_level: User's current proficiency level
    - focus_phonemes: Optional list of phonemes to focus on (e.g., 'th', 'r', 'l')
    
    Returns:
    - Dictionary containing pronunciation drills with IPA transcriptions
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        phoneme_focus = ""
        if focus_phonemes:
            phoneme_focus = f"Focus on these specific phonemes: {', '.join(focus_phonemes)}."
        
        # Adjust complexity based on proficiency level
        if proficiency_level == ProficiencyLevel.BEGINNER:
            complexity = "simple, using basic vocabulary and short phrases"
        elif proficiency_level == ProficiencyLevel.INTERMEDIATE:
            complexity = "moderate, using intermediate vocabulary and longer phrases"
        else:  # ADVANCED
            complexity = "challenging, using advanced vocabulary, idioms, and complex sentence structures"
        
        prompt = f"""
        Generate 5 pronunciation drill exercises for an English language learner at {proficiency_level} level.
        The exercises should be {complexity}.
        {phoneme_focus}
        
        Include these types of exercises:
        1. Minimal pairs (words that differ by only one sound)
        2. Tongue twisters
        3. Sentences with challenging sound combinations
        4. Words with difficult stress patterns
        5. Words with silent letters
        
        For each exercise:
        - Provide the text to pronounce
        - Include IPA (International Phonetic Alphabet) transcription
        - Specify which specific sounds are being practiced
        - Add a tip for correct pronunciation
        
        Format the response as a JSON object with this structure:
        {{
            "drills": [
                {{
                    "id": "1",
                    "text": "The text to pronounce",
                    "type": "tongue_twister|minimal_pair|sentence|word",
                    "focus_phoneme": "The specific sound being practiced",
                    "difficulty": "easy|medium|hard",
                    "ipa_transcription": "IPA transcription",
                    "pronunciation_tip": "Tip for correct pronunciation"
                }}
            ]
        }}
        Only return the JSON object, nothing else.
        """
        
        response = model.generate_content(prompt)
        return response.text
    
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return {"error": "Failed to generate pronunciation drills"}

async def analyze_pronunciation_attempt(
    original_text: str, 
    user_audio_transcription: str,
    proficiency_level: ProficiencyLevel
) -> Dict[str, Any]:
    """
    Analyze a user's pronunciation attempt
    
    Parameters:
    - original_text: The text the user was trying to pronounce
    - user_audio_transcription: The transcription of user's pronunciation attempt
    - proficiency_level: User's current proficiency level
    
    Returns:
    - Dictionary with pronunciation analysis
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        prompt = f"""
        Analyze this English language learner's pronunciation attempt at {proficiency_level} level.
        
        Original text: "{original_text}"
        
        User's pronunciation (transcribed): "{user_audio_transcription}"
        
        Provide a detailed analysis focusing on:
        1. Accuracy of pronunciation (how closely the transcription matches the original text)
        2. Specific sounds that may have been mispronounced
        3. Suggestions for improvement
        
        Format the response as a JSON object with this structure:
        {{
            "accuracy_score": 8.5,  # Score out of 10
            "matched_words": ["word1", "word2"],  # Words pronounced correctly
            "mismatched_words": [
                {{
                    "expected": "word3",
                    "transcribed": "word3 (as pronounced)", 
                    "phoneme_issue": "Description of the phoneme issue"
                }}
            ],
            "common_issues": ["Issue 1", "Issue 2"],
            "improvement_tips": ["Tip 1", "Tip 2"]
        }}
        Only return the JSON object, nothing else.
        """
        
        response = model.generate_content(prompt)
        return response.text
    
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return {"error": "Failed to analyze pronunciation attempt"}

async def generate_grammar_challenges(
    proficiency_level: ProficiencyLevel,
    focus_area: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate grammar challenge exercises
    
    Parameters:
    - proficiency_level: User's current proficiency level
    - focus_area: Optional grammar area to focus on (e.g., 'tenses', 'articles', 'prepositions')
    
    Returns:
    - Dictionary containing grammar challenge exercises
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        grammar_focus = ""
        if focus_area:
            grammar_focus = f"Focus on this grammar area: {focus_area}."
        
        # Adjust complexity based on proficiency level
        if proficiency_level == ProficiencyLevel.BEGINNER:
            complexity = "simple, focusing on basic grammar rules"
        elif proficiency_level == ProficiencyLevel.INTERMEDIATE:
            complexity = "moderate, focusing on intermediate grammar concepts"
        else:  # ADVANCED
            complexity = "challenging, focusing on advanced grammar rules and exceptions"
        
        prompt = f"""
        Generate 5 grammar challenge exercises for an English language learner at {proficiency_level} level.
        The exercises should be {complexity}.
        {grammar_focus}
        
        For each exercise:
        - Provide a sentence with a grammar error
        - Provide the corrected version
        - Explain the grammar rule being applied
        - Categorize the type of error (e.g., verb tense, article, preposition)
        
        Format the response as a JSON object with this structure:
        {{
            "challenges": [
                {{
                    "id": "1",
                    "incorrect_sentence": "Sentence with grammar error",
                    "correct_sentence": "Corrected sentence",
                    "focus_area": "verb_tense|articles|prepositions|etc",
                    "explanation": "Explanation of the grammar rule"
                }}
            ]
        }}
        Only return the JSON object, nothing else.
        """
        
        response = model.generate_content(prompt)
        return response.text
    
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return {"error": "Failed to generate grammar challenges"}

async def evaluate_grammar_correction(
    incorrect_sentence: str,
    expected_correction: str,
    user_correction: str
) -> Dict[str, Any]:
    """
    Evaluate a user's grammar correction attempt
    
    Parameters:
    - incorrect_sentence: The original sentence with grammar error
    - expected_correction: The expected correct version
    - user_correction: The user's attempt at correction
    
    Returns:
    - Dictionary with analysis of the correction attempt
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        prompt = f"""
        Evaluate this English language learner's grammar correction attempt.
        
        Original incorrect sentence: "{incorrect_sentence}"
        Expected correction: "{expected_correction}"
        User's correction: "{user_correction}"
        
        Provide an analysis focusing on:
        1. Whether the user identified and fixed the error correctly
        2. Any new errors introduced in the user's correction
        3. Suggestions for improvement
        
        Format the response as a JSON object with this structure:
        {{
            "is_correct": true/false,  # Whether the user's correction matches the expected correction
            "accuracy_score": 8.5,  # Score out of 10
            "error_identified": true/false,  # Whether the user identified the main error
            "explanation": "Explanation of what the user did right/wrong",
            "suggestions": ["Suggestion 1", "Suggestion 2"]
        }}
        Only return the JSON object, nothing else.
        """
        
        response = model.generate_content(prompt)
        return response.text
    
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return {"error": "Failed to evaluate grammar correction"}

async def generate_comprehensive_report(
    user_id: str,
    session_id: str,
    session_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate a comprehensive report on a user's practice session
    
    Parameters:
    - user_id: User identifier
    - session_id: Session identifier
    - session_data: Dictionary containing session data including:
      - practice_type: Type of practice (introduction, cue_card, etc.)
      - transcript: User's full transcript
      - audio_duration_seconds: Duration of the user's speech
      - grammar_corrections: List of grammar corrections
      - pronunciation_scores: List of pronunciation scores
      
    Returns:
    - Dictionary with detailed feedback and analytics
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Extract session details
        practice_type = session_data.get('practice_type', '')
        transcript = session_data.get('transcript', '')
        audio_duration = session_data.get('audio_duration_seconds', 0)
        grammar_corrections = session_data.get('grammar_corrections', [])
        pronunciation_scores = session_data.get('pronunciation_scores', [])
        
        # Create a prompt for comprehensive analysis
        prompt = f"""
        Generate a detailed report on this English language practice session:
        
        Session Type: {practice_type}
        Audio Duration: {audio_duration} seconds
        
        User's Transcript:
        "{transcript}"
        
        Grammar Corrections:
        {grammar_corrections}
        
        Pronunciation Scores:
        {pronunciation_scores}
        
        Analyze and provide comprehensive feedback on:
        1. Grammar accuracy (identify patterns of errors)
        2. Pronunciation quality (strengths and areas for improvement)
        3. Fluency assessment (speech rate, pauses, hesitations)
        4. Vocabulary usage (level appropriateness, variety, collocations)
        5. Coherence and organization (logical flow, use of connectors)
        6. Overall communicative effectiveness
        
        For each area, provide:
        - A score out of 10
        - Specific examples from the transcript
        - 2-3 targeted improvement suggestions
        - Recommended exercises or practice activities
        
        Format the response as a JSON object with this structure:
        {{
            "overall_assessment": {{
                "grammar_score": 8.5,
                "pronunciation_score": 7.8,
                "fluency_score": 7.2,
                "vocabulary_score": 8.0,
                "coherence_score": 7.5,
                "overall_score": 7.8
            }},
            "detailed_feedback": {{
                "grammar": {{
                    "strengths": ["Strength 1", "Strength 2"],
                    "areas_for_improvement": ["Area 1", "Area 2"],
                    "examples": ["Example 1", "Example 2"],
                    "improvement_suggestions": ["Suggestion 1", "Suggestion 2"]
                }},
                "pronunciation": {{ ... }},
                "fluency": {{ ... }},
                "vocabulary": {{ ... }},
                "coherence": {{ ... }}
            }},
            "practice_recommendations": [
                {{
                    "focus_area": "Area to focus on",
                    "exercise_type": "Type of exercise",
                    "description": "Description of the exercise"
                }}
            ],
            "progress_insights": {{
                "key_improvements": ["Improvement 1", "Improvement 2"],
                "consistent_challenges": ["Challenge 1", "Challenge 2"]
            }}
        }}
        Only return the JSON object, nothing else.
        """
        
        response = model.generate_content(prompt)
        return response.text
    
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return {"error": "Failed to generate comprehensive report"}

async def generate_progress_trends(
    user_id: str,
    session_history: List[Dict[str, Any]],
    time_period: str = "month"
) -> Dict[str, Any]:
    """
    Generate progress trends and analytics based on user's session history
    
    Parameters:
    - user_id: User identifier
    - session_history: List of previous session data with scores and metrics
    - time_period: Time period for analysis ("day", "week", "month", "all")
    
    Returns:
    - Dictionary with progress statistics and trends
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Simplified approach - in a real implementation, we'd aggregate the session_history data
        # before sending it to the model
        
        prompt = f"""
        Analyze this English language learner's progress over {time_period}:
        
        Session History:
        {session_history}
        
        Provide insights on:
        1. Grammar progress trend
        2. Pronunciation improvement
        3. Fluency development
        4. Vocabulary growth
        5. Overall performance trend
        
        For each area:
        - Identify patterns of improvement
        - Note any persistent challenges
        - Suggest focus areas for continued progress
        
        Format the response as a JSON object with this structure:
        {{
            "progress_summary": "Brief summary of overall progress",
            "performance_trends": {{
                "grammar": {{
                    "trend": "improving|stable|declining",
                    "improvement_rate": 15,  # percentage
                    "persistent_issues": ["Issue 1", "Issue 2"],
                    "recommendations": ["Recommendation 1", "Recommendation 2"]
                }},
                "pronunciation": {{ ... }},
                "fluency": {{ ... }},
                "vocabulary": {{ ... }}
            }},
            "milestone_achievements": ["Achievement 1", "Achievement 2"],
            "focus_recommendations": [
                {{
                    "area": "Focus area",
                    "priority_level": "high|medium|low",
                    "exercises": ["Exercise 1", "Exercise 2"]
                }}
            ],
            "estimated_proficiency_change": "+0.5"  # Estimated change in proficiency level
        }}
        Only return the JSON object, nothing else.
        """
        
        response = model.generate_content(prompt)
        return response.text
    
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return {"error": "Failed to generate progress trends"}