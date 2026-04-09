# Tools and Technology Stack

This document details the complete technology stack, frameworks, and external tools used in the development and execution of the **AI Multimodal Email Phishing Detection** system.

---

## 1. Programming Languages
- **Python 3.9+**: Primary language for the backend, core logic, machine learning inferences, and async tasks.
- **JavaScript / TypeScript**: Used for the frontend React application and SOC Dashboard.
- **SQL**: Database querying and structured data persistence.

## 2. Backend & API Framework
- **FastAPI**: A modern, fast (high-performance) web framework for building RESTful APIs in Python. Extensively used for its asynchronous capabilities.
- **Uvicorn**: An ASGI web server implementation for Python used to serve the FastAPI application.

## 3. Artificial Intelligence & Machine Learning Pipeline Tools
- **Scikit-Learn**: The foundational library for our traditional machine learning tasks, primarily driving our robust Random Forest Models and implementing grid-search hyperparameter tuning.
- **Transformers (Hugging Face)**: Essential for pulling pre-trained state-of-the-art NLP models. Specifically utilized our BERT architecture for extracting urgent semantic intent from phishing emails.
- **PyTorch / TensorFlow**: The deep learning framework underlying the LSTM (Long Short-Term Memory) neural networks and the BERT transformer model.
- **XGBoost**: A highly optimized gradient boosting library utilized in our ensemble architecture to catch evasive behavioral anomalies that Random Forests might miss.
- **NLTK & spaCy**: Natural Language Toolkit processors used extensively during the email cleansing phase to remove stop-words, stem terms, and tokenize raw payloads.
- **Pandas & NumPy**: The core data manipulation and mathematical operation workhorses. Crucial for converting datasets into feature matrices and managing `.csv` manipulation in the preprocessing pipeline.
- **Joblib / Pickle**: Serialization tools employed for saving the trained models (`.pkl` / `.joblib`) and re-loading them efficiently into the live FastAPI backend.
- **Jupyter Notebooks**: The interactive computing environment placed in the `/training` directories, heavily leveraged for Exploratory Data Analysis (EDA) and live model prototyping.

## 4. Asynchronous Task Architecture
- **Celery**: The distributed task queue handling intensive background processes (like ML inferences and external API calls) without blocking the FastAPI server.
- **Redis 7**: Functions primarily as the in-memory Message Broker for Celery, managing queues and tracking background execution states.

## 5. Database & Persistence
- **PostgreSQL 15**: The primary, enterprise-grade relational database for persistently storing user data, analytical metrics, and phishing verdicts.
- **SQLite**: Utilized exclusively for lightweight local development and rapid prototyping testing.
- **SQLAlchemy ORM**: The Object Relational Mapper bridging Python backend logic seamlessly to the SQL databases.

## 6. Frontend Technologies
- **React.js**: JavaScript library for building interactive user interfaces (Inbox and SOC Admin portals).
- **Vite**: The next-generation build tool allowing for ultra-fast hot-reloading and optimized frontend assets.
- **Node.js 18+**: The runtime environment required to build and execute the React applications.
- **Tailwind CSS / Standard styling**: For responsive, scalable UI component designs.

## 7. External Threat Intelligence (APIs)
- **VirusTotal APIv3**: Extensively integrated to securely scan URLs and hash-check attachments against dozens of global antivirus scanners in real-time.
- **PhishTank API**: An additional oracle used to cross-reference known live phishing URLs dynamically.

## 8. Deployment & Operations (DevOps)
- **Docker**: Containerization ensuring that the FastAPI backend, React frontends, and Postgres/Redis instances all execute consistently regardless of the host OS.
- **Docker Compose**: Orchestrates multi-container execution directly via the `docker-compose.yml` configurations.
- **Git & GitHub**: Version control and codebase management tracking architecture updates over time.
