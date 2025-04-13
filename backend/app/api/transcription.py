from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
import os
import uuid
import logging
from ..services.whisper_service import transcribe_audio
from ..models.schemas import TranscriptionResponse

router = APIRouter(prefix="/transcription", tags=["transcription"])

# Configure logging (ensure this is configured properly, e.g., in main.py or here)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define upload directory relative to the backend app root
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "audio_uploads")

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=TranscriptionResponse)
async def transcribe_voice(audio_file: UploadFile = File(...)):
    """
    Transcribe voice audio using the Whisper API.
    Saves the audio file and returns transcription results including pronunciation analysis.
    """
    try:
        # Generate a unique filename with a .wav extension
        # Even if the browser sends webm/ogg, saving with .wav might help ffmpeg (used by librosa/audioread) auto-detect
        unique_filename = f"{uuid.uuid4()}.wav"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Log received file info
        logger.info(f"Receiving file: {audio_file.filename}, Content-Type: {audio_file.content_type}, Size: {audio_file.size}") # Corrected f-string syntax
        
        # Save the uploaded file permanently
        content = await audio_file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)
            
        logger.info(f"File saved successfully to: {file_path}")
        
        # Call Whisper service
        transcription_result = await transcribe_audio(file_path)
        
        # Optional: Keep the file for debugging or delete it
        # os.unlink(file_path)
        # logger.info(f"Processed file {file_path}")
        
        return transcription_result
    except Exception as e:
        logger.error(f"Transcription endpoint failed for file {audio_file.filename}: {str(e)}", exc_info=True)
        # Return a valid TranscriptionResponse structure on error
        return TranscriptionResponse(
            text="",
            pronunciation_analysis={"error": f"Transcription processing failed: {str(e)}"},
            success=False,
            error=f"Transcription processing failed: {str(e)}"
        )
        # Avoid raising HTTPException if the client expects TranscriptionResponse model
        # raise HTTPException(status_code=500, detail=f"Transcription processing failed: {str(e)}")