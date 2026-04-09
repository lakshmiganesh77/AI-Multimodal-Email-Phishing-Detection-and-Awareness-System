# AI Multimodal Email Phishing Detection and Awareness System

![Python Version](https://img.shields.io/badge/python-3.9%2B-blue)
![React Version](https://img.shields.io/badge/react-18-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95%2B-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

## Overview

The **AI Multimodal Email Phishing Detection and Awareness System** (PhishGuard) is a comprehensive, enterprise-grade solution designed to identify and mitigate modern evolving phishing threats. Unlike traditional heuristic systems, PhishGuard leverages multimodal machine learning and external threat intelligence to analyze an email's text intent, URL reputation, and attachments simultaneously.

The project features a dual-interface architecture:
- **User Inbox Interface:** An intuitive layout to educate end-users via visual indicators and explainable AI alerts.
- **SOC Dashboard:** A dedicated Security Operations Center administrative portal for centralized monitoring and threat metrics.

## Key Features

- **Multimodal AI Analysis:** Evaluates Natural Language Processing (NLP) cues along with URL/Attachment metadata using Random Forest models.
- **Asynchronous Processing Architecture:** Ensures non-blocking UI interactions using FastAPI, Redis, and Celery for deep backend analysis.
- **Real-Time Threat Intelligence:** Integrates with the VirusTotal API to track zero-day threats globally.
- **Dual React Interfaces:** Distinct frontend views for both common users (promoting awareness) and security admins (metrics and management).
- **Persistent Storage:** Utilizes PostgreSQL orchestrated by SQLAlchemy.

## Technology Stack

### Backend
- **Framework:** Python 3.9+, FastAPI, Uvicorn
- **AI/ML/Tasks:** Scikit-Learn (Random Forest, NLP), Celery
- **Message Broker:** Redis 7 (via Docker)
- **Database:** PostgreSQL 15 (via Docker)

### Frontend
- **Technologies:** React.js, Vite, Node.js 18+
- **Interfaces:** Generic Inbox Client & SOC Dashboard

## System Architecture

1. **API Gateway:** User requests flow into the FastAPI backend.
2. **Task Queue:** Intensive AI analysis and API calls are offloaded to the Redis message broker and picked up by Celery workers.
3. **Verdict Generation:** Multimodal analysis aggregates isolated risk scores (from text, URLs, etc.) into a cohesive "Safe", "Suspicious", or "Phishing" verdict.
4. **Data Persistence:** Threat analytics are stored within the PostgreSQL database to populate the SOC Dashboard.

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker & Docker Compose
- Git

### Local Environment
For a detailed guide on setting the project up locally on your machine, please see the local setup documentation:
[Local Setup Instructions](LOCAL_SETUP.md)

### Cloud Deployment
For instructions on taking the project to a cloud environment:
[Cloud Deployment Guide](CLOUD_DEPLOYMENT.md)

## Repository Structure

- `/backend`: Core Python FastAPI server, AI/ML inference logic, and Celery workers.
- `/frontend`: User Inbox React application (Promotes User Awareness).
- `/soc-dashboard`: Administrator React application for organization-wide metrics and threat tracking.
- `/training`: Scripts and notebooks for model training and data preprocessing.
- `/scripts`: Utility scripts used throughout the pipeline.
- `/ieee_graphs`: Diagrams and charts detailing architecture performance.

## License

This project is intended for final-year academic purpose and is organized according to general non-commercial guidelines.