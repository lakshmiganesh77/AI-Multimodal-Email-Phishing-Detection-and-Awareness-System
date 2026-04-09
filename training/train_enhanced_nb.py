"""
Train Enhanced Naive Bayes model for phishing email detection
"""
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
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

# Create pipeline
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
    ('clf', MultinomialNB(alpha=0.1))
])

# Train
pipeline.fit(X_train, y_train)

# Evaluate
accuracy = pipeline.score(X_test, y_test)
print(f"Naive Bayes Accuracy: {accuracy:.4f}")

# Save model
joblib.dump(pipeline, "../backend/text_model.joblib")
joblib.dump(pipeline.named_steps['tfidf'], "../backend/vectorizer.joblib")
print("✅ Naive Bayes model saved!")
