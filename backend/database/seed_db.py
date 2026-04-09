import sqlite3
import os
from datetime import datetime, timedelta

DB_NAME = os.path.join(os.path.dirname(os.path.abspath(__file__)), "phishguard.db")

def seed_data():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    
    # Clear existing data to avoid duplicates during testing
    cur.execute("DELETE FROM email_scans")
    
    samples = [
        {
            "sender": "Amazon Security <security@amazon-support-verify.com>",
            "subject": "Urgent: Your account will be locked",
            "body": "Click here to verify your identity immediately or lose access.",
            "label": "PHISHING",
            "risk_score": 95,
            "reasons": "Urgency, Suspicious Link, Brand Impersonation",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "sender": "CEO <ceo@company-internal-mail.com>",
            "subject": "Wire Transfer Request",
            "body": "Can you process this payment urgently? I am in a meeting.",
            "label": "PHISHING",
            "risk_score": 88,
            "reasons": "CEO Fraud, Urgency, Unusual Request",
            "created_at": (datetime.utcnow() - timedelta(minutes=10)).isoformat()
        },
        {
            "sender": "newsletter@tech-daily.com",
            "subject": "Your Daily Tech News",
            "body": "Here are the top stories for today...",
            "label": "SAFE",
            "risk_score": 5,
            "reasons": "Known Sender, No Malicious Links",
            "created_at": (datetime.utcnow() - timedelta(hours=1)).isoformat()
        },
        {
            "sender": "alert@bank-notification.com",
            "subject": "Suspicious Login Attempt",
            "body": "We detected a login from a new device. Was this you?",
            "label": "SUSPICIOUS",
            "risk_score": 65,
            "reasons": "Generic Greeting, mismatched domain",
            "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat()
        },
        {
            "sender": "hr@company.com",
            "subject": "Open Enrollment Begins",
            "body": "Please log in to the portal to choose your benefits.",
            "label": "SAFE",
            "risk_score": 0,
            "reasons": "Internal Sender, Safe Links",
            "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat()
        }
    ]
    
    print(f"Seeding {len(samples)} emails...")
    
    for email in samples:
        cur.execute("""
            INSERT INTO email_scans 
            (sender, subject, body, label, risk_score, reasons, created_at, content_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            email["sender"], 
            email["subject"], 
            email["body"], 
            email["label"], 
            email["risk_score"], 
            email["reasons"], 
            email["created_at"],
            "hash_" + str(datetime.now().timestamp()) # Dummy hash
        ))
        
    conn.commit()
    conn.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_data()
