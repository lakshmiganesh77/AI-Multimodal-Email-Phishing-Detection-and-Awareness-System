# PhishGuard Backend Documentation

This directory contains the core logic for the PhishGuard Phishing Detection System.
Below is a detailed summary of each module and its responsibility.

## Core Services

### `main.py`
**Role:** The entry point for the FastAPI application.
- **Key Functions:**
    - `process_single_email(parsed_email)`: The unified pipeline that orchestrates Rules, URL, ML, Image, and Attachment analysis.
    - `POST /analyze`: Endpoint for uploading `.eml` files for manual analysis.
    - `GET /imap/check`: Endpoint to fetch the latest email from configured IMAP inbox (Gmail).
    - `GET /soc/recent`: Endpoint to retrieve recent scan history from the database.
- **Features:**
    - Implements `sanitize_for_json` to prevent API crashes on binary data.
    - Handles database initialization on startup.

### `read_email.py`
**Role:** Parses raw email bytes (RFC822) into a structured Python dictionary.
- **Key Functions:**
    - `extract_email_content(raw_bytes)`: Extracts Headers, Body (Text/HTML), URLs, Images, and Attachments.
    - Handles multipart emails, decodes payloads, and cleans URLs.

### `database.py`
**Role:** Manages SQLite database interactions (`phishguard.db`).
- **Key Functions:**
    - `init_db()`: Creates the `email_scans` table if it doesn't exist.
    - `save_scan(...)`: Saves analysis results.
    - **Deduplication**: Implements a 120-second cooldown to prevent duplicate entries for the same email.

### `decision_engine.py`
**Role:** Aggregates scores from all analyzers to make a final decision (SAFE, SUSPICIOUS, PHISHING).
- **Logic:**
    - Sums scores from Rules, ML, URLs, Images, etc.
    - Adds active Threat Intel checks (VirusTotal/PhishTank).
    - Determines `risk_score` (0-100) and Label based on thresholds.

---

## Analysis Modules

### `rules.py`
**Role:** Heuristic/Rule-based detection engine.
- **Checks:**
    - **Keywords**: Aggressive checks for "verify", "suspend", "login".
    - **Urgency**: Detects "immediate action" language.
    - **Brand Impersonation**: Checks for mismatches like "Amazon" in name but `@gmail.com` sender.
    - **Spoofing**: Detects lookalike domains (typosquatting).
    - **Auth**: Checks SPF/DKIM failure headers.

### `url_analysis.py`
**Role:** Analyzes links found in the email.
- **Checks:**
    - **Threat Intel**: Queries **VirusTotal** and **PhishTank** APIs (Limit: top 3 URLs).
    - **Features**: Detects URL shorteners (`bit.ly`) and young domains (<30 days).

### `ml_predict.py`
**Role:** Machine Learning inference engine.
- **Models:**
    - **Naive Bayes (TF-IDF)**: Primary text classifier.
    - **Random Forest / XGBoost**: Secondary classifiers (if available).
    - **Deep Learning**: LSTM / BERT (optional/experimental).
- **Features:**
    - **Explainability**: Returns "Top Contributing Words" (e.g., "account", "verify") to explain why an email was flagged.
    - **Stability**: Handles missing models gracefully.

### `image_analysis.py`
**Role:** Analyzes embedded images.
- **Techniques:**
    - **OCR (Tesseract)**: Extracts text from images to find hidden phishing keywords.
    - **QR Code Detection**: Uses OpenCV to find and decode QR codes (high risk).

### `attachment_analysis.py`
**Role:** Analyzes file attachments.
- **Checks:**
    - **Extensions**: Flags dangerous types (`.exe`, `.scr`, `.js`, `.py`).
    - **Hashing**: Calculates SHA256 hashes for tracking.
    - **Content**: Scans text attachments for malicious URLs.

---

## Infrastructure

### `imap_client.py`
**Role:** Connects to email providers via IMAP (SSL).
- **Function**: `fetch_latest_email(limit)`
    - Connects to Gmail/Outlook.
    - Fetches raw `.eml` bytes from INBOX and Spam folders.

### `threat_intel.py`
**Role:** Wrapper for external APIs.
- **Services:**
    - `virustotal_url_check(url)`: Checks VirusTotal v3 API.
    - `phishtank_url_check(url)`: Checks PhishTank database.

### `bert_predict.py` & `lstm_predict.py`
**Role:** Wrappers for advanced Deep Learning models.
- **Status**: Loaded only if libraries (`torch`, `tensorflow`) and models files are present.
