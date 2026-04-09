# PhishGuard Cloud Deployment Guide

This guide covers the deployment path that matches the current repository: the **backend API**, **Celery worker**, **PostgreSQL**, **Redis**, and the **frontend inbox** on a single **Google Cloud Compute Engine VM** using `docker compose`.

The `soc-dashboard` app exists in the repo, but it is **not currently included in `docker-compose.yml`**, so it is not part of this deployment flow yet.

---

## What this deployment includes

- Frontend inbox on port `80`
- Backend API on port `8000`
- PostgreSQL bound to `127.0.0.1:5432` on the VM
- Redis bound to `127.0.0.1:6380` on the VM
- Celery worker running inside Docker

## Prerequisites

1. A **Google Cloud Platform (GCP)** account.
2. The project source code in a Git repository.
3. A VM with enough memory for the backend and worker. `e2-standard-2` is the safer default.

## Step 1: Create a GCP VM

1. In GCP, go to **Compute Engine -> VM instances**.
2. Click **Create Instance**.
3. Use a configuration similar to:
   - **Name:** `phishguard-server`
   - **Region:** closest to your users
   - **Machine type:** `e2-standard-2` recommended
   - **Boot disk:** **Ubuntu 22.04 LTS**, at least `30 GB`
4. Under firewall, allow **HTTP traffic**.
5. Click **Create**.

## Step 2: Open required firewall ports

For the current compose setup, you only need:

- `80` for the frontend
- `8000` for the backend API

Create a firewall rule in **VPC network -> Firewall**:

1. Click **Create Firewall Rule**.
2. Set **Name** to `allow-phishguard-web`.
3. Set **Targets** to the VM or the relevant network tag.
4. Set **Source IPv4 ranges** to `0.0.0.0/0`.
5. Under **Protocols and ports**, allow `tcp:8000`.
6. Save the rule.

Port `80` is already covered if you enabled **Allow HTTP traffic** when creating the VM.

## Step 3: SSH into the VM and install Docker

1. Open the VM using the **SSH** button in the GCP console.
2. Update the machine:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
3. Install Docker, Compose, and Git:
   ```bash
   sudo apt install docker.io docker-compose-v2 git -y
   ```
4. Enable Docker:
   ```bash
   sudo systemctl enable --now docker
   sudo usermod -aG docker $USER
   ```
5. Reconnect your SSH session so the Docker group change takes effect.

## Step 4: Clone the project and configure `.env`

1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/phishguard.git
   cd phishguard
   ```
2. Create `.env` from the template:
   ```bash
   cp .env.example .env
   ```
3. Edit the file:
   ```bash
   nano .env
   ```

Set at least these values:

- `JWT_SECRET_KEY`
- `ADMIN_PASSWORD`
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`

Generate a strong JWT secret with:

```bash
openssl rand -hex 32
```

Notes:

- `DATABASE_URL` and `REDIS_URL` are assembled automatically by `docker-compose.yml`.
- The backend routes are mounted at `/api/auth/*`, `/soc/*`, `/analyze`, `/imap/check`, `/chat`, and `/feedback`.
- Do **not** append `/api/v1`.
- `.env.example` sets `ENVIRONMENT=production`, which disables `/docs` and `/redoc`. If you want Swagger temporarily, set `ENVIRONMENT=development` before starting the stack.

## Step 5: Build and start the stack

Run:

```bash
docker compose up --build -d
```

This starts:

- `db`
- `redis`
- `backend`
- `celery_worker`
- `frontend`

Check status with:

```bash
docker compose ps
```

View logs if something fails:

```bash
docker compose logs -f
```

## Step 6: Access the deployed app

After the containers are up, use the VM's external IP:

- **Frontend inbox:** `http://<YOUR_VM_EXTERNAL_IP>`
- **Backend API:** `http://<YOUR_VM_EXTERNAL_IP>:8000`
- **Health check:** `http://<YOUR_VM_EXTERNAL_IP>:8000/health`

If `ENVIRONMENT=development`, Swagger is also available at:

- `http://<YOUR_VM_EXTERNAL_IP>:8000/docs`

## Current limitation: SOC dashboard

The repo contains a `soc-dashboard` app, but the current deployment is not cloud-ready yet because:

- it is not defined in `docker-compose.yml`
- multiple dashboard components still hardcode `http://127.0.0.1:8000`

Do not document `http://<IP>:8080` as available until that app is containerized and its API base URL handling is fixed.

## Future updates

When you make code changes:

1. Push changes to Git.
2. SSH into the VM.
3. Go to the project folder:
   ```bash
   cd phishguard
   ```
4. Pull the latest code:
   ```bash
   git pull
   ```
5. Rebuild and restart:
   ```bash
   docker compose up --build -d
   ```
