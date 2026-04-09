import joblib
import os
import sys
import numpy as np
import threading
from utils.utils import preprocess_email_text

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Lazy Import Predictors
try:
    from lstm_predict import predict_lstm
except ImportError:
    predict_lstm = None

try:
    from bert_predict import predict_bert
except ImportError:
    predict_bert = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Feature Flags
ENABLE_LSTM = os.getenv("ENABLE_LSTM", "True").lower() == "true"
ENABLE_BERT = os.getenv("ENABLE_BERT", "True").lower() == "true"
ENABLE_XGB = os.getenv("ENABLE_XGB", "True").lower() == "true"

# Global Cache for traditional ML models
_ML_CACHE = {
    "vectorizer": None,
    "rf_model": None,
    "xgb_model": None,
    "loaded": False
}
_ML_LOCK = threading.Lock()

def load_ml_models():
    """Load scikit-learn/xgboost models into memory safely once."""
    if _ML_CACHE["loaded"]:
        return _ML_CACHE["vectorizer"], _ML_CACHE["rf_model"], _ML_CACHE["xgb_model"]
        
    with _ML_LOCK:
        # Check again inside the lock
        if _ML_CACHE["loaded"]:
            return _ML_CACHE["vectorizer"], _ML_CACHE["rf_model"], _ML_CACHE["xgb_model"]

        try:
            vec_path = os.path.join(BASE_DIR, "models", "vectorizer.joblib")
            rf_path = os.path.join(BASE_DIR, "models", "rf_model.joblib")
            xgb_path = os.path.join(BASE_DIR, "models", "xgb_model.joblib")
            
            vec = joblib.load(vec_path) if os.path.exists(vec_path) else None
            rf = joblib.load(rf_path) if os.path.exists(rf_path) else None
            xgb = joblib.load(xgb_path) if os.path.exists(xgb_path) else None
            
            _ML_CACHE["vectorizer"] = vec
            _ML_CACHE["rf_model"] = rf
            _ML_CACHE["xgb_model"] = xgb
            _ML_CACHE["loaded"] = True
            
            return vec, rf, xgb
        except Exception as e:
            print(f"Error loading traditional ML models: {e}")
            return None, None, None

def ml_score_with_explanation(email_data):
    """
    Layer 5: NLP Ensemble Engine
    Combines BERT (0.7) and LSTM (0.3) predictions.
    Input: Subject + Body + OCR Text + Attachment Text
    """
    
    # 1. CONSTRUCT MULTIMODAL TEXT
    # Priority: body -> body_text
    body = email_data.get("body", "") or email_data.get("body_text", "")
    subject = email_data.get("subject", "") or email_data.get("headers", {}).get("subject", "")
    
    # Extra extracted text (from Layer 3 and 4)
    extra_text = email_data.get("extra_text", "")
    
    # Combined Context
    full_text = f"{subject} {body} {extra_text}"
    
    # Preprocess
    clean_text = preprocess_email_text(subject, body + " " + extra_text)
    
    # --- BERT DILUTION DEFENSE (ANOMALY LENGTH TRUNCATION) ---
    # If the email is excessively long (often used to dilute BERT's 512 token limit with legitimate text),
    # we filter out the fluff and extract the highest-risk sentences for ML analysis.
    core_text = clean_text
    if len(clean_text) > 1500:
        import re
        # Keywords that typically carry the "payload" or "intent" in a phishing email
        risk_keywords = ["urgent", "verify", "account", "login", "password", "bank", "payment", "invoice", "bitcoin", "crypto", "http", "www", "click", "suspend"]
        sentences = re.split(r'(?<=[.!?]) +', clean_text)
        
        suspicious_sentences = []
        for i, sentence in enumerate(sentences):
            if any(kw in sentence.lower() for kw in risk_keywords):
                # Keep the risk sentence and the contiguous context
                if i > 0: suspicious_sentences.append(sentences[i-1])
                suspicious_sentences.append(sentence)
                if i + 1 < len(sentences): suspicious_sentences.append(sentences[i+1])
                    
        if suspicious_sentences:
            # Remove dupes while preserving order
            core_text = " ".join(list(dict.fromkeys(suspicious_sentences))) 
            core_text = core_text[:2500] # Safe upper limit
        else:
            # If no obvious keywords found in a huge block, take intro and conclusion.
            core_text = " ".join(sentences[:5] + sentences[-5:])
            
    clean_text = core_text # Override the text passed to BERT/LSTM
    
    if not clean_text or len(clean_text) < 5:
        return {
            "score": 0.0,
            "confidence": 0.0,
            "features": {"bert_prob": 0.0, "lstm_prob": 0.0, "ensemble_prob": 0.0},
            "reasons": []
        }

    # 2. GET PREDICTIONS
    bert_prob = 0.0
    lstm_prob = 0.0
    rf_prob = 0.0
    xgb_prob = 0.0
    
    # Text Analysis (Deep Learning)
    if ENABLE_BERT and predict_bert:
        try:
            bert_prob = predict_bert(clean_text)
        except Exception as e:
            print(f"BERT Prediction Error: {e}")

    if ENABLE_LSTM and predict_lstm:
        try:
            lstm_prob = predict_lstm(clean_text)
        except Exception as e:
            print(f"LSTM Prediction Error: {e}")

    # Text Analysis (Traditional ML)
    vectorizer, rf_model, xgb_model = load_ml_models()
    
    if vectorizer:
        try:
            # Transform text into TF-IDF vector
            x_vec = vectorizer.transform([clean_text])
            
            if rf_model:
                rf_prob = rf_model.predict_proba(x_vec)[0][1] # Get probability for class 1 (phishing)
                
            if ENABLE_XGB and xgb_model:
                xgb_prob = xgb_model.predict_proba(x_vec)[0][1] # Get probability for class 1
                
        except Exception as e:
            print(f"Traditional ML Prediction Error: {e}")

    # 3. UNIFIED ENSEMBLE LOGIC
    # Combining models based on confidence and complexity. 
    # BERT = 40%, LSTM = 20%, XGBoost = 20%, Random Forest = 20%
    probs = [
        ('bert', bert_prob, 0.40),
        ('lstm', lstm_prob, 0.20),
        ('xgb', xgb_prob, 0.20),
        ('rf', rf_prob, 0.20)
    ]
    
    available_probs = [p for p in probs if p[1] > 0]
    total_weight = sum([p[2] for p in available_probs])
    
    ensemble_prob = 0.0
    confidence = 0.0
    
    if total_weight > 0:
        # Normalize weights based on available models
        for name, prob, weight in available_probs:
            normalized_weight = weight / total_weight
            ensemble_prob += prob * normalized_weight
            
        # Confidence scales with how many models contributed
        confidence = 0.5 + (0.1 * len(available_probs))
        confidence = min(confidence, 0.95)

    score = ensemble_prob * 100
    reasons = []
    
    if score > 0:
        reasons.append(f"🤖 AI Confidence Score: {score:.1f}%")
    
    return {
        "score": float(score),
        "confidence": float(confidence),
        "features": {
            "bert_prob": float(bert_prob),
            "lstm_prob": float(lstm_prob),
            "xgb_prob": float(xgb_prob),
            "rf_prob": float(rf_prob),
            "ensemble_prob": float(ensemble_prob)
        },
        "reasons": reasons
    }
