from core.celery_app import celery_app
from routers.analysis import process_single_email
import logging

logger = logging.getLogger("phishguard.celery_tasks")

@celery_app.task(name="core.tasks.analyze_email_pipeline", bind=True)
def analyze_email_pipeline(self, parsed_email):
    """
    Background ML inference and correlation pipeline.
    Takes a sanitized JSON payload, scores it, saves it to the DB,
    and returns the final decision payload.
    """
    logger.info(f"Starting Celery task to analyze email: {parsed_email.get('headers', {}).get('subject')}")
    try:
        # The entire heavy-lifting process, now safely off the FastAPI event loop
        final_decision = process_single_email(parsed_email)
        return final_decision
    except Exception as e:
        logger.error(f"Celery task failed completely: {e}", exc_info=True)
        return {"error": str(e), "status": "failed"}
