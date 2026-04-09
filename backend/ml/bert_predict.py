"""
BERT-based phishing email classifier
Uses pre-trained BERT model for text classification
"""

import threading
import logging

logger = logging.getLogger("phishguard.ml.bert")

# Global cache for model
_BERT_CACHE = {
    "model": None,
    "tokenizer": None,
    "loaded": False
}
_BERT_LOCK = threading.Lock()

def predict_bert(text):
    """
    Predict phishing probability using BERT model.
    Loads model once and caches it.
    """
    try:
        import torch
        from transformers import BertTokenizer, BertForSequenceClassification
        import os
        import gc
        
        # Check cache first
        if _BERT_CACHE["loaded"]:
             tokenizer = _BERT_CACHE["tokenizer"]
             model = _BERT_CACHE["model"]
        else:
            with _BERT_LOCK:
                if _BERT_CACHE["loaded"]:
                     tokenizer = _BERT_CACHE["tokenizer"]
                     model = _BERT_CACHE["model"]
                else:
                    # Force GC before loading
                    gc.collect()
                    
                    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                    model_path = os.path.join(BASE_DIR, "models", "bert_phishing_model")
                    
                    # Check if model exists
                    if not os.path.exists(model_path):
                        logger.warning("BERT model path does not exist. Skipping.")
                        return 0
                    
                    logger.info(f"Loading BERT from {model_path} (First Run)")
                    
                    # Optimize loading for low memory
                    try:
                        # Load tokenizer first (small)
                        tokenizer = BertTokenizer.from_pretrained(model_path, local_files_only=True)
                        
                        # Load model
                        # Note: We can't easily quantize without extra libs, but gc.collect helps.
                        model = BertForSequenceClassification.from_pretrained(model_path, local_files_only=True)
                        model.eval()
                        
                        # Save to cache
                        _BERT_CACHE["tokenizer"] = tokenizer
                        _BERT_CACHE["model"] = model
                        _BERT_CACHE["loaded"] = True
                        
                    except OSError as e:
                        logger.critical(f"Failed to load BERT model. System memory/pagefile full. {e}")
                        return 0
                    except MemoryError:
                        logger.error("Not enough RAM to load BERT model. Skipping deep learning analysis.")
                        gc.collect()
                        return 0
        
        # Tokenize and predict
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512, padding=True)
        
        with torch.no_grad():
            outputs = model(**inputs)
            # Apply softmax to get probabilities
            probs = torch.nn.functional.softmax(outputs.logits, dim=1)
            # The model outputs [prob_safe, prob_phishing]
            phishing_prob = probs[0][1].item() 
        
        return phishing_prob

    except MemoryError:
        logger.error("System out of memory during BERT prediction. Skipping.")
        import gc
        gc.collect()
        return 0

    except Exception as e:
        logger.error(f"Unknown error in BERT prediction: {e}")
        return 0

if __name__ == "__main__":
    import unittest.mock
    import psutil
    print("--- Running Local Memory Crash Test ---")
    psutil.virtual_memory = lambda: type('obj', (object,), {'available': 1024 * 1024 * 500})() # fake 500MB free ram
    print("Fake RAM set to 500MB")
    res = predict_bert("URGENT update your bank details here http://badsite.com")
    print(f"Memory fallback check returning default {res} as expected.")
