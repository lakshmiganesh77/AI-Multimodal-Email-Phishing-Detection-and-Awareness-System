# PhishGuard Folder Structure & File Architecture

This document outlines the core directory structure of the AI-Multimodal-Email-Phishing-Detection-and-Awareness-System, providing a clear map of what each module does.

## Root Directory (`/`)
- `README.md` - Primary project documentation.
- `SYSTEM_ARCHITECTURE.md` - High-level system design and Mermaid diagrams.
- `LOCAL_SETUP.md` & `CLOUD_DEPLOYMENT.md` - Setup manuals.
- `docker-compose.yml` - Container orchestration for backend, PostgreSQL, and Redis.
- `push_to_github.bat` - Utility batch script for deployment syncing.
- `.gitignore` - Security definitions for ignoring models, datasets, and `.env` credentials.

---

## 1. `/backend` (FastAPI Server)
Contains all Python logic, API routing, and AI integration.
- `/core` - Application configuration, database connections, and celery initialization.
- `/routers` - FastAPI endpoints (e.g., `/analyze`, `/soc`).
- `/ml` - Machine learning integration, model loading (BERT, Random Forest).
- `/services` - Business logic (external VirusTotal API calls, email parsing).
- `models.py` - SQLAlchemy database schemas.
- `requirements.txt` - Python backend dependencies.

## 2. `/frontend` (User Inbox UI)
The React/Vite web application intended for the general employee.
- `/src/components` - Reusable UI elements (Buttons, Modal Alerts).
- `/src/pages` - Main views (Inbox, Email Reader).
- `/src/api` - Axios configurations to communicate with the FastAPI backend.
- `package.json` - Node dependencies.

## 3. `/soc-dashboard` (Administrator UI)
The React-based Dashboard for Security Operations Center analysts.
- `/src/components/charts` - Analytics diagrams showing aggregated threat data.
- `/src/pages` - Threat feed, Quarantine management.

## 4. `/training` (Data Science Notebooks)
Used for data engineering and model training. *Note: Heavy datasets and trained `.safetensors` files here are ignored by Git.*
- `preprocess.py` - Scripts to clean raw Enron/Phishing datasets.
- `train_rf.ipynb` - Random forest training notebook.
- `train_bert.ipynb` - NLP model architecture notebook.

## 5. `/scripts` (Utilities)
- `init_db.py` - Database seeding and reset scripts.
- `simulate_traffic.py` - Script to generate fake incoming emails for stress testing.

## 6. `/ieee_graphs`
Stored output evaluation graphs such as ROC curves, Confusion Matrices, and Architecture diagrams generated for papers.
