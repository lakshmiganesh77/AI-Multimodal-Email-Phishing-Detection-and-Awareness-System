import joblib
import os
import numpy as np

# Global cache
_META_MODEL = None

def load_meta_model():
    global _META_MODEL
    if _META_MODEL:
        return _META_MODEL
    
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, "models", "meta_model.joblib")
        
        if os.path.exists(model_path):
            _META_MODEL = joblib.load(model_path)
            return _META_MODEL
        else:
            return None
    except Exception as e:
        print(f"Error loading Meta Model: {e}")
        return None

def predict_meta(features):
    """
    Predicts phishing probability using the Meta Model (XGBoost).
    
    Args:
        features (list): Feature vector from feature_extractor.py
        
    Returns:
        float: Probability of phishing (0.0 to 1.0)
               Returns -1 if model is not available (fallback to rules).
    """
    model = load_meta_model()
    
    if not model:
        return -1.0
        
    try:
        # Reshape for single prediction
        vector = np.array(features).reshape(1, -1)
        prob = model.predict_proba(vector)[0][1]
        return float(prob)
    except Exception as e:
        print(f"Meta Model Prediction Error: {e}")
        return -1.0
