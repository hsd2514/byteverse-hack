import os
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from ..models.schemas import ConversationMessage, ProficiencyLevel, PracticeType
import random # Import random
import json   # Import json
import logging # Added for logging
import re # Import regex module

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Configure logging
logger = logging.getLogger(__name__) # Added logger

# --- Helper Function ---
def _clean_json_response(text: str) -> str:
    """Removes Markdown code fences and leading/trailing whitespace from a string."""
    # Remove ```json ... ``` or ``` ... ```
    match = re.search(r"```(json)?(.*)```", text, re.DOTALL | re.IGNORECASE)
    if match:
        cleaned_text = match.group(2)
    else:
        cleaned_text = text
    return cleaned_text.strip()

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
        try:
            logger.debug(f"Raw Gemini response for generate_interview_questions:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            return json.loads(cleaned_text) # Parse cleaned
        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError in generate_interview_questions: {e}")
            logger.error(f"Problematic raw text: {response.text}")
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}")
            return {"error": f"Failed to parse generated interview questions: {e}"}
    
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
    - Dictionary with grammar feedback, vocabulary feedback, and fluency analysis
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
        try:
            logger.debug(f"Raw Gemini response for analyze_interview_response:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            return json.loads(cleaned_text) # Parse cleaned
        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError in analyze_interview_response: {e}")
            logger.error(f"Problematic raw text: {response.text}")
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}")
            return {"error": f"Failed to parse interview analysis: {e}"}
    
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
        try:
            logger.debug(f"Raw Gemini response for generate_discussion_questions:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            return json.loads(cleaned_text) # Parse cleaned
        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError in generate_discussion_questions: {e}")
            logger.error(f"Problematic raw text: {response.text}")
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}")
            return {"error": f"Failed to parse discussion questions: {e}"}
        
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
        model = genai.GenerativeModel('gemini-1.5-pro') # Initialize model
        
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
        try:
            logger.debug(f"Raw Gemini response for evaluate_discussion_response:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            result = json.loads(cleaned_text) # Parse cleaned

            # Ensure required fields are present
            required_fields = ["content_score", "organization_score", "grammar_score",
                              "vocabulary_score", "fluency_score", 
                              "punctuation_feedback", "sentence_structure_feedback", # Added fields
                              "overall_score", "band_descriptor", 
                              "strengths", "areas_to_improve", "suggested_exercises"]

            # If AI fails to provide a field, set scores/feedback/band to None, lists to empty
            for field in required_fields:
                if field not in result:
                    if "score" in field or "feedback" in field or field == "band_descriptor":
                        result[field] = None # Indicate AI couldn't provide score/feedback/band
                    else:
                        result[field] = [] # Default to empty list for text fields
            
            # Ensure overall_score is float if not None, derive band descriptor if possible
            if result.get("overall_score") is not None:
                try:
                    result["overall_score"] = float(result["overall_score"])
                    if result.get("band_descriptor") is None: # Try to derive band if missing
                         result["band_descriptor"] = get_band_descriptor(result["overall_score"])
                except (ValueError, TypeError):
                    result["overall_score"] = None
                    result["band_descriptor"] = None # Can't derive band without valid score
            elif result.get("band_descriptor") is not None: # If score is None but band is present, nullify band
                 result["band_descriptor"] = None

            return result

        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError in evaluate_discussion_response: {str(e)}")
            logger.error(f"Problematic raw text: {response.text}")
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}")
            # Handle case where response isn't valid JSON - call fallback
            return create_default_discussion_feedback(transcript) # Pass transcript
        
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
        try:
            logger.debug(f"Raw Gemini response for generate_pronunciation_drills:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            return json.loads(cleaned_text) # Parse cleaned
        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError in generate_pronunciation_drills: {e}")
            logger.error(f"Problematic raw text: {response.text}")
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}")
            return {"error": f"Failed to parse pronunciation drills: {e}"}
    
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
        try:
            logger.debug(f"Raw Gemini response for analyze_pronunciation_attempt:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            return json.loads(cleaned_text) # Parse cleaned
        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError in analyze_pronunciation_attempt: {e}")
            logger.error(f"Problematic raw text: {response.text}")
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}")
            return {"error": f"Failed to parse pronunciation attempt analysis: {e}"}
    
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
        try:
            logger.debug(f"Raw Gemini response for generate_grammar_challenges:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            return json.loads(cleaned_text) # Parse cleaned
        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError in generate_grammar_challenges: {e}")
            logger.error(f"Problematic raw text: {response.text}")
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}")
            return {"error": f"Failed to parse grammar challenges: {e}"}
    
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
        try:
            logger.debug(f"Raw Gemini response for evaluate_grammar_correction:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            return json.loads(cleaned_text) # Parse cleaned
        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError in evaluate_grammar_correction: {e}")
            logger.error(f"Problematic raw text: {response.text}")
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}")
            return {"error": f"Failed to parse grammar correction evaluation: {e}"}
    
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
        try:
            logger.debug(f"Raw Gemini response for generate_comprehensive_report:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            return json.loads(cleaned_text) # Parse cleaned
        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError in generate_comprehensive_report: {e}")
            logger.error(f"Problematic raw text: {response.text}")
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}")
            return {"error": f"Failed to parse comprehensive report: {e}"}
    
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
        try:
            logger.debug(f"Raw Gemini response for generate_progress_trends:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            return json.loads(cleaned_text) # Parse cleaned
        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError in generate_progress_trends: {e}")
            logger.error(f"Problematic raw text: {response.text}")
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}")
            return {"error": f"Failed to parse progress trends: {e}"}
    
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return {"error": "Failed to generate progress trends"}

async def analyze_pronunciation(transcript: str, pronunciation_analysis: dict, proficiency_level: ProficiencyLevel) -> Dict[str, Any]:
    """
    Analyze pronunciation patterns in user's speech using Gemini API.
    
    Returns detailed pronunciation feedback with scores for different aspects.
    """
    try:
        overall_score = pronunciation_analysis.get("overall_score", 70)
        potential_challenges = pronunciation_analysis.get("potential_challenges", [])

        model = genai.GenerativeModel('gemini-1.5-pro')

        prompt = f"""
        You are an expert English pronunciation coach.
        Analyze this transcript and pronunciation feedback for a {proficiency_level.value} level English learner:
        
        Transcript: "{transcript}"
        
        Overall Score: {overall_score}/100
        
        Challenges identified: {', '.join(potential_challenges) if potential_challenges else 'None specified'}
        
        Please provide a detailed pronunciation analysis with the following:
        1. Scores for different aspects:
           - vowel_score (0-100)
           - consonant_score (0-100)
           - intonation_score (0-100)
           - stress_score (0-100)
           - fluency_score (0-100)
        2. Specific areas that need improvement
        3. At least 3 strengths in the pronunciation
        4. At least 3 areas to improve
        5. At least 4 specific pronunciation exercises for the speaker
        
        Format the response as a JSON object with these keys:
        {{
            "vowel_score": int,
            "consonant_score": int,
            "intonation_score": int, 
            "stress_score": int,
            "fluency_score": int,
            "overall_score": float,
            "strengths": [list of strings],
        }}
        Only return the JSON object, nothing else.
        """

        # Call the AI model
        response = model.generate_content(prompt)

        try:
            # Parse the response text as JSON
            logger.debug(f"Raw Gemini response for analyze_pronunciation:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            result = json.loads(cleaned_text) # Parse cleaned

            # Ensure required fields are present
            required_fields = ["vowel_score", "consonant_score", "intonation_score",
                              "stress_score", "fluency_score", "overall_score",
                              "strengths", "areas_to_improve", "suggested_exercises"]

            # If AI fails to provide a field, set scores to None, lists to empty
            for field in required_fields:
                if field not in result:
                    if "score" in field:
                        result[field] = None # Indicate AI couldn't provide score
                    else:
                        result[field] = [] # Default to empty list for text fields

            # Transfer the overall score from input if AI didn't provide one
            if result.get("overall_score") is None:
                 overall_score_input = pronunciation_analysis.get("overall_score")
                 result["overall_score"] = float(overall_score_input) / 10 if overall_score_input is not None else None

            return result

        except json.JSONDecodeError as e:
            print(f"JSONDecodeError in analyze_pronunciation: {str(e)}")
            # Handle case where response isn't valid JSON - call fallback
            return create_default_pronunciation_feedback(transcript, pronunciation_analysis)

    except Exception as e:
        print(f"Error in analyze_pronunciation: {str(e)}")
        # Call fallback on any primary AI error
        return create_default_pronunciation_feedback(transcript, pronunciation_analysis)

def create_default_pronunciation_feedback(transcript: str, pronunciation_analysis: dict) -> Dict[str, Any]:
    """Create default pronunciation feedback, attempting secondary AI call for scores."""
    overall_score_100 = pronunciation_analysis.get("overall_score") # Keep original input score if available
    score_keys = ["vowel_score", "consonant_score", "intonation_score", "stress_score", "fluency_score", "overall_score"]
    final_scores = {key: None for key in score_keys} # Initialize scores to None

    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        prompt = f"""
        Analyze the following transcript and estimate pronunciation scores.
        Transcript: "{transcript}"
        Previous overall score estimate: {overall_score_100}/100 if available, otherwise unknown.
        
        Return ONLY a JSON object with integer scores (0-100) for: {', '.join(score_keys[:-1])} and a float score (0-10) for overall_score.
        If estimation is not possible, return null for scores.
        Example: {{ "vowel_score": 75, "consonant_score": 72, ..., "overall_score": 7.4 }}
        """
        response = model.generate_content(prompt)
        logger.debug(f"Raw Gemini response for secondary pronunciation feedback:\n{response.text}")
        cleaned_text = _clean_json_response(response.text) # Clean
        scores = json.loads(cleaned_text) # Parse cleaned
        # Update final_scores with AI-generated scores, keeping None if AI returned null or key missing
        for key in score_keys:
            final_scores[key] = scores.get(key) # Use .get() which returns None if key missing

    except Exception as e:
        print(f"Secondary AI call failed in create_default_pronunciation_feedback: {e}")
        # Keep scores as None if secondary call fails

    # Ensure overall_score is float if not None
    if final_scores["overall_score"] is not None:
        try:
            final_scores["overall_score"] = float(final_scores["overall_score"])
        except (ValueError, TypeError):
             final_scores["overall_score"] = None # Set back to None if conversion fails

    return {
        **final_scores,
        "strengths": [
            "AI analysis failed, providing generic feedback.",
            "Focus on overall clarity."
        ],
        "areas_to_improve": [
            "Review common pronunciation errors for your level.",
            "Practice minimal pairs.",
            "Work on sentence stress and intonation."
        ],
        "suggested_exercises": [
            "Record yourself and compare to native speakers.",
            "Use online pronunciation resources.",
            "Practice tongue twisters."
        ]
    }

async def analyze_grammar_response(transcript: str, question: str, corrections: List[dict], proficiency_level: ProficiencyLevel) -> Dict[str, Any]:
    """
    Analyze grammar patterns in user's speech using Gemini API.
    
    Returns detailed grammar feedback with scores and specific feedback areas.
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro') # Initialize model
        prompt = f"""
        You are an expert English grammar teacher.
        Analyze this grammar correction attempt by a {proficiency_level.value} level English learner:

        Original challenge: "{question}"
        User's response: "{transcript}"

        Grammar corrections found: {json.dumps(corrections) if corrections else "None"}

        Please provide a detailed grammar analysis with the following:
        1. Scores for different grammar aspects:
           - verb_forms_score (0-100)
           - agreement_score (0-100)
           - articles_score (0-100)
           - prepositions_score (0-100)
           - word_order_score (0-100)
        2. An overall grammar score (0-100)
        3. Specific feedback (a short string) on Punctuation usage.
        4. Specific feedback (a short string) on Sentence Structure (variety, complexity).
        5. At least 3 strengths in the response
        6. At least 3 areas that need improvement (mention specific error types if possible)
        7. At least 4 specific grammar exercises for the learner
        8. Overall score (float, 0-10 scale) reflecting overall grammatical accuracy.

        Format the response as a JSON object with these keys:
        {{
            "verb_forms_score": int | null,
            "agreement_score": int | null,
            "articles_score": int | null,
            "prepositions_score": int | null,
            "word_order_score": int | null,
            "grammar_score": int | null,
            "punctuation_feedback": string | null,
            "sentence_structure_feedback": string | null,
            "overall_score": float | null,
            "strengths": [list of strings],
            "areas_to_improve": [list of strings],
            "suggested_exercises": [list of strings]
        }}
        Only return the JSON object, nothing else.
        """

        # Call the AI model
        response = model.generate_content(prompt)

        try:
            # Parse the response text as JSON
            logger.debug(f"Raw Gemini response for analyze_grammar_response:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            result = json.loads(cleaned_text) # Parse cleaned

            # Ensure required fields are present
            required_fields = ["verb_forms_score", "agreement_score", "articles_score",
                              "prepositions_score", "word_order_score", "grammar_score",
                              "punctuation_feedback", "sentence_structure_feedback", # Added fields
                              "overall_score", "strengths", "areas_to_improve", "suggested_exercises"]

            # If AI fails to provide a field, set scores/feedback to None, lists to empty
            for field in required_fields:
                if field not in result:
                    if "score" in field or "feedback" in field:
                        result[field] = None # Indicate AI couldn't provide score/feedback
                    else:
                        result[field] = [] # Default to empty list for text fields
            
            # Ensure overall_score is float if not None
            if result.get("overall_score") is not None:
                try:
                    result["overall_score"] = float(result["overall_score"])
                except (ValueError, TypeError):
                    result["overall_score"] = None

            return result

        except json.JSONDecodeError as e:
            print(f"JSONDecodeError in analyze_grammar_response: {str(e)}")
            # Handle case where response isn't valid JSON - call fallback
            return create_default_grammar_feedback(transcript, corrections)

    except Exception as e:
        print(f"Error in analyze_grammar_response: {str(e)}")
        # Call fallback on any primary AI error
        return create_default_grammar_feedback(transcript, corrections)


def create_default_grammar_feedback(transcript: str, corrections: List[dict]) -> Dict[str, Any]:
    """Create default grammar feedback, attempting secondary AI call for scores and feedback."""
    num_corrections = len(corrections)
    score_keys = ["verb_forms_score", "agreement_score", "articles_score", "prepositions_score", "word_order_score", "grammar_score", "overall_score"]
    feedback_keys = ["punctuation_feedback", "sentence_structure_feedback"]
    final_scores = {key: None for key in score_keys} # Initialize scores to None
    final_feedback = {key: None for key in feedback_keys} # Initialize feedback to None

    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        prompt = f"""
        Analyze the following transcript and estimate grammar scores and provide brief feedback, considering {num_corrections} corrections were found.
        Transcript: "{transcript}"
        
        Return ONLY a JSON object with:
        - Integer scores (0-100) for: {', '.join(score_keys[:-1])}
        - A float score (0-10) for overall_score.
        - A short string feedback for: {', '.join(feedback_keys)}.
        If estimation is not possible, return null for scores/feedback.
        Example: {{ "verb_forms_score": 75, ..., "grammar_score": 70, "punctuation_feedback": "Generally good, check comma usage.", "sentence_structure_feedback": "Try varying sentence length.", "overall_score": 7.0 }}
        """
        response = model.generate_content(prompt)
        logger.debug(f"Raw Gemini response for secondary grammar feedback:\n{response.text}")
        cleaned_text = _clean_json_response(response.text) # Clean
        data = json.loads(cleaned_text) # Parse cleaned
        # Update final_scores and final_feedback with AI-generated data
        for key in score_keys:
            final_scores[key] = data.get(key)
        for key in feedback_keys:
            final_feedback[key] = data.get(key)

    except Exception as e:
        print(f"Secondary AI call failed in create_default_grammar_feedback: {e}")
        # Keep scores and feedback as None if secondary call fails
    
    # Ensure overall_score is float if not None
    if final_scores["overall_score"] is not None:
        try:
            final_scores["overall_score"] = float(final_scores["overall_score"])
        except (ValueError, TypeError):
             final_scores["overall_score"] = None
             
    # Provide generic text if feedback is still None
    if final_feedback["punctuation_feedback"] is None:
        final_feedback["punctuation_feedback"] = "AI analysis failed. Review standard punctuation rules."
    if final_feedback["sentence_structure_feedback"] is None:
        final_feedback["sentence_structure_feedback"] = "AI analysis failed. Aim for clear and varied sentences."


    return {
        **final_scores,
        **final_feedback,
        "strengths": [
            "AI analysis failed, providing generic feedback.",
            f"Number of corrections identified: {num_corrections} (if available)."
        ],
        "areas_to_improve": [
            "Review fundamental grammar rules.",
            "Focus on sentence structure and punctuation.",
            "Check for common errors like tense and agreement."
        ],
        "suggested_exercises": [
            "Use grammar checking tools.",
            "Complete targeted grammar exercises.",
            "Review explanations for identified corrections (if any)."
        ]
    }


async def evaluate_discussion_response(question: str, transcript: str, proficiency_level: ProficiencyLevel) -> Dict[str, Any]:
    """
    Evaluate a discussion response using Gemini API.
    
    Returns detailed feedback including punctuation and sentence structure.
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro') # Initialize model
        prompt = f"""
        You are an expert English language assessor.
        Evaluate this {proficiency_level.value} level English learner's response to a discussion question:

        Question: "{question}"
        Response: "{transcript}"

        Please provide a detailed evaluation with the following:
        1. Content score (0-100): relevance, development, examples
        2. Organization score (0-100): structure, coherence, linking devices
        3. Grammar score (0-100): accuracy and range
        4. Vocabulary score (0-100): range and appropriateness
        5. Fluency score (0-100): smoothness, hesitation, repetition
        6. Specific feedback (a short string) on Punctuation usage.
         7. Specific feedback (a short string) on Sentence Structure (variety, complexity).
        8. At least 3 strengths
        9. At least 3 areas that need improvement (mention specifics)
        10. At least 4 suggested exercises
        11. Overall score on scale of 1-9 (where 9 is highest)

        Format the response as a JSON object with these keys:
        {{
            "content_score": int | null,
            "organization_score": int | null,
            "grammar_score": int | null,
            "vocabulary_score": int | null,
            "fluency_score": int | null,
            "punctuation_feedback": string | null,
            "sentence_structure_feedback": string | null,
            "overall_score": float | null,
            "band_descriptor": string | null,
            "strengths": [list of strings],
            "areas_to_improve": [list of strings],
            "suggested_exercises": [list of strings]
        }}
        Only return the JSON object, nothing else.
        """

        # Call the AI model
        response = model.generate_content(prompt)

        try:
            # Parse the response text as JSON
            logger.debug(f"Raw Gemini response for evaluate_discussion_response:\n{response.text}")
            cleaned_text = _clean_json_response(response.text) # Clean
            result = json.loads(cleaned_text) # Parse cleaned

            # Ensure required fields are present
            required_fields = ["content_score", "organization_score", "grammar_score",
                              "vocabulary_score", "fluency_score", 
                              "punctuation_feedback", "sentence_structure_feedback", # Added fields
                              "overall_score", "band_descriptor", 
                              "strengths", "areas_to_improve", "suggested_exercises"]

            # If AI fails to provide a field, set scores/feedback/band to None, lists to empty
            for field in required_fields:
                if field not in result:
                    if "score" in field or "feedback" in field or field == "band_descriptor":
                        result[field] = None # Indicate AI couldn't provide score/feedback/band
                    else:
                        result[field] = [] # Default to empty list for text fields
            
            # Ensure overall_score is float if not None, derive band descriptor if possible
            if result.get("overall_score") is not None:
                try:
                    result["overall_score"] = float(result["overall_score"])
                    result["overall_score"] = max(1.0, min(9.0, result["overall_score"])) # Clamp score
                    if result.get("band_descriptor") is None: # Try to derive band if missing
                         result["band_descriptor"] = get_band_descriptor(result["overall_score"])
                except (ValueError, TypeError):
                    logger.warning(f"Could not convert discussion overall_score '{result.get('overall_score')}' to float.")
                    result["overall_score"] = None
                    result["band_descriptor"] = None # Can't derive band without valid score
            elif result.get("band_descriptor") is not None: # If score is None but band is present, nullify band
                 logger.warning("Discussion overall score is None, but band descriptor is present. Nullifying band.")
                 result["band_descriptor"] = None

            return result

        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError in evaluate_discussion_response: {str(e)}")
            logger.error(f"Problematic raw text: {response.text}") # Log raw text
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}") # Log cleaned text
            # Handle case where response isn't valid JSON - call fallback
            return create_default_discussion_feedback(transcript)

    except Exception as e:
        logger.error(f"Error in evaluate_discussion_response: {str(e)}")
         # Call fallback on any primary AI error
        return create_default_discussion_feedback(transcript)


def create_default_discussion_feedback(transcript: str) -> Dict[str, Any]:
    """Create default discussion feedback, attempting secondary AI call for scores and feedback."""
    word_count = len(transcript.split())
    score_keys = ["content_score", "organization_score", "grammar_score", "vocabulary_score", "fluency_score", "overall_score"]
    feedback_keys = ["punctuation_feedback", "sentence_structure_feedback"]
    final_scores = {key: None for key in score_keys} # Initialize scores to None
    final_feedback = {key: None for key in feedback_keys} # Initialize feedback to None
    band_descriptor = None
    
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        prompt = f"""
        Analyze the following transcript ({word_count} words) and estimate discussion performance scores and provide brief feedback.
        Transcript: "{transcript}"
        
        Return ONLY a JSON object with:
        - Integer scores (0-100) for: {', '.join(score_keys[:-1])}
        - A float score (1-9) for overall_score.
        - A short string feedback for: {', '.join(feedback_keys)}.
        If estimation is not possible, return null for scores/feedback.
        Example: {{ "content_score": 75, ..., "fluency_score": 70, "punctuation_feedback": "Check comma usage.", "sentence_structure_feedback": "Good variety.", "overall_score": 7.0 }}
        """
        response = model.generate_content(prompt)
        logger.debug(f"Raw Gemini response for secondary discussion feedback:\n{response.text}")
        cleaned_text = _clean_json_response(response.text) # Clean
        data = json.loads(cleaned_text) # Parse cleaned
        # Update final_scores and final_feedback with AI-generated data
        for key in score_keys:
            final_scores[key] = data.get(key)
        for key in feedback_keys:
            final_feedback[key] = data.get(key)


        # Ensure overall score is float and derive band descriptor
        if final_scores["overall_score"] is not None:
            try:
                final_scores["overall_score"] = float(final_scores["overall_score"])
                # Ensure overall score is within 1-9 range
                final_scores["overall_score"] = max(1.0, min(9.0, final_scores["overall_score"]))
                band_descriptor = get_band_descriptor(final_scores["overall_score"])
            except (ValueError, TypeError):
                final_scores["overall_score"] = None # Set back to None if conversion fails
                band_descriptor = None

    except Exception as e:
        logger.error(f"Secondary AI call failed in create_default_discussion_feedback: {e}")
        # Keep scores, feedback and band_descriptor as None

    # Provide generic text if feedback is still None
    if final_feedback["punctuation_feedback"] is None:
        final_feedback["punctuation_feedback"] = "AI analysis failed. Review standard punctuation rules."
    if final_feedback["sentence_structure_feedback"] is None:
        final_feedback["sentence_structure_feedback"] = "AI analysis failed. Aim for clear and varied sentences."

    return {
        **final_scores,
        **final_feedback,
        "band_descriptor": band_descriptor,
        "strengths": [
            "AI analysis failed, providing generic feedback."
        ],
        "areas_to_improve": [
            "Focus on clarity, relevance, structure, and accuracy.",
            "Review punctuation and sentence construction."
        ],
        "suggested_exercises": [
            "Review model answers for similar discussion questions.",
            "Practice outlining responses before speaking.",
            "Focus on specific grammar/vocab weaknesses."
        ]
    }


async def evaluate_cue_card_response(topic: str, transcript: str, proficiency_level: ProficiencyLevel) -> Dict[str, Any]:
    """
    Evaluate a cue card response using Gemini API.
    
    Returns detailed feedback including punctuation and sentence structure.
    """
    try:
        if not genai: raise Exception("Gemini AI client not initialized.") # Check genai
        model = genai.GenerativeModel('gemini-1.5-pro') # Initialize model
        
        # Define the prompt for cue card evaluation
        prompt = f"""
        You are an expert English language assessor.
        Evaluate this {proficiency_level.value} level English learner's response to a cue card topic:

        Topic: "{topic}"
        Response: "{transcript}"

        Please provide a detailed evaluation with the following:
        1. Task completion score (0-100): addressing all parts of the prompt
        2. Coherence score (0-100): organization, logical flow, linking devices
        3. Grammar score (0-100): accuracy and range
        4. Vocabulary score (0-100): range and appropriateness
        5. Fluency score (0-100): smoothness, hesitation, repetition
        6. Specific feedback (a short string) on Punctuation usage.
        7. Specific feedback (a short string) on Sentence Structure (variety, complexity).
        8. At least 3 strengths
        9. At least 3 areas that need improvement (mention specifics)
        10. At least 4 suggested exercises
        11. Overall score on scale of 1-9 (where 9 is highest)
        12. Band descriptor string based on overall score.

        Format the response ONLY as a JSON object with these keys:
        {{
            "task_completion_score": int | null,
            "coherence_score": int | null,
            "grammar_score": int | null,
            "vocabulary_score": int | null,
            "fluency_score": int | null,
            "punctuation_feedback": string | null,
            "sentence_structure_feedback": string | null,
            "overall_score": float | null,
            "band_descriptor": string | null,
            "strengths": [list of strings],
            "areas_to_improve": [list of strings],
            "suggested_exercises": [list of strings]
        }}
        Only return the JSON object, nothing else.
        If analysis is not possible, return null for scores/feedback/band and empty lists for text fields.
        """

        # Call the AI model
        api_response = model.generate_content(prompt) # Assign to api_response

        try:
            # Parse the response text as JSON
            logger.debug(f"Raw Gemini response for cue card evaluation:\n{api_response.text}") # Use api_response.text
            cleaned_text = _clean_json_response(api_response.text) # Clean the text
            result = json.loads(cleaned_text) # Parse cleaned text

            # ... existing field validation and processing ...
            # Ensure overall_score is float if not None, derive band descriptor if possible
            if result.get("overall_score") is not None:
                try:
                    result["overall_score"] = float(result["overall_score"])
                    result["overall_score"] = max(1.0, min(9.0, result["overall_score"])) # Clamp score
                    if result.get("band_descriptor") is None: # Try to derive band if missing
                         result["band_descriptor"] = get_band_descriptor(result["overall_score"])
                except (ValueError, TypeError):
                    logger.warning(f"Could not convert cue card overall_score '{result.get('overall_score')}' to float.")
                    result["overall_score"] = None
                    result["band_descriptor"] = None # Can't derive band without valid score
            elif result.get("band_descriptor") is not None: # If score is None but band is present, nullify band
                 logger.warning("Cue card overall score is None, but band descriptor is present. Nullifying band.")
                 result["band_descriptor"] = None
            
            # Add pronunciation score if missing (might be expected by frontend)
            result.setdefault("pronunciation_score", None)


            return result

        except json.JSONDecodeError as e:
            # Log the error and the problematic response text
            logger.error(f"JSONDecodeError in evaluate_cue_card_response: {str(e)}")
            logger.error(f"Problematic response text: {api_response.text}") # Use api_response.text
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}")
            # Handle case where response isn't valid JSON - call fallback
            return create_default_cue_card_feedback(transcript, f"AI response was not valid JSON: {e}")

    except Exception as e:
        logger.error(f"Error in evaluate_cue_card_response: {str(e)}", exc_info=True) 
        # Call fallback on any primary AI error
        return create_default_cue_card_feedback(transcript, f"Primary AI call failed: {e}")

def get_band_descriptor(score: Optional[float]) -> Optional[str]:
    """Get appropriate band descriptor based on overall score"""
    if score is None:
        return None
    if score >= 8.5:
        return "Expert User"
    elif score >= 7.5:
        return "Very Good User"
    elif score >= 6.5:
        return "Good User"
    elif score >= 5.5:
        return "Competent User"
    elif score >= 4.5:
        return "Modest User"
    elif score >= 3.5:
        return "Limited User"
    elif score >= 2.5:
        return "Extremely Limited User"
    else:
        return "Intermittent User"

def create_default_cue_card_feedback(transcript: str, error_reason: str = "AI analysis failed") -> Dict[str, Any]:
    """Create default cue card feedback, attempting secondary AI call for scores and feedback."""
    word_count = len(transcript.split())
    score_keys = ["task_completion_score", "coherence_score", "grammar_score", "vocabulary_score", "fluency_score", "overall_score"]
    feedback_keys = ["punctuation_feedback", "sentence_structure_feedback"]
    final_scores = {key: None for key in score_keys} # Initialize scores to None
    final_feedback = {key: None for key in feedback_keys} # Initialize feedback to None
    band_descriptor = None
    secondary_call_failed = False # Flag to track secondary call status

    try:
        # Attempt secondary, simpler AI call for basic scores/feedback
        model = genai.GenerativeModel('gemini-1.5-pro')
        prompt = f"""
        Analyze the following cue card response transcript ({word_count} words) and estimate performance scores and provide brief feedback.
        Transcript: "{transcript}"
        
        Return ONLY a JSON object with:
        - Integer scores (0-100) for: {', '.join(score_keys[:-1])}
        - A float score (1-9) for overall_score.
        - A short string feedback for: {', '.join(feedback_keys)}.
        If estimation is not possible, return null for scores/feedback.
        Example: {{ "task_completion_score": 75, ..., "fluency_score": 70, "punctuation_feedback": "Mostly correct.", "sentence_structure_feedback": "Repetitive structures.", "overall_score": 7.0 }}
        """
        secondary_response = model.generate_content(prompt)
        
        try:
            logger.debug(f"Raw Gemini response for secondary feedback call:\n{secondary_response.text}")
            cleaned_text = _clean_json_response(secondary_response.text) # Clean the text
            data = json.loads(cleaned_text) # Parse cleaned text
             # Update final_scores and final_feedback with AI-generated data
            for key in score_keys:
                final_scores[key] = data.get(key)
            for key in feedback_keys:
                final_feedback[key] = data.get(key)

            # Ensure overall score is float and derive band descriptor
            if final_scores["overall_score"] is not None:
                try:
                    final_scores["overall_score"] = float(final_scores["overall_score"])
                    # Ensure overall score is within 1-9 range
                    final_scores["overall_score"] = max(1.0, min(9.0, final_scores["overall_score"]))
                    band_descriptor = get_band_descriptor(final_scores["overall_score"])
                except (ValueError, TypeError):
                    logger.warning("Could not convert secondary overall_score to float.")
                    final_scores["overall_score"] = None # Set back to None if conversion fails
                    band_descriptor = None
        
        except json.JSONDecodeError as json_e:
            secondary_call_failed = True
            logger.error(f"Secondary AI call JSONDecodeError in create_default_cue_card_feedback: {json_e}")
            logger.error(f"Problematic secondary response text: {secondary_response.text}")
            logger.error(f"Attempted to parse cleaned secondary text: {cleaned_text}")
            # Keep scores, feedback and band_descriptor as None

    except Exception as e:
        secondary_call_failed = True
        logger.error(f"Secondary AI call failed in create_default_cue_card_feedback: {e}", exc_info=True)
        # Keep scores, feedback and band_descriptor as None

    # Provide generic text if feedback is still None or secondary call failed
    generic_reason = "AI analysis failed." if not secondary_call_failed else "Secondary AI analysis failed."
    
    if final_feedback["punctuation_feedback"] is None:
        final_feedback["punctuation_feedback"] = f"{generic_reason} Review standard punctuation rules."
    if final_feedback["sentence_structure_feedback"] is None:
        final_feedback["sentence_structure_feedback"] = f"{generic_reason} Aim for clear and varied sentences."

    return {
        **final_scores,
        **final_feedback,
        "band_descriptor": band_descriptor,
        "strengths": [
             f"{error_reason}. Providing generic feedback." # Include original error reason
        ],
        "areas_to_improve": [
            "Ensure all parts of the cue card are addressed.",
            "Practice organizing your response logically.",
            "Expand vocabulary related to common cue card topics.",
            "Check grammar, punctuation, and sentence structure."
        ],
        "suggested_exercises": [
            "Practice speaking for 1-2 minutes on various cue card topics.",
            "Use structuring techniques (e.g., PREP).",
            "Record and review your responses.",
            "Focus on specific grammar/vocab weaknesses."
        ],
        # Add an error field to explicitly signal the fallback was used
        "error": error_reason 
    }

async def evaluate_general_speaking(
    question: str, 
    transcript: str, 
    proficiency_level: ProficiencyLevel,
    corrections: Optional[List[dict]] = None, # Made corrections Optional
    pronunciation_analysis: Optional[dict] = None # Made pronunciation_analysis Optional
) -> Dict[str, Any]:
    """
    Evaluate general speaking performance using Gemini API.

    Returns comprehensive feedback combining grammar, pronunciation, and content analysis.
    """
    # Extract pronunciation score if available, keep it as int/None
    pronunciation_score_input = pronunciation_analysis.get("overall_score") if pronunciation_analysis else None # Handle None input

    try:
        if not genai: raise Exception("Gemini AI client not initialized.")
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Construct prompt (adjust as needed)
        prompt = f"""
        You are an English language assessor. Evaluate this {proficiency_level.value} level learner's response.
        Context/Question: "{question if question else 'General speaking practice'}"
        Response Transcript: "{transcript}"
        
        Provide a detailed evaluation including:
        1. Grammar score (0-100)
        2. Vocabulary score (0-100)
        3. Fluency score (0-100) - consider smoothness, hesitations
        4. Pronunciation score (0-100) - based on clarity and accuracy (consider provided analysis if available)
        5. Overall score (1-9 float)
        6. Band descriptor string based on overall score.
        7. Strengths (list of strings, at least 2)
        8. Areas to improve (list of strings, at least 2)
        9. Suggested exercises (list of strings, at least 3)

        Format the response ONLY as a JSON object with keys:
        "grammar_score", "vocabulary_score", "fluency_score", "pronunciation_score", 
        "overall_score", "band_descriptor", "strengths", "areas_to_improve", "suggested_exercises"
        
        Example: {{ "grammar_score": 80, ..., "overall_score": 7.5, "band_descriptor": "Very Good User", ... }}
        If analysis is not possible, return null for scores/band and empty lists for text fields.
        """
        
        # Add pronunciation context if available
        if pronunciation_analysis and not pronunciation_analysis.get('error'):
             prompt += f"\nConsider this pronunciation analysis: {json.dumps(pronunciation_analysis)}"
             
        # Add grammar correction context if available
        if corrections:
             prompt += f"\nConsider these potential grammar issues identified earlier: {json.dumps(corrections)}"

        # Call the AI model
        api_response = model.generate_content(prompt) # Assign to api_response

        try:
            # Log the raw response text for debugging
            logger.debug(f"Raw Gemini response for general speaking evaluation:\n{api_response.text}") # Use api_response.text
            cleaned_text = _clean_json_response(api_response.text) # Clean the text
            result = json.loads(cleaned_text) # Parse cleaned text

            # Ensure required fields are present
            required_fields = ["grammar_score", "vocabulary_score", "pronunciation_score",
                              "fluency_score", "overall_score", "band_descriptor",
                              "strengths", "areas_to_improve", "suggested_exercises"]

            # If AI fails to provide a field, set scores/band to None, lists to empty
            for field in required_fields:
                 if field not in result:
                    # Special handling for pronunciation_score - use input if missing
                    if field == "pronunciation_score":
                         result[field] = pronunciation_score_input if pronunciation_score_input is not None else None
                    elif "score" in field or field == "band_descriptor":
                        result[field] = None # Indicate AI couldn't provide score/band
                    else:
                        result[field] = [] # Default to empty list for text fields
            
            # Ensure overall_score is float if not None, derive band descriptor if possible
            if result.get("overall_score") is not None:
                try:
                    result["overall_score"] = float(result["overall_score"])
                    result["overall_score"] = max(1.0, min(9.0, result["overall_score"])) # Clamp score
                    if result.get("band_descriptor") is None: # Try to derive band if missing
                         result["band_descriptor"] = get_band_descriptor(result["overall_score"])
                except (ValueError, TypeError):
                    logger.warning(f"Could not convert general speaking overall_score '{result.get('overall_score')}' to float.")
                    result["overall_score"] = None
                    result["band_descriptor"] = None # Can't derive band without valid score
            elif result.get("band_descriptor") is not None: # If score is None but band is present, nullify band
                 logger.warning("General speaking overall score is None, but band descriptor is present. Nullifying band.")
                 result["band_descriptor"] = None

            # Ensure pronunciation score is the one from input if AI didn't override or provided None
            if result.get("pronunciation_score") is None and pronunciation_score_input is not None:
                 result["pronunciation_score"] = pronunciation_score_input
            
            # Add other expected fields if missing (e.g., from cue card schema)
            result.setdefault("punctuation_feedback", None)
            result.setdefault("sentence_structure_feedback", None)
            result.setdefault("task_completion_score", None)
            result.setdefault("coherence_score", None)


            return result

        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError in evaluate_general_speaking: {str(e)}")
            logger.error(f"Problematic raw text: {api_response.text}") # Log raw text
            logger.error(f"Attempted to parse cleaned text: {cleaned_text}") # Log cleaned text
            # Handle case where response isn't valid JSON - call fallback
            return create_default_general_speaking_feedback(transcript, corrections, pronunciation_score_input, f"AI response was not valid JSON: {e}")

    except Exception as e:
        logger.error(f"Error in evaluate_general_speaking: {str(e)}", exc_info=True)
         # Call fallback on any primary AI error
        return create_default_general_speaking_feedback(transcript, corrections, pronunciation_score_input, f"Primary AI call failed: {e}")


def create_default_general_speaking_feedback(
    transcript: str, 
    corrections: Optional[List[dict]], 
    pronunciation_score_input: Optional[int],
    error_reason: str = "AI analysis failed" # Add error reason parameter
) -> Dict[str, Any]:
    """Create default general speaking feedback, attempting secondary AI call for scores."""
    word_count = len(transcript.split())
    num_corrections = len(corrections) if corrections else 0
    # Note: pronunciation_score is passed in, others need estimation
    score_keys = ["grammar_score", "vocabulary_score", "fluency_score", "overall_score"] # Exclude pronunciation
    final_scores = {key: None for key in score_keys} # Initialize scores to None
    final_scores["pronunciation_score"] = pronunciation_score_input # Use the input score directly
    band_descriptor = None
    secondary_call_failed = False

    try:
        if not genai: raise Exception("Gemini AI client not initialized.")
        model = genai.GenerativeModel('gemini-1.5-pro')
        pron_score_info = f"{pronunciation_score_input}/100" if pronunciation_score_input is not None else "unknown"
        prompt = f"""
        Analyze the following transcript ({word_count} words) and estimate general speaking scores. 
        Consider {num_corrections} grammar corrections were found and a previous pronunciation score estimate of {pron_score_info}.
        Transcript: "{transcript}"
        
        Return ONLY a JSON object with integer scores (0-100) for: grammar_score, vocabulary_score, fluency_score, and a float score (1-9) for overall_score.
        If estimation is not possible, return null for scores.
        Example: {{ "grammar_score": 75, "vocabulary_score": 72, "fluency_score": 70, "overall_score": 7.0 }}
        """
        secondary_response = model.generate_content(prompt) # Assign to secondary_response
        
        try:
            logger.debug(f"Raw Gemini response for secondary general feedback call:\n{secondary_response.text}") # Use secondary_response.text
            cleaned_text = _clean_json_response(secondary_response.text) # Clean the text
            scores = json.loads(cleaned_text) # Parse cleaned text
            
            # Update final_scores with AI-generated scores, keeping None if AI returned null or key missing
            for key in score_keys: # Only update keys estimated by secondary AI
                final_scores[key] = scores.get(key)
            
            # Ensure overall score is float and derive band descriptor
            if final_scores["overall_score"] is not None:
                try:
                    final_scores["overall_score"] = float(final_scores["overall_score"])
                     # Ensure overall score is within 1-9 range
                    final_scores["overall_score"] = max(1.0, min(9.0, final_scores["overall_score"]))
                    band_descriptor = get_band_descriptor(final_scores["overall_score"])
                except (ValueError, TypeError):
                    logger.warning("Could not convert secondary general speaking overall_score to float.")
                    final_scores["overall_score"] = None # Set back to None if conversion fails
                    band_descriptor = None
        
        except json.JSONDecodeError as json_e:
            secondary_call_failed = True
            logger.error(f"Secondary AI call JSONDecodeError in create_default_general_speaking_feedback: {json_e}")
            logger.error(f"Problematic secondary response text: {secondary_response.text}") # Use secondary_response.text

    except Exception as e:
        secondary_call_failed = True
        logger.error(f"Secondary AI call failed in create_default_general_speaking_feedback: {e}", exc_info=True)
        # Keep estimated scores (grammar, vocab, fluency, overall) as None
        # Pronunciation score remains as the input value

    generic_reason = "AI analysis failed." if not secondary_call_failed else "Secondary AI analysis failed."

    return {
        **final_scores, # Includes pronunciation_score from input
        "band_descriptor": band_descriptor,
        "strengths": [
            f"{error_reason}. Providing generic feedback." # Include original error reason
        ],
        "areas_to_improve": [
            "Focus on overall fluency and coherence.",
            "Review grammar and vocabulary relevant to the topic.",
            "Check pronunciation clarity."
        ],
        "suggested_exercises": [
            "Practice speaking on diverse topics.",
            "Record and analyze your speech.",
            "Seek feedback from peers or teachers if possible."
        ],
        # Add other fields expected by frontend/backend, even if None/empty
        "punctuation_feedback": f"{generic_reason} Check punctuation usage.",
        "sentence_structure_feedback": f"{generic_reason} Vary sentence structures.",
        "task_completion_score": None, 
        "coherence_score": None,
        "error": error_reason # Add the error reason to the response
    }
