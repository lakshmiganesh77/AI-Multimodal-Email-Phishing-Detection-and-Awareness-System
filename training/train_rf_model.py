"""
Train Random Forest model for phishing email detection
"""
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Load dataset
df = pd.read_csv("../Phishing_Email.csv")

# Clean data
df = df.rename(columns={'Email Text': 'text', 'Email Type': 'label'})
df['text'] = df['text'].fillna('').str.lower().str.strip()
df = df[df['text'].str.len() > 5]

# Map labels
label_map = {'Safe Email': 0, 'Phishing Email': 1}
df['label'] = df['label'].map(label_map)

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    df['text'], df['label'], test_size=0.2, random_state=42
)

# Vectorize
vectorizer = TfidfVectorizer(max_features=3000, ngram_range=(1, 2))
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# Train Random Forest
model = RandomForestClassifier(n_estimators=100, max_depth=20, random_state=42)
model.fit(X_train_vec, y_train)

# Evaluate
accuracy = model.score(X_test_vec, y_test)
print(f"Random Forest Accuracy: {accuracy:.4f}")

# Save model
joblib.dump(model, "../backend/rf_model.joblib")
joblib.dump(vectorizer, "../backend/rf_vectorizer.joblib")
print("✅ Random Forest model saved!")
