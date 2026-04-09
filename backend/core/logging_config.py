"""
PhishGuard Centralized Logging Configuration
Sets up structured logging for the entire application.
"""
import logging
import sys
import os
from logging.handlers import RotatingFileHandler
from datetime import datetime

# -- Log directory --
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "logs")
os.makedirs(LOG_DIR, exist_ok=True)

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# -- Log format --
LOG_FORMAT = "[%(asctime)s] %(levelname)-8s | %(name)-24s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

formatter = logging.Formatter(fmt=LOG_FORMAT, datefmt=DATE_FORMAT)

def _make_handler(filename: str, level=logging.DEBUG) -> RotatingFileHandler:
    """Create a rotating file handler that caps at 10MB with 5 backups."""
    path = os.path.join(LOG_DIR, filename)
    handler = RotatingFileHandler(path, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8")
    handler.setLevel(level)
    handler.setFormatter(formatter)
    return handler

def _make_console_handler(level=logging.INFO) -> logging.StreamHandler:
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    handler.setFormatter(formatter)
    return handler

def setup_logging():
    """
    Call once at application startup (in main.py) to configure all loggers.
    After this, modules can simply do:
        import logging
        logger = logging.getLogger(__name__)
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # Avoid adding duplicate handlers if called twice
    if root_logger.handlers:
        return

    # Console: INFO+ only
    root_logger.addHandler(_make_console_handler(logging.INFO))

    # File: All DEBUG+ into one rolling file
    root_logger.addHandler(_make_handler("phishguard.log", logging.DEBUG))

    # Separate error-only file for quick triage
    root_logger.addHandler(_make_handler("errors.log", logging.ERROR))

    # Quieten noisy 3rd-party loggers
    for noisy in ("uvicorn.access", "httpx", "httpcore", "transformers", "PIL"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    logging.info("PhishGuard logging initialized.")


def get_logger(name: str) -> logging.Logger:
    """Convenience function — equivalent to logging.getLogger(name)."""
    return logging.getLogger(name)
