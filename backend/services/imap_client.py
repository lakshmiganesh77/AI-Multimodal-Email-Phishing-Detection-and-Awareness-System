import imaplib
import os
from dotenv import load_dotenv

load_dotenv()

IMAP_HOST = os.getenv("IMAP_HOST")
IMAP_USER = os.getenv("IMAP_USER")
IMAP_PASS = os.getenv("IMAP_PASS")

FOLDERS = ["INBOX", "[Gmail]/Spam"]

def fetch_latest_email(limit=1):
    mail = imaplib.IMAP4_SSL(IMAP_HOST, timeout=10)
    mail.login(IMAP_USER, IMAP_PASS)

    emails = []

    try:
        for folder in FOLDERS:
            try:
                mail.select(folder, readonly=True)
                status, messages = mail.search(None, "ALL")
                ids = messages[0].split()

                if ids:
                    for eid in ids[-limit:]:
                        _, msg_data = mail.fetch(eid, "(RFC822)")
                        raw_email = msg_data[0][1]
                        emails.append({
                            "folder": folder,
                            "raw": raw_email
                        })
            except imaplib.IMAP4.error:
                print(f"Failed to select folder: {folder}")
                continue
    finally:
        try:
            mail.logout()
        except:
            pass

    return emails
