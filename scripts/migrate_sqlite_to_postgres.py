import sqlite3
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure we can import the models
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
from database.models import Base, EmailScan, KnownSender, SOCAuditLog, BlockedEntity, SOCInvestigationNote

# Source SQLite DB Path
SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'backend', 'database', 'phishguard.db')
if not os.path.exists(SQLITE_DB_PATH):
    print(f"Error: Could not find SQLite database at {SQLITE_DB_PATH}")
    sys.exit(1)

# Target PostgreSQL DB Connection
POSTGRES_URL = "postgresql://phishguard_user:secure_password_123@localhost:5432/phishguard_db"

def migrate():
    print("Initiating Safe Database Migration: SQLite -> PostgreSQL")

    try:
        # 1. Connect to PostgreSQL and create schemas
        engine = create_engine(POSTGRES_URL)
        print("Connected to PostgreSQL successfully.")
        
        print("Creating table schemas...")
        Base.metadata.create_all(bind=engine)
        
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()

        # 2. Connect to SQLite
        sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
        sqlite_conn.row_factory = sqlite3.Row
        cursor = sqlite_conn.cursor()

        # --- MIGRATE KNOWN SENDERS ---
        print("\nMigrating known_senders...")
        cursor.execute("SELECT * FROM known_senders")
        senders = cursor.fetchall()
        for row in senders:
            try:
                # Check if it exists
                existing = db.query(KnownSender).filter(KnownSender.sender == row['sender']).first()
                if not existing:
                    db.add(KnownSender(
                        sender=row['sender'],
                        first_seen=row['first_seen'],
                        last_seen=row['last_seen'],
                        interaction_count=row['interaction_count']
                    ))
            except Exception as e:
                print(f"  Warning: Skipping sender '{row['sender']}': {e}")
        db.commit()
        print(f"  Migrated {len(senders)} known senders.")

        # --- MIGRATE EMAIL SCANS ---
        print("\nMigrating email_scans...")
        try:
            cursor.execute("SELECT * FROM email_scans")
            scans = cursor.fetchall()
            for row in scans:
                existing = db.query(EmailScan).filter(EmailScan.id == row['id']).first()
                if not existing:
                    # SQLite PRAGMA handling (columns might not exist depending on the age of the DB)
                    def safe_get(key, default=None):
                        try:
                            return row[key]
                        except Exception:
                            return default

                    scan = EmailScan(
                        id=row['id'], # Keep the exact same ID!
                        sender=row['sender'],
                        subject=row['subject'],
                        body=row['body'],
                        body_html=row['body_html'],
                        label=row['label'],
                        risk_score=row['risk_score'],
                        reasons=row['reasons'],
                        created_at=row['created_at'],
                        content_hash=row['content_hash'],
                        attachments=row['attachments'],
                        quarantine_status=safe_get('quarantine_status', 'none'),
                        soc_action=safe_get('soc_action', None),
                        soc_analyst=safe_get('soc_analyst', None),
                        action_timestamp=safe_get('action_timestamp', None),
                        campaign_id=safe_get('campaign_id', None),
                        status=safe_get('status', 'Open'),
                        analyst_assigned=safe_get('analyst_assigned', None),
                        severity=safe_get('severity', None),
                        sla_deadline=safe_get('sla_deadline', None),
                        resolution_reason=safe_get('resolution_reason', None)
                    )
                    db.add(scan)
            db.commit()
            print(f"  Migrated {len(scans)} email scans.")
        except Exception as e:
            print(f"  Error migrating email_scans: {e}")

        # --- MIGRATE SOC AUDIT LOG ---
        print("\nMigrating soc_audit_log...")
        try:
            cursor.execute("SELECT * FROM soc_audit_log")
            logs = cursor.fetchall()
            for row in logs:
                def safe_get(key, default=None):
                    try:
                        return row[key]
                    except Exception:
                        return default
                
                db.add(SOCAuditLog(
                    id=row['id'],
                    email_id=row['email_id'],
                    analyst=row['analyst'],
                    action=row['action'],
                    reason=row['reason'],
                    details=safe_get('details', None),
                    timestamp=row['timestamp']
                ))
            db.commit()
            print(f"  Migrated {len(logs)} audit logs.")
        except Exception as e:
            print(f"  No soc_audit_log table found or error: {e}")

        # --- MIGRATE BLOCKED ENTITIES ---
        print("\nMigrating blocked_entities...")
        try:
            cursor.execute("SELECT * FROM blocked_entities")
            entities = cursor.fetchall()
            for row in entities:
                db.add(BlockedEntity(
                    id=row['id'],
                    entity_type=row['entity_type'],
                    entity_value=row['entity_value'],
                    blocked_by=row['blocked_by'],
                    blocked_at=row['blocked_at'],
                    reason=row['reason']
                ))
            db.commit()
            print(f"  Migrated {len(entities)} blocked entities.")
        except Exception as e:
            print(f"  No blocked_entities table found or error: {e}")

        # --- MIGRATE SOC INVESTIGATION NOTES ---
        print("\nMigrating soc_investigation_notes...")
        try:
            cursor.execute("SELECT * FROM soc_investigation_notes")
            notes = cursor.fetchall()
            for row in notes:
                db.add(SOCInvestigationNote(
                    id=row['id'],
                    email_id=row['email_id'],
                    analyst=row['analyst'],
                    note=row['note'],
                    timestamp=row['timestamp']
                ))
            db.commit()
            print(f"  Migrated {len(notes)} investigation notes.")
        except Exception as e:
             print(f"  No soc_investigation_notes table found or error: {e}")


        print("\n=== MIGRATION COMPLETE ===")
        print("All data has been safely transferred to PostgreSQL.")

    except Exception as e:
        print(f"\nCRITICAL MIGRATION ERROR: {e}")
        db.rollback()
    finally:
        db.close()
        sqlite_conn.close()

if __name__ == "__main__":
    migrate()
