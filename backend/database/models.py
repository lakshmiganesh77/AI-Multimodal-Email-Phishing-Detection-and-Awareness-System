from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Integer, default=1)
    role = Column(String, default="analyst")

class EmailScan(Base):
    __tablename__ = "email_scans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sender = Column(String, index=True)
    subject = Column(String)
    body = Column(Text)
    body_html = Column(Text)
    label = Column(String)
    risk_score = Column(Integer)
    reasons = Column(Text)
    created_at = Column(String)
    content_hash = Column(String, index=True)
    attachments = Column(Text)

    # SOC additions
    quarantine_status = Column(String, default="none")
    soc_action = Column(String)
    soc_analyst = Column(String)
    action_timestamp = Column(String)
    campaign_id = Column(String)
    status = Column(String, default="Open")
    analyst_assigned = Column(String)
    severity = Column(String)
    sla_deadline = Column(String)
    resolution_reason = Column(String)
    
    # ML Tracking & Drift Detection
    ml_probability = Column(Integer, default=0)
    bert_prob = Column(Integer, default=0)
    lstm_prob = Column(Integer, default=0)
    user_feedback_label = Column(String) # For false-positive/false-negative tracking


class KnownSender(Base):
    __tablename__ = "known_senders"

    sender = Column(String, primary_key=True, index=True)
    first_seen = Column(String)
    last_seen = Column(String)
    interaction_count = Column(Integer, default=1)


class SOCAuditLog(Base):
    __tablename__ = "soc_audit_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email_id = Column(Integer, ForeignKey("email_scans.id"))
    analyst = Column(String)
    action = Column(String)
    reason = Column(String)
    details = Column(Text)
    timestamp = Column(String)


class BlockedEntity(Base):
    __tablename__ = "blocked_entities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    entity_type = Column(String)
    entity_value = Column(String)
    blocked_by = Column(String)
    blocked_at = Column(String)
    reason = Column(String)


class SOCInvestigationNote(Base):
    __tablename__ = "soc_investigation_notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email_id = Column(Integer, ForeignKey("email_scans.id"))
    analyst = Column(String)
    note = Column(Text)
    timestamp = Column(String)
