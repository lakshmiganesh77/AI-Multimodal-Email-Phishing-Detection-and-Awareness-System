import pandas as pd
import numpy as np
import joblib
import os
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, classification_report, confusion_matrix

# Configuration
DATA_FILE = "training_data.csv"
MODEL_FILE = "meta_model.joblib"

def train_meta_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "..", "data", DATA_FILE)
    model_path = os.path.join(base_dir, "..", "models", MODEL_FILE)
    os.makedirs(os.path.join(base_dir, "..", "models"), exist_ok=True)
    
    if not os.path.exists(data_path):
        print(f"Error: Data file {DATA_FILE} not found.")
        print("Please run some scans first to generate training data.")
        return

    print(f"Loading data from {DATA_FILE}...")
    try:
        df = pd.read_csv(data_path)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    # Check if we have enough data
    if len(df) < 10:
        print("Not enough data to train. Need at least 10 samples.")
        return

    # Prepare specific feature columns (must match feature_extractor.py)
    feature_cols = [
        "auth_spf_pass", "auth_dkim_pass", "auth_dmarc_pass", "is_homograph", "reply_to_mismatch",
        "num_urls", "shortened_count", "young_domains", "brand_similarity_score", "has_malicious_url", "url_score",
        "intent_urgency", "intent_financial", "intent_credential", "rule_score",
        "html_forms", "html_iframes", "zw_count",
        "num_attachments", "has_exec", "entropy_avg", "pdf_js_detected", "att_score",
        "has_qr", "has_img_ocr", "img_score",
        "is_first_time_sender",
        "bert_prob", "lstm_prob", "ml_prob"
    ]
    
    # Target variable (0 = Safe, 1 = Phishing)
    # We assume 'label' column exists with "PHISHING"/"SAFE"
    if "label" not in df.columns:
        print("Error: 'label' column missing in training data.")
        return
        
    df["target"] = df["label"].apply(lambda x: 1 if x == "PHISHING" else 0)
    
    X = df[feature_cols]
    y = df["target"]
    
    print(f"Training on {len(df)} samples...")
    
    # Simple Train/Test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize XGBoost
    model = XGBClassifier(
        n_estimators=100,
        max_depth=3,
        learning_rate=0.1,
        use_label_encoder=False,
        eval_metric="logloss"
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    
    print(f"Results: Accuracy={acc:.2f}, Precision={prec:.2f}, Recall={rec:.2f}")
    print("\n--- Detailed Classification Report ---")
    print(classification_report(y_test, y_pred, zero_division=0))
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))
    
    # Save model
    joblib.dump(model, model_path)
    print(f"Model saved to {MODEL_FILE}")

if __name__ == "__main__":
    train_meta_model()
