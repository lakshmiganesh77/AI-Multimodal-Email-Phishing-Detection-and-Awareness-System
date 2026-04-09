# Deployment Guide: PhishGuard AI System

Now that the local development is complete, transforming this into a production-ready application requires deploying its various services. PhishGuard is a multi-service architecture comprising:
1. **Frontend (User Extension/App)** - React/Vite
2. **SOC Dashboard** - React/Vite/Tailwind
3. **Backend API** - FastAPI
4. **Asynchronous Task Worker** - Celery
5. **Database** - PostgreSQL
6. **Message Broker / Cache** - Redis

Here are the two best deployment strategies based on cost, ease of use, and scalability.

---

## Strategy A: The "Modern PaaS" Approach (Easiest & Developer Friendly)
*Best for: Quick deployment, automatic scaling, minimal server management (DevOps).*

In this approach, you use different specialized platforms for the frontend, backend, and databases.

### 1. Frontends (`frontend` & `soc-dashboard`) 
**Platform Recommendation:** **Vercel** or **Netlify** (Both offer generous free tiers).
*   **Why:** They specialize in static and Jamstack sites, providing global CDNs, automatic SSL, and push-to-deploy from GitHub.
*   **How:** 
    1. Push your code to GitHub.
    2. Import the repository into Vercel/Netlify.
    3. For the `frontend`, set the root directory to `/frontend` and build command to `npm run build`.
    4. For the `soc-dashboard`, create a separate Vercel project, set the root to `/soc-dashboard`, and build command to `npm run build`.
    5. Ensure you set your `.env` variables (like `VITE_API_URL` pointing to your deployed backend) in the platform's dashboard.

### 2. Database & Message Broker (PostgreSQL & Redis)
**Platform Recommendation:** **Supabase** or **Neon** (for Postgres), and **Upstash** or **Render** (for Redis).
*   **Why:** Serverless databases scale well down to zero and are very cheap/free to start.
*   **How:** 
    1. Create a Supabase or Neon project and get your Postgres connection string.
    2. Create an Upstash Redis database and get the Redis URL.

### 3. Backend (FastAPI) & Celery Worker
**Platform Recommendation:** **Render.com** or **Railway.app**
*   **Why:** They natively support deploying Python web servers and background workers via GitHub integration and Dockerfiles.
*   **How:**
    1. Connect your GitHub repository.
    2. **Web Service (FastAPI):** Create a "Web Service". Set the root to `/backend` and the start command to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
    3. **Background Worker (Celery):** Create a "Background Worker". Set the start command to `celery -A core.celery_app worker --loglevel=info`.
    4. Provide the environment variables to both (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, etc.).

---

## Strategy B: The "Single VPS" Approach (Most Cost-Effective)
*Best for: Lowest cost, keeping everything under one roof, learning DevOps.*

If you don't want to manage multiple platforms, you can rent a single Virtual Private Server (VPS) and run your existing `docker-compose.yml` file.

**Platform Recommendation:** **DigitalOcean Droplet**, **Linode**, **Hetzner**, or AWS **EC2** (Ubuntu Linux instance).

### Steps:
1. **Provision a Server:** Rent an Ubuntu server (minimum 2GB RAM is recommended because Celery, Postgres, Redis, and FastAPI will all run here).
2. **Install Dependencies:** SSH into your server and install Docker and Docker Compose.
3. **Clone Repository:** `git clone <your-repo-url>`
4. **Configure Environment:** Create a `.env` file on the server with production secrets. *Do not use database passwords like "postgres" in production.*
5. **Deploy Backend Services:**
    Currently, your `docker-compose.yml` runs Redis and Postgres. You will need to add your FastAPI backend and Celery worker to the `docker-compose.yml` file so Docker manages them too.
    *Example addition to `docker-compose.yml`:*
    ```yaml
    backend:
      build: ./backend
      command: uvicorn main:app --host 0.0.0.0 --port 8000
      env_file: .env
      depends_on:
        - db
        - redis
    celery_worker:
      build: ./backend
      command: celery -A core.celery_app worker --loglevel=info
      env_file: .env
      depends_on:
        - db
        - redis
    ```
6. **Deploy Frontends (Nginx):** You build your React apps locally (`npm run build`), copy the `dist` folders to the server, and use **Nginx** to serve the static files and act as a reverse proxy to route `/api` requests to your FastAPI container.
7. **Run Background:** `docker compose up -d --build`
8. **Secure with SSL:** Use **Certbot (Let's Encrypt)** to generate a free HTTPS certificate for your domain name.

---

## Security Pre-Deployment Checklist
Before putting this on the internet, ensure you:
- [ ] **Change Default Credentials:** Make sure `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, and `JWT_SECRET` are long, random, and not committed to Git.
- [ ] **CORS Settings:** In your FastAPI `main.py`, ensure the CORS origins are restricted to your actual Vercel/Netlify frontend domains, rather than `["*"]`.
- [ ] **Debug Mode:** Ensure FastAPI debug mode is turned off.
- [ ] **API Keys:** Restrict your Gemini/Google API keys in the Google Cloud Console to only allow requests from your server's IP or your specific backend domain.
