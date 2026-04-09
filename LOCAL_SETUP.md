# 🚀 Developer Startup Guide
### AI Multimodal Phishing Detection System

This guide outlines the step-by-step process for setting up the entire application stack locally for development and testing.

---

## 💻 System Requirements

Before starting, ensure you have the following installed on your machine:
* **Python:** `v3.9` or higher (Required for the FastAPI backend and ML models)
* **Node.js:** `v18.0` or higher (Required for compiling the Vite/React frontends)
* **npm:** `v9` or higher (Usually bundled with Node.js)
* **Docker & Docker Compose:** Required to easily spin up local instances of PostgreSQL and Redis.
* **Git:** Required to clone the repository.

---

## 📂 Project Setup

### 1. Clone the Repository
Open your terminal and clone the repository to your local machine:
```bash
git clone https://github.com/your-username/phishguard.git
cd phishguard
```

### 2. Configure Environment Variables
We use environment variables to keep secrets out of source control. 

1. Copy the template `.env.example` file to create your local `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in your text editor and fill in the required values (especially `JWT_SECRET_KEY`, `IMAP_USER`, `IMAP_PASS`, and `VT_API_KEY`).
   * *Tip: You can generate a random 32-character string for the JWT Secret using: `openssl rand -hex 32`*
3. If you need to override the inbox frontend backend URL, create `frontend/.env.local` with:
   ```bash
   VITE_API_BASE_URL=http://localhost:8000
   ```
   Keep the hostname consistent:
   * if the frontend runs on `http://localhost:5173`, use `http://localhost:8000`
   * if the frontend runs on `http://127.0.0.1:5173`, use `http://127.0.0.1:8000`

---

## 🗄️ Database & Redis Setup (via Docker)

The easiest way to run PostgreSQL and Redis locally without cluttering your host machine is via the provided `docker-compose.yml` file.

1. Ensure the Docker daemon is running on your machine.
2. From the project root, start the `db` and `redis` containers in the background:
   ```bash
   docker compose up -d db redis
   ```
3. Verify they are running:
   ```bash
   docker ps
   ```
   *You should see containers for `postgres:15-alpine` (port 5432) and `redis:7-alpine` (port 6379).*

---

## ⚙️ Running the Backend (FastAPI + Celery)

The backend consists of the main FastAPI server and background Celery workers for ML processing.

### 1. Install Python Dependencies
Open a **new terminal window** (Terminal 1) and run:
```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install requirements
pip install -r ../requirements.txt
```

### 2. Start the FastAPI Server
With the virtual environment activated, start the uvicorn server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*The `--reload` flag enables auto-reloading when you modify Python files.*

### 3. Start the Celery Worker
Open a **new terminal window** (Terminal 2), activate the virtual environment again, and run the worker:
```bash
cd backend

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# Start the worker
# On Windows (requires --pool=solo to avoid multiprocessing bugs):
celery -A core.celery_app.celery_app worker --pool=solo --loglevel=INFO

# On macOS/Linux:
# celery -A core.celery_app.celery_app worker --loglevel=INFO
```
*This worker will pick up intensive email scanning tasks (like ML inference and VirusTotal checks) from the Redis queue.*

---

## 🖥️ Running the Frontends

The project contains two separate React applications built with Vite.

### 1. Start the Email Client Interface (Frontend)
Open a **new terminal window** (Terminal 3):
```bash
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```

### 2. Start the SOC Dashboard
Open a **new terminal window** (Terminal 4):
```bash
cd soc-dashboard

# Install Node dependencies
npm install

# Start the development server
npm run dev
```

---

## 🌐 Accessing the Application Locally

Once all services are running, you can access them in your browser:

* **Email Client Interface:** [http://localhost:5173](http://localhost:5173)
  * *The inbox frontend opens directly without a login page.*
* **SOC Dashboard:** [http://localhost:5174](http://localhost:5174)
  * *Default login is `admin` / `admin123` (unless changed in `.env`).*
* **Backend API Docs (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
  * *Use this to test API endpoints directly and view request/response schemas.*

Do not mix `localhost` and `127.0.0.1` between frontend and backend. Use one hostname family consistently for both.

If you change backend code and still see an old frontend error, restart the FastAPI server on port `8000` or wait for `--reload` to finish, then refresh the browser once. An older backend process can keep serving outdated route behavior.

---

## 🛑 Shutting Down

To stop the entire stack gracefully:
1. Press `Ctrl+C` in the terminal windows running FastAPI, Celery, and the two Vite dev servers.
2. To stop the Docker database and Redis containers safely, run from the root directory:
   ```bash
   docker compose down
   ```
