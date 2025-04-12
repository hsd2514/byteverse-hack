from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
import os
import tempfile
from ..services.whisper_service import transcribe_audio
from ..models.schemas import TranscriptionResponse

router = APIRouter(prefix="/transcription", tags=["transcription"])

@router.post("/", response_model=TranscriptionResponse)
async def transcribe_voice(audio_file: UploadFile = File(...)):
    """
    Transcribe voice audio using the Whisper API.
    Returns transcribed text and confidence scores.
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file_path = temp_file.name
            content = await audio_file.read()
            temp_file.write(content)
        
        # Call Whisper service
        transcription_result = await transcribe_audio(temp_file_path)
        
        # Clean up temp file
        os.unlink(temp_file_path)
        
        return transcription_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")