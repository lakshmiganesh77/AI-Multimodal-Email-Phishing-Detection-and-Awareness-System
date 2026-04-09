# PhishGuard Backend Dockerfile
# Python 3.10 slim image for minimal size
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system-level dependencies required by some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    tesseract-ocr \
    libzbar0 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (leverages Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend source code
COPY . .

# SECURITY FIX: Create and switch to a non-root user
# Prevents container escape from gaining root-level host access
RUN groupadd --system phishguard && \
    useradd --system --gid phishguard --no-create-home phishguard && \
    chown -R phishguard:phishguard /app
USER phishguard

# Expose the FastAPI port
EXPOSE 8000

# Start the application with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
