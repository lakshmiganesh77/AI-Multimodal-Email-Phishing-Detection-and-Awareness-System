import os
import re
import json
from datetime import datetime, timedelta
import redis
import traceback
import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

from database.models import Base, EmailScan, KnownSender

logger = logging.getLogger("phishguard.database")

POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://phishguard_user:secure_password_123@localhost:5432/phishguard_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
# Set up PostgreSQL engine with connection pooling
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "50"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))

try:
    engine = create_engine(POSTGRES_URL, pool_size=DB_POOL_SIZE, max_overflow=DB_MAX_OVERFLOW)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.error(f"DATABASE INIT ERROR: {e}")
    engine = None
    SessionLocal = None

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
except Exception as e:
    logger.error(f"REDIS INIT ERROR: {e}")
    redis_client = None

def get_db():
    """Returns a pure SQLAlchemy ORM Session"""
    if not SessionLocal:
        raise Exception("Database engine not initialized")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_conn():
    """
    Returns a standard SQLAlchemy ORM session wrapper that acts like DB-API 2.0 connection
    to maintain backward compatibility with raw SQL routes in main.py, but WITHOUT
    the fragile SQLite string translation layer. Routes must use standard postgres :param syntax.
    """
    class PostgresConn:
        def __init__(self, session):
            self.db = session
        def cursor(self):
            return PostgresCursor(self.db)
        def commit(self):
            self.db.commit()
        def close(self):
            self.db.close()
            
    class PostgresCursor:
        def __init__(self, session):
            self.db = session
            self._fetchall = []
            self._fetchone = None
            self.rowcount = 0
            
        def execute(self, query, params=None):
            # No string replacement translation mapping "julianday" or "?" 
            if params:
                if isinstance(params, tuple):
                    # convert ? to :p0, :p1 syntax natively here just for the raw queries
                    param_dict = {}
                    q = query
                    for i, p in enumerate(params):
                        q = q.replace("?", f":p{i}", 1)
                        param_dict[f"p{i}"] = p
                    result = self.db.execute(text(q), param_dict)
                else:
                    result = self.db.execute(text(query), params)
            else:
                result = self.db.execute(text(query))
                
            self.rowcount = result.rowcount
            if query.strip().upper().startswith("SELECT") or "RETURNING" in query.upper():
                try:
                    rows = result.fetchall()
                    self._fetchall = [tuple(r) for r in rows]
                    self._fetchone = tuple(rows[0]) if rows else None
                except Exception:
                    pass

        def fetchall(self):
            return self._fetchall

        def fetchone(self):
            return self._fetchone

    db = SessionLocal()
    return PostgresConn(db)


def init_db():
    if engine:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas ensured.")

def check_and_update_sender(sender_email):
    if not sender_email or sender_email == "Unknown":
        return True # Default to highest risk
        
    db = SessionLocal()
    try:
        now_utc = datetime.utcnow().isoformat()
        sender_entry = db.query(KnownSender).filter(KnownSender.sender == sender_email).first()
        
        if not sender_entry:
            new_sender = KnownSender(sender=sender_email, first_seen=now_utc, last_seen=now_utc, interaction_count=1)
            db.add(new_sender)
            db.commit()
            return True
        else:
            sender_entry.interaction_count += 1
            sender_entry.last_seen = now_utc
            db.commit()
            return False
    except Exception as e:
        db.rollback()
        logger.error(f"Error checking sender: {e}")
        return True # Fail-close: assume highest risk if database fails
    finally:
        db.close()

def check_known_hash(content_hash):
    if not content_hash:
        return None
        
    if redis_client:
        try:
            cached_result = redis_client.get(f"hash:{content_hash}")
            if cached_result:
                return json.loads(cached_result)
        except Exception as e:
            pass
            
    db = SessionLocal()
    try:
        scan = db.query(EmailScan).filter(EmailScan.content_hash == content_hash).order_by(EmailScan.id.desc()).first()
        if scan:
            result = {
                "label": scan.label,
                "risk_score": scan.risk_score,
                "reasons": scan.reasons
            }
            if redis_client:
                try:
                    redis_client.setex(f"hash:{content_hash}", 86400, json.dumps(result))
                except Exception:
                    pass
            return result
    except Exception as e:
        pass
    finally:
        db.close()
        
    return None

def mask_pii(text):
    if not isinstance(text, str):
        return text
    masked = re.sub(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', '[REDACTED PHONE]', text)
    masked = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED SSN]', masked)
    masked = re.sub(r'\b(?:\d{4}[- ]?){3}\d{4}\b', '[REDACTED CC]', masked)
    return masked

def save_scan(sender, subject, body, label, risk_score, reasons, body_html=None, content_hash=None, attachments_json=None, ml_prob=0, bert_prob=0, lstm_prob=0):
    if isinstance(body, str):
       body = mask_pii(body)
    if isinstance(body_html, str):
       body_html = mask_pii(body_html)
    
    db = SessionLocal()
    try:
        reasons_str = ""
        if isinstance(reasons, list):
            reasons_str = ", ".join(reasons)
        elif isinstance(reasons, str):
            reasons_str = reasons
        
        now_utc = datetime.utcnow()
        
        sla_deadline = None
        if risk_score > 80:
            sla_deadline = (now_utc + timedelta(minutes=15)).isoformat()
        elif risk_score > 60:
            sla_deadline = (now_utc + timedelta(hours=1)).isoformat()
        elif risk_score > 40:
            sla_deadline = (now_utc + timedelta(hours=4)).isoformat()
        else:
            sla_deadline = (now_utc + timedelta(hours=24)).isoformat()
        
        scan = EmailScan(
            sender=sender or "Unknown",
            subject=subject or "No Subject",
            body=body or "",
            body_html=body_html or "",
            label=label,
            risk_score=risk_score,
            reasons=reasons_str,
            created_at=now_utc.isoformat(),
            content_hash=content_hash or "",
            attachments=attachments_json or "[]",
            sla_deadline=sla_deadline,
            status='Open',
            ml_probability=int(ml_prob),
            bert_prob=int(bert_prob),
            lstm_prob=int(lstm_prob)
        )
        db.add(scan)
        db.commit()
        
        if content_hash and redis_client:
            try:
                result = {
                    "label": label,
                    "risk_score": risk_score,
                    "reasons": reasons_str
                }
                redis_client.setex(f"hash:{content_hash}", 86400, json.dumps(result))
            except Exception:
                pass
                
        # Return the auto-generated ID and key timestamps
        return {
            "id": scan.id,
            "created_at": scan.created_at,
            "sla_deadline": scan.sla_deadline
        }

    except Exception as e:
        db.rollback()
        logger.error(f"CRITICAL DB WRITE ERROR: {str(e)}")
        return None
    finally:
        db.close()

