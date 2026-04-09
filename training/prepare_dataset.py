import os
import pandas as pd
from email import policy
from email.parser import BytesParser

def extract_email_text(eml_path):
    """Extract text from .eml file"""
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

# Create directories if they don't exist
os.makedirs('legitimate', exist_ok=True)
os.makedirs('phishing', exist_ok=True)

# Collect legitimate emails
legitimate_emails = []
if os.path.exists('legitimate'):
    for file in os.listdir('legitimate'):
        if file.endswith('.eml'):
            try:
                text = extract_email_text(f'legitimate/{file}')
                legitimate_emails.append({'text': text, 'label': 'Safe Email'})
            except Exception as e:
                print(f"Error processing {file}: {e}")

# Collect phishing emails
phishing_emails = []
if os.path.exists('phishing'):
    for file in os.listdir('phishing'):
        if file.endswith('.eml'):
            try:
                text = extract_email_text(f'phishing/{file}')
                phishing_emails.append({'text': text, 'label': 'Phishing Email'})
            except Exception as e:
                print(f"Error processing {file}: {e}")

# Create DataFrame
if legitimate_emails or phishing_emails:
    df = pd.DataFrame(legitimate_emails + phishing_emails)
    df.to_csv('custom_dataset.csv', index=False)
    print(f"✅ Created dataset with {len(df)} emails")
    print(f"   - Legitimate: {len(legitimate_emails)}")
    print(f"   - Phishing: {len(phishing_emails)}")
else:
    print("⚠️  No .eml files found in legitimate/ or phishing/ folders")
    print("   Please add email samples and run again")
