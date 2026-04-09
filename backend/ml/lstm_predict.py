"""
LSTM-based phishing email classifier
Uses deep learning LSTM model for sequential text analysis
"""

import threading
import logging

logger = logging.getLogger("phishguard.ml.lstm")

# Global cache for model
_LSTM_CACHE = {
    "model": None,
    "tokenizer": None,
    "loaded": False
}
_LSTM_LOCK = threading.Lock()

def predict_lstm(text):
    """
    Predict phishing probability using LSTM model
    
    Args:
        text: Email text (subject + body)
        
    Returns:
        float: Probability score (0-1), or 0 if model not available
    """
    try:
        import tensorflow as tf
        from tensorflow.keras.models import load_model
        from tensorflow.keras.preprocessing.sequence import pad_sequences
        import pickle
        import os
        
        # Check cache first
        if _LSTM_CACHE["loaded"]:
             tokenizer = _LSTM_CACHE["tokenizer"]
             model = _LSTM_CACHE["model"]
        else:
            with _LSTM_LOCK:
                if _LSTM_CACHE["loaded"]:
                     tokenizer = _LSTM_CACHE["tokenizer"]
                     model = _LSTM_CACHE["model"]
                else:
                    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
                    model_path = os.path.join(BASE_DIR, "lstm_model.h5")
            tokenizer_path = os.path.join(BASE_DIR, "lstm_tokenizer.pkl")
            
            # Check if model exists
            if not os.path.exists(model_path) or not os.path.exists(tokenizer_path):
                return 0
            
            # Load model and tokenizer
            model = load_model(model_path)
            with open(tokenizer_path, 'rb') as f:
                tokenizer = pickle.load(f)
            
            # Save to cache
            _LSTM_CACHE["tokenizer"] = tokenizer
            _LSTM_CACHE["model"] = model
            _LSTM_CACHE["loaded"] = True
        
        # Tokenize and pad
        sequences = tokenizer.texts_to_sequences([text])
        padded = pad_sequences(sequences, maxlen=200)
        
        # Predict
        prediction = model.predict(padded, verbose=0)
        phishing_prob = float(prediction[0][0])
        
        return phishing_prob
        
    except Exception as e:
        logger.error(f"LSTM prediction error: {e}")
        return 0
