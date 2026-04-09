"""
Train BERT model for phishing email detection
"""
import pandas as pd
import torch
from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split
from torch.utils.data import Dataset

import os
# Load dataset
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "..", "Phishing_Email.csv")
df = pd.read_csv(CSV_PATH)

# Clean data
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
    # We treat 'text' as both subject and body since CSV structure is simple
    df['text'] = df['text'].astype(str).apply(lambda x: preprocess_email_text("", x))
except ImportError:
    print("Warning: Could not import backend.utils, using fallback simple cleaning")
    df['text'] = df['text'].fillna('').str.lower().str.strip()

df = df[df['text'].str.len() > 5]

# Map labels
label_map = {'Safe Email': 0, 'Phishing Email': 1}
df['label'] = df['label'].map(label_map)

# Split data
train_texts, test_texts, train_labels, test_labels = train_test_split(
    df['text'].tolist(), df['label'].tolist(), test_size=0.2, random_state=42
)

# Custom Dataset
class PhishingDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

# Load tokenizer and model
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2)

# Create datasets
train_dataset = PhishingDataset(train_texts, train_labels, tokenizer)
test_dataset = PhishingDataset(test_texts, test_labels, tokenizer)

# Training arguments
# Training arguments
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "backend", "bert_phishing_model")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3, # Increased from 1 to 3 for better convergence
    per_device_train_batch_size=4,
    per_device_eval_batch_size=4,
    gradient_accumulation_steps=2,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir='./logs',
    logging_steps=100,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True
)

# Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset
)

# Train
trainer.train()

# Save model
# Save model
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "backend", "bert_phishing_model")
model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
print(f"✅ BERT model saved to {OUTPUT_DIR}!")
