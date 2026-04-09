"""
Train XGBoost model for phishing email detection
"""
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split

import os
# Load dataset
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "..", "Phishing_Email.csv")
df = pd.read_csv(CSV_PATH)

# Clean data
df = df.rename(columns={'Email Text': 'text', 'Email Type': 'label'})

# Use unified preprocessing from backend
try:
    import sys
    import os
    # Add backend to path
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
    from utils import preprocess_email_text

    # Apply to dataframe
    df['text'] = df['text'].astype(str).apply(lambda x: preprocess_email_text("", x))
except ImportError:
    print("Warning: Could not import backend.utils, using fallback simple cleaning")
    df['text'] = df['text'].fillna('').str.lower().str.strip()

df = df[df['text'].str.len() > 5]

# Map labels to integers
label_map = {'Safe Email': 0, 'Phishing Email': 1}
df['label'] = df['label'].map(label_map)

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    df['text'], df['label'], test_size=0.2, random_state=42
)

# Vectorize (Optimized for Memory)
# REDUCED features to avoid Memory Error on user machine
vectorizer = TfidfVectorizer(max_features=1000, ngram_range=(1, 1)) 
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# Train XGBoost
# REDUCED complexity to avoid Memory Error
model = XGBClassifier(
    n_estimators=50, 
    max_depth=3, 
    learning_rate=0.1, 
    random_state=42,
    use_label_encoder=False,
    eval_metric='logloss'
)
model.fit(X_train_vec, y_train)

# Evaluate
accuracy = model.score(X_test_vec, y_test)
print(f"XGBoost Accuracy: {accuracy:.4f}")

# Save model
# Save model
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "backend")
joblib.dump(model, os.path.join(OUTPUT_DIR, "xgb_model.joblib"))
joblib.dump(vectorizer, os.path.join(OUTPUT_DIR, "xgb_vectorizer.joblib"))
print(f"✅ XGBoost model saved to {OUTPUT_DIR}")
