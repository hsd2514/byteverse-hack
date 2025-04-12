from fastapi import APIRouter, HTTPException
from fastapi.logger import logger
from ..models.schemas import GrammarCorrectionRequest, GrammarCorrectionResponse
from ..services.grammar_service import correct_grammar

router = APIRouter(prefix="/grammar", tags=["grammar"])

@router.post("/correct", response_model=GrammarCorrectionResponse)
async def correct_text_grammar(request: GrammarCorrectionRequest):
    """
    Correct grammar and punctuation in the provided text.
    Returns corrected text with a list of applied corrections.
    """
    try:
        logger.info(f"Received grammar correction request: {request.dict()}")
        correction_result = await correct_grammar(request.text, request.strict_mode)
        return correction_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grammar correction failed: {str(e)}")