import os
import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration, pipeline
from typing import Dict, Any
import numpy as np
import librosa
from dotenv import load_dotenv
import google.generativeai as genai # Added
import json # Added
import re # Added for cleaning JSON
import soundfile as sf
import logging # Corrected import
import traceback # Import traceback
import audioread # Import audioread to catch its specific exception

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY not found in environment variables.")

# Initialize model and processor lazily
model = None
processor = None
gemini_model = None # Added for Gemini

def load_model():
    """Load the Hugging Face speech recognition model and Gemini model on first use"""
    global model, processor, gemini_model
    if model is None or processor is None:
        # Initialize Whisper model
        model_id = "openai/whisper-small"
        try:
            processor = WhisperProcessor.from_pretrained(model_id)
            model = WhisperForConditionalGeneration.from_pretrained(model_id)
            print("Whisper model loaded successfully.")
        except Exception as e:
            print(f"Error loading Whisper model: {e}")
            # Prevent further attempts if loading fails
            model = False
            processor = False

    if gemini_model is None and GEMINI_API_KEY:
        # Initialize Gemini model
        try:
            gemini_model = genai.GenerativeModel('gemini-1.5-flash') # Using 1.5 Flash as requested
            print("Gemini model loaded successfully.")
        except Exception as e:
            print(f"Error loading Gemini model: {e}")
            gemini_model = False # Prevent further attempts

# Helper function to clean Gemini's JSON output
def clean_json_string(json_string: str) -> str:
    """Removes markdown formatting and potential leading/trailing text around JSON."""
    # Remove markdown code block fences
    cleaned = re.sub(r'^```json\s*', '', json_string, flags=re.MULTILINE)
    cleaned = re.sub(r'\s*```$', '', cleaned, flags=re.MULTILINE)
    # Strip leading/trailing whitespace
    cleaned = cleaned.strip()
    return cleaned

async def analyze_pronunciation_with_gemini(text: str) -> Dict[str, Any]:
    """Analyzes pronunciation based on transcribed text using Gemini."""
    # ... existing checks ...

    try:
        prompt = f"""
        You are a strict English language examiner evaluating a student's pronunciation based *only* on the transcribed text provided below. Be critical and assume potential issues based on common learner errors reflected in text.

        Transcribed Text:
        "{text}"

        Instructions:
        1. Provide a strict, critical overall pronunciation score (0-100), assuming potential issues based on the text.
        2. Identify specific words or phrases that are likely mispronounced based on common learner errors or awkward phrasing in the text. List these as "potential_challenges". Be specific (e.g., "the 'th' sound in 'three'", "vowel sound in 'ship' vs 'sheep'").
        3. Provide 2-3 actionable pronunciation tips focused on the potential challenges identified.
        4. Format your response strictly as a JSON object with the following structure:
           {{
               "overall_score": <estimated_score_integer_0_to_100>,
               "potential_challenges": ["Specific challenge 1", "Specific challenge 2", ...],
               "pronunciation_tips": ["Actionable Tip 1", "Actionable Tip 2"]
           }}
        Only return the JSON object. Do not include any introductory text, explanations outside the JSON, or markdown formatting. Be strict in your assessment.
        """
        
        response = await gemini_model.generate_content_async(prompt)
        
        # Clean the response text before parsing
        cleaned_response_text = clean_json_string(response.text)
        
        # Parse the JSON response
        analysis_result = json.loads(cleaned_response_text)
        # Add validation if needed here
        return analysis_result

    except json.JSONDecodeError as json_err:
        print(f"Gemini JSON Decode Error: {json_err}")
        print(f"Raw Gemini Response: {response.text}")
        return {"error": "Failed to parse Gemini pronunciation analysis response.", "raw_response": response.text}
    except Exception as e:
        print(f"Gemini API Error during pronunciation analysis: {str(e)}")
        return {"error": f"Failed to get pronunciation analysis from Gemini: {str(e)}"}

async def transcribe_audio(audio_path: str) -> Dict[str, Any]:
    """
    Transcribe audio using Whisper and analyze pronunciation using Gemini.
    Returns transcribed text and structured pronunciation analysis.
    """
    # Get logger instance (assuming it's configured elsewhere or add basicConfig here)
    logger = logging.getLogger(__name__)
    logger.info(f"Starting transcription for audio file: {audio_path}")
    try:
        # --- BEGIN FFmpeg PATH Workaround ---
        # Define path to the tools directory relative to this script's location
        # Assumes tools is two levels up from services directory (backend/tools)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(script_dir)) # Adjust based on actual structure
        tools_dir = os.path.join(project_root, "tools") # Assuming ffmpeg.exe is in backend/tools

        if os.path.isdir(tools_dir):
            logger.info(f"Attempting to add tools directory to PATH: {tools_dir}")
            original_path = os.environ.get('PATH', '')
            if tools_dir not in original_path:
                os.environ['PATH'] = tools_dir + os.pathsep + original_path
                logger.info(f"Temporarily updated PATH: {os.environ['PATH']}")
            else:
                logger.info("Tools directory already in PATH.")
        else:
            logger.warning(f"Assumed tools directory not found: {tools_dir}. FFmpeg might not be found if not in system PATH.")
        # --- END FFmpeg PATH Workaround ---

        # Load models if not already loaded
        load_model()

        if model is False or processor is False:
             logger.error("Whisper model failed to load. Cannot transcribe.")
             raise RuntimeError("Whisper model failed to load. Cannot transcribe.")

        logger.info(f"Attempting to load audio file: {audio_path} using librosa...")
        # Load audio file using librosa (might use soundfile or audioread backend)
        # Force resampling to 16kHz as required by Whisper
        try:
            speech_array, sampling_rate = librosa.load(audio_path, sr=16000, mono=True)
            logger.info(f"Audio file loaded successfully using librosa. Shape: {speech_array.shape}, Sample rate: {sampling_rate}")
        except audioread.exceptions.NoBackendError as no_backend_err:
             logger.error(f"Audioread failed for {audio_path}: No backend found. FFmpeg is likely missing.", exc_info=True)
             error_detail = f"Failed to load audio file {audio_path}: Audioread backend (e.g., FFmpeg) not found. Please install FFmpeg and ensure it's in your system PATH."
             raise RuntimeError(error_detail) from no_backend_err
        except Exception as load_err:
             logger.error(f"Librosa failed to load {audio_path}: {load_err}", exc_info=True)
             # Include details about potential missing backends (ffmpeg, libsndfile)
             error_detail = f"Failed to load audio file {audio_path} using librosa. Ensure ffmpeg or libsndfile is installed and accessible. Error: {load_err}"
             raise RuntimeError(error_detail) from load_err

        # Ensure speech_array is numpy array (librosa.load should return numpy)
        if not isinstance(speech_array, np.ndarray):
             logger.warning("librosa.load did not return a numpy array, attempting conversion.")
             speech_array = np.array(speech_array, dtype=np.float32)

        # Create speech recognition pipeline
        # Ensure model and processor are loaded before creating pipeline
        if model is None or processor is None:
             logger.error("Whisper model components not loaded before pipeline creation.")
             raise RuntimeError("Whisper model components not loaded.")

        pipe = pipeline(
            "automatic-speech-recognition",
            model=model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            # Consider adding device mapping if GPU is available: device=0 for GPU
        )

        # Transcribe audio
        # Use chunk_length_s for potentially better handling of longer audio
        logger.info("Starting Whisper pipeline for transcription...")
        # Pass the numpy array directly to the pipeline
        result = pipe(speech_array.copy(), chunk_length_s=30, batch_size=8, return_timestamps=False)
        text = result["text"].strip() if result and "text" in result else ""
        logger.info(f"Transcription result: '{text}'") # Added logging for result

        if not text:
             logger.warning(f"Transcription resulted in empty text for file: {audio_path}") # Added logging
             # Handle case where transcription is empty
             pronunciation_analysis = {"overall_score": 0, "potential_challenges": [], "pronunciation_tips": ["No text transcribed."]}
        else:
             # Analyze pronunciation using Gemini based on the transcribed text
             logger.info("Sending transcribed text to Gemini for analysis...")
             # Use the updated analysis function
             pronunciation_analysis = await analyze_pronunciation_with_gemini(text) 
             logger.info("Pronunciation analysis received from Gemini.")

        return {
            "text": text,
            "pronunciation_analysis": pronunciation_analysis, # Ensure this key matches frontend expectation
            "success": True
        }
    except RuntimeError as rterr:
         logger.error(f"Runtime Error in transcribe_audio for {audio_path}: {rterr}", exc_info=True)
         # Ensure error response matches the schema
         return {
            "text": "",
            "pronunciation_analysis": {"error": str(rterr)}, # Changed key to pronunciation_analysis
            "success": False,
            "error": str(rterr)
         }
    except Exception as e:
        error_message = f"An unexpected error occurred during transcription or analysis for {audio_path}: {str(e)}"
        logger.error(error_message, exc_info=True) # Log the full traceback
        # Ensure error response matches the schema
        return {
            "text": "",
            "pronunciation_analysis": {"error": error_message}, # Changed key to pronunciation_analysis
            "success": False,
            "error": str(e) if str(e) else "Unknown error" # Ensure error field is not empty
        }