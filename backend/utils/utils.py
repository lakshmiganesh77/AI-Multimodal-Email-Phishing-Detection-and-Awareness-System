import re
import sys
import os

def preprocess_email_text(subject: str, body: str) -> str:
    """
    Unified preprocessing logic for BOTH Training and Inference.
    Combines Subject and Body, cleans text, and normalizes it.
    
    Args:
        subject (str): Email subject
        body (str): Email body text
        
    Returns:
        str: Normalized text ready for ML model
    """
    # 1. Handle NoneTypes
    subject = subject or ""
    body = body or ""
    
    # 2. Combine signals (Weighting subject by placing it first is standard BERT practice)
    # Adding a separator for clarity if needed, but space is usually fine for raw text models
    text = f"{subject} {body}"
    
    # 3. Normalize
    text = text.lower().strip()
    
    # 4. Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    return text

def safe_float(value, default=0.0):
    try:
        return float(value)
    except (ValueError, TypeError):
        return default
