import os
from dotenv import load_dotenv
load_dotenv()  # Load .env before anything else reads os.getenv()
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "phishguard_ml_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['core.tasks']   # ← tells worker to import core/tasks.py on startup
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300, # 5 minute max processing time for large emails
    worker_prefetch_multiplier=1, # Ensure heavy ML tasks are handled one by one per worker
)

# Optional: Add routing logic here if you scale to multiple queues (e.g., fast queue vs deep learning queue)
