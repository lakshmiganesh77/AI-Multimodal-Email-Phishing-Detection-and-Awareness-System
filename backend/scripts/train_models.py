import os
import sys
import pandas as pd
import joblib
import re
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

# Constants
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
os.makedirs(MODEL_DIR, exist_ok=True)

def clean_text(text):
    """Normalize text for ML training"""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'http\S+', 'url_placeholder', text)
    text = re.sub(r'\S+@\S+', 'email_placeholder', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    return text

def train_models():
    # Check for both casings
    dataset_path = os.path.join(DATA_DIR, "phishing_email.csv")
    if not os.path.exists(dataset_path) and os.path.exists(os.path.join(DATA_DIR, "Phishing_Email.csv")):
        dataset_path = os.path.join(DATA_DIR, "Phishing_Email.csv")
        
    print(f"Loading dataset from {dataset_path}...")
    
    if not os.path.exists(dataset_path):
        print(f"❌ Error: Dataset not found at {dataset_path}")
        print("Please place 'phishing_email.csv' or 'Phishing_Email.csv' in the backend directory.")
        return

    try:
        df = pd.read_csv(dataset_path)
        print(f"Loaded {len(df)} rows.")
        
        # Expect columns: 'text', 'label' (or similar)
        # Adapt if needed based on actual CSV structure
        if 'text' not in df.columns or 'label' not in df.columns:
             # Try common alternatives
             if 'Email Text' in df.columns: df.rename(columns={'Email Text': 'text'}, inplace=True)
             if 'Email Type' in df.columns: df.rename(columns={'Email Type': 'label'}, inplace=True)
        
        # Encode Labels
        # Assuming Safe/Phishing -> 0/1
        df['label'] = df['label'].map({'Safe Email': 0, 'Phishing Email': 1, 'Safe': 0, 'Phishing': 1})
        # If mapping didn't work (maybe already 0/1), fillna
        df['label'] = df['label'].fillna(0).astype(int)
        
        df['clean_text'] = df['text'].apply(clean_text)
        
        X = df['clean_text']
        y = df['label']
        
        # Calculate class weights for XGBoost
        num_safe = len(y[y == 0])
        num_phish = len(y[y == 1])
        scale_pos_weight = num_safe / max(num_phish, 1) # Prevent division by zero
        print(f"Class Distribution -> Safe: {num_safe}, Phishing: {num_phish}, Ratio: {scale_pos_weight:.2f}")
        
        print("Splitting data...")
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print("Vectorizing...")
        vectorizer = TfidfVectorizer(max_features=5000)
        X_train_vec = vectorizer.fit_transform(X_train)
        X_test_vec = vectorizer.transform(X_test)
        
        # Save vectorizer
        joblib.dump(vectorizer, os.path.join(MODEL_DIR, "vectorizer.joblib"))
        print("Saved vectorizer.joblib")
        
        # Train RandomForest
        print("Training RandomForest...")
        rf = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
        rf.fit(X_train_vec, y_train)
        rf_pred = rf.predict(X_test_vec)
        print("--- RandomForest Results ---")
        print(classification_report(y_test, rf_pred))
        print("Confusion Matrix:\n", confusion_matrix(y_test, rf_pred))
        joblib.dump(rf, os.path.join(MODEL_DIR, "rf_model.joblib"))
        
        # Train XGBoost
        print("Training XGBoost...")
        xgb = XGBClassifier(use_label_encoder=False, eval_metric='logloss', scale_pos_weight=scale_pos_weight)
        xgb.fit(X_train_vec, y_train)
        xgb_pred = xgb.predict(X_test_vec)
        print("\n--- XGBoost Results ---")
        print(classification_report(y_test, xgb_pred))
        print("Confusion Matrix:\n", confusion_matrix(y_test, xgb_pred))
        joblib.dump(xgb, os.path.join(MODEL_DIR, "xgb_model.joblib"))
        
        print("\n Training Complete! Models updated in backend/ folder.")
        
    except Exception as e:
        print(f"❌ Training Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    train_models()

