# PhishGuard System Architecture

This document contains all the primary architecture, UML, and sequence diagrams tailored exactly to the PhishGuard codebase. 

---

## 1. System Context Diagram
Illustrates how the system communicates with the outside world, including end users, internal SOC admins, email servers, and threat intelligence feeds.

```mermaid
graph TD
    %% External Entities
    User[End User / General Employee]
    Admin[SOC Analyst / Admin]
    IMAP[IMAP Server / MS Exchange / Gmail]
    VT[VirusTotal API]

    %% Main System
    subgraph PhishGuard Core System
        Frontend[React User Extension / Standard Frontend]
        SOC[React SOC Dashboard]
        Backend[FastAPI Backend Server]
    end

    %% Relationships
    User -->|Uploads .eml / Views Results| Frontend
    Admin -->|Manages Alerts / Reviews Emails| SOC
    Frontend <-->|REST API / WebSocket| Backend
    SOC <-->|REST API / WebSocket| Backend
    Backend <--|Fetch Latest Emails via IMAP| IMAP
    Backend -->|Check URL/File Hashes| VT
```

## 2. High-Level Backend Component Architecture
Breaks down the FastAPI backend directory structure and its connection to the database and ML models.

```mermaid
graph LR
    %% Data Stores
    DB[(PostgreSQL DB)]
    Redis[(Celery Redis Broker)]

    %% Backend Components
    subgraph FastAPI Backend App
        Router[API Routers]
        DBM[Database ORM: models.py]
        
        subgraph Intelligence Pipeline
            Parser[Email Parser]
            Rules[Rule-Based Engine]
            URL[External Scanners]
            ML_Engine[ML Predictor]
            Decision[Decision Engine]
        end
    end

    %% External ML
    subgraph Machine Learning Ensemble
        BERT[BERT NLP Model]
        RF[Random Forest]
    end

    Router --> Parser
    Parser --> Rules
    Parser --> URL
    Parser --> ML_Engine
    
    ML_Engine --> BERT
    ML_Engine --> RF
    
    Rules --> Decision
    URL --> Decision
    ML_Engine --> Decision
    
    Decision --> DBM
    DBM <--> DB
    Router -.->|Background Tasks| Redis
```

## 3. Data Flow Diagram (DFD) - Analysis Engine
Shows how incoming bytes transform into a scored database record.

```mermaid
flowchart TD
    A[Raw Email Input: .eml bytes] --> B{extract_email_content}
    B -->|Subject & Cleansed Text| C[Text Preprocessing]
    B -->|URLs & Found QR Links| D[URL Analysis Engine]
    B -->|Base64/Raw Attachments| E[Attachment Analysis]
    
    C --> F[Rule Engine]
    C --> G[ML Predictor]
    
    D -->|VT lookups| H[Decision Engine: aggregate_features]
    E -->|VT format matching| H
    F -->|Behavioral Scores| H
    G -->|Model Probabilities| H
    
    H --> I{Zero-Trust Matrix Rules}
    I -->|Weighted Formula Calculation| J[Final Label Output: SAFE, SUSPICIOUS, PHISHING]
    
    J --> K[(Save EmailScan to DB)]
    K --> L[Broadcast Alert via WebSocket]
```
