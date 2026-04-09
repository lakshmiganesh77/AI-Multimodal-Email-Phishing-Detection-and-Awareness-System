# ML Model Retraining Guide

This guide explains how to retrain the phishing detection ML models with your own email samples to improve accuracy and reduce false positives.

## Why Retrain?

The current models were trained on a general phishing dataset. They may:
- Flag legitimate bank emails as phishing
- Miss new phishing techniques
- Not understand your specific email patterns

Retraining with your emails improves accuracy for your use case.

## Prerequisites

1. **Collect Email Samples** (at least 100 of each):
   - Legitimate emails (bank statements, newsletters, work emails)
   - Phishing emails (spam, scams, suspicious emails)

2. **Save as .eml files**:
   - In Gmail: Open email → Three dots → Download message
   - In Outlook: Drag email to desktop
   - Save to folders: `training/legitimate/` and `training/phishing/`

## Step 1: Prepare Training Data

Create a CSV file with your emails:

```bash
cd training
python prepare_dataset.py
```

This script will:
- Read all .eml files from `legitimate/` and `phishing/` folders
- Extract text from emails
- Create `custom_dataset.csv` with columns: `text`, `label`

## Step 2: Retrain Models

### Naive Bayes (Fastest, Good Baseline)
```bash
python train_enhanced_nb.py --dataset custom_dataset.csv
```

### Random Forest (Better Accuracy)
```bash
python train_rf_model.py --dataset custom_dataset.csv
```

### XGBoost (Best Traditional ML)
```bash
python train_xgb_model.py --dataset custom_dataset.csv
```

### LSTM (Deep Learning, Slower)
```bash
python train_lstm_model.py --dataset custom_dataset.csv --epochs 10
```

### BERT (Best Accuracy, Very Slow)
```bash
python train_bert_model.py --dataset custom_dataset.csv --epochs 3
```

## Step 3: Verify Models

Test the retrained models:

```bash
cd backend
python -c "from ml_predict import ml_score_with_explanation; print(ml_score_with_explanation({'body': 'Your test email text here', 'subject': 'Test'}))"
```

## Tips for Better Results

### 1. Balanced Dataset
- Equal number of phishing and legitimate emails
- If imbalanced, models will be biased

### 2. Diverse Examples
- Include various types of legitimate emails (banks, work, personal)
- Include various phishing techniques (urgency, impersonation, links)

### 3. Clean Data
- Remove duplicates
- Ensure labels are correct
- Include full email body + subject

### 4. Incremental Training
- Start with 100 emails of each type
- Add more samples over time
- Retrain monthly as you collect more emails

## Troubleshooting

**Problem**: Models still flag legitimate emails as phishing
- **Solution**: Add more legitimate email samples, especially from that sender

**Problem**: Models miss obvious phishing
- **Solution**: Add more phishing examples with similar patterns

**Problem**: Training takes too long
- **Solution**: Start with Naive Bayes and Random Forest only. Skip BERT/LSTM initially.

**Problem**: Out of memory errors
- **Solution**: Reduce dataset size or use smaller models (NB, RF, XGBoost)

## Quick Start Script

Create `training/prepare_dataset.py`:

\`\`\`python
import os
import pandas as pd
from email import policy
from email.parser import BytesParser

def extract_email_text(eml_path):
    with open(eml_path, 'rb') as f:
        msg = BytesParser(policy=policy.default).parsebytes(f.read())
    
    subject = msg.get('Subject', '')
    body = ''
    
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == 'text/plain':
                body += part.get_content()
    else:
        body = msg.get_content()
    
    return f"{subject} {body}".strip()

# Collect legitimate emails
legitimate_emails = []
for file in os.listdir('legitimate'):
    if file.endswith('.eml'):
        text = extract_email_text(f'legitimate/{file}')
        legitimate_emails.append({'text': text, 'label': 'Safe Email'})

# Collect phishing emails
phishing_emails = []
for file in os.listdir('phishing'):
    if file.endswith('.eml'):
        text = extract_email_text(f'phishing/{file}')
        phishing_emails.append({'text': text, 'label': 'Phishing Email'})

# Create DataFrame
df = pd.DataFrame(legitimate_emails + phishing_emails)
df.to_csv('custom_dataset.csv', index=False)
print(f"✅ Created dataset with {len(df)} emails")
print(f"   - Legitimate: {len(legitimate_emails)}")
print(f"   - Phishing: {len(phishing_emails)}")
\`\`\`

## Next Steps

After retraining:
1. Test with known emails to verify accuracy
2. Monitor false positives/negatives
3. Collect more samples and retrain monthly
4. Consider adding domain-specific rules in `rules.py`
