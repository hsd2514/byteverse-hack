from typing import Dict, List, Any
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Initialize the grammar correction model and tokenizer
# Using a newer T5-based model that has better grammar and punctuation correction capabilities
MODEL_NAME = "vennify/t5-base-grammar-correction"
tokenizer = None
model = None

def load_model():
    """Load the Hugging Face grammar correction model on first use"""
    global tokenizer, model
    if tokenizer is None or model is None:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

async def correct_grammar(text: str, strict_mode: bool = True) -> Dict[str, Any]:
    """
    Correct grammar and punctuation in the provided text using Hugging Face model
    
    Parameters:
    - text: The text to correct
    - strict_mode: Whether to use strict correction mode (default: True)
    
    Returns dictionary with:
    - corrected_text: The corrected text
    - corrections: List of specific corrections with original and corrected text
    """
    try:
        # Load model if not already loaded
        load_model()
        
        # Tokenize the input text
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        
        # Generate corrected text
        with torch.no_grad():
            outputs = model.generate(
                inputs["input_ids"],
                max_length=512,
                num_beams=5,
                early_stopping=True,
                do_sample=not strict_mode  # More deterministic in strict mode
            )
        
        # Decode the generated text
        corrected_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Find differences for highlighting
        corrections = []
        if corrected_text != text:
            # This is a simplified approach. In a production app,
            # you would use a more sophisticated diff algorithm to identify specific changes
            corrections.append({
                "original": text,
                "corrected": corrected_text,
                "explanation": "Grammar and punctuation corrected"
            })
        
        return {
            "corrected_text": corrected_text,
            "corrections": corrections,
            "success": True
        }
    except Exception as e:
        return {
            "corrected_text": text,  # Return original text on error
            "corrections": [],
            "success": False,
            "error": str(e)
        }