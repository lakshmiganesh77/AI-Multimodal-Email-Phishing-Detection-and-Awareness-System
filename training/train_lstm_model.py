"""
Train LSTM model for phishing email detection
"""
import pandas as pd
import pickle
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
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

# Tokenize
tokenizer = Tokenizer(num_words=5000, oov_token="<OOV>")
tokenizer.fit_on_texts(X_train)

X_train_seq = tokenizer.texts_to_sequences(X_train)
X_test_seq = tokenizer.texts_to_sequences(X_test)

# Pad sequences
max_length = 200
X_train_pad = pad_sequences(X_train_seq, maxlen=max_length, padding='post', truncating='post')
X_test_pad = pad_sequences(X_test_seq, maxlen=max_length, padding='post', truncating='post')

# Build LSTM model
model = Sequential([
    Embedding(input_dim=5000, output_dim=128, input_length=max_length),
    LSTM(64, return_sequences=True),
    Dropout(0.3),
    LSTM(32),
    Dropout(0.3),
    Dense(16, activation='relu'),
    Dense(1, activation='sigmoid')
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# Train
history = model.fit(
    X_train_pad, y_train,
    epochs=5,
    batch_size=32,
    validation_data=(X_test_pad, y_test),
    verbose=1
)

# Evaluate
loss, accuracy = model.evaluate(X_test_pad, y_test, verbose=0)
print(f"LSTM Accuracy: {accuracy:.4f}")

# Save model
model.save("../backend/lstm_model.h5")
with open("../backend/lstm_tokenizer.pkl", 'wb') as f:
    pickle.dump(tokenizer, f)
print("✅ LSTM model saved!")
