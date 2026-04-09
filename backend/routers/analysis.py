from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json
import logging

from database.database import get_db
from database.models import EmailScan
from core.rate_limit import limiter
from services.read_email import parse_email_bytes
from services.imap_client import fetch_latest_email
from core.rules import rule_based_analysis
from services.url_analysis import analyze_urls
from ml.ml_predict import ml_score_with_explanation
from services.image_analysis import analyze_images
from services.attachment_analysis import analyze_attachments
from core.decision_engine import decide
from fastapi.concurrency import run_in_threadpool
from core.websocket import manager

logger = logging.getLogger("phishguard.analysis")
router = APIRouter(tags=["Email Analysis Engine"])

def sanitize_for_json(email_data):
    import copy
    safe = copy.deepcopy(email_data)
    if "images" in safe:
        for img in safe["images"]:
            if "bytes" in img:
                del img["bytes"]
    if "attachments" in safe:
        for att in safe["attachments"]:
            if "bytes" in att:
                del att["bytes"]
    if "raw_data" in safe:
        raw = safe["raw_data"]
        if "images" in raw:
            for img in raw["images"]:
                if "bytes" in img:
                    del img["bytes"]
        if "attachments" in raw:
            for att in raw["attachments"]:
                if "bytes" in att:
                    del att["bytes"]
    return safe

def process_single_email(parsed_email):
    if isinstance(parsed_email, list):
        parsed_email = parsed_email[0] if parsed_email else {}

    try:
        steps = []
        import time
        def log_step(msg, status="INFO"):
            timestamp = time.strftime("%H:%M:%S")
            symbol = "ℹ️" if status == "INFO" else "✅" if status == "SUCCESS" else "⚠️" if status == "WARNING" else "❌"
            steps.append(f"[{timestamp}] {symbol} {msg}")
            logger.info(f"[STEP] {msg}")

        log_step("Starting analysis pipeline...")

        import hashlib, re
        from database.database import check_known_hash
        
        raw_from = parsed_email.get('headers', {}).get('from', '')
        raw_sub = parsed_email.get('headers', {}).get('subject', '')
        raw_body = parsed_email.get('body', '')
        
        norm_from = re.sub(r'[^a-z0-9]', '', raw_from.lower())
        norm_sub = re.sub(r'[^a-z0-9]', '', raw_sub.lower())
        norm_body = re.sub(r'<[^>]*>', '', raw_body.lower())
        norm_body = re.sub(r'[^a-z0-9]', '', norm_body)
        
        content_hash = hashlib.sha256(f"{norm_from}{norm_sub}{norm_body}".encode('utf-8')).hexdigest()
        
        log_step("Running Rule-Based Analysis...", "INFO")
        try:
            from database.database import check_and_update_sender
            match = re.search(r'<([^>]+)>', raw_from)
            sender_email = match.group(1).lower() if match else raw_from.lower().strip()
            
            is_first_time = check_and_update_sender(sender_email)
            parsed_email["is_first_time_sender"] = is_first_time
            if is_first_time:
                log_step(f"Behavioral Profiling: First-Time Sender detected ({sender_email})", "WARNING")
            else:
                log_step(f"Behavioral Profiling: Known Sender ({sender_email})", "SUCCESS")
                
            rule_result = rule_based_analysis(parsed_email)
            log_step(f"Rules Score: {rule_result.get('score', 0)}", "SUCCESS")
        except Exception as e:
            log_step(f"Rule analysis failed: {e}", "ERROR")
            rule_result = {}

        extra_text_context = ""
        image_result = {}
        if parsed_email.get("images"):
            log_step(f"Processing {len(parsed_email['images'])} images...", "INFO")
            try:
                image_result = analyze_images(parsed_email["images"])
                if image_result.get("meta", {}).get("extracted_text"):
                    extra_text_context += " " + image_result["meta"]["extracted_text"]
                
                qr_links = image_result.get("meta", {}).get("extracted_qr_links", [])
                if qr_links:
                    current_urls = parsed_email.get("urls", [])
                    parsed_email["urls"] = list(set(current_urls + qr_links))
                    log_step(f"Injected {len(qr_links)} QR Link(s) into URL analysis queue.", "INFO")
                    
                log_step(f"Image Score: {image_result.get('score', 0)}", "SUCCESS")
            except Exception as e:
                log_step(f"Image analysis failed: {e}", "ERROR")
        else:
             log_step("No images found. Skipping OCR.", "INFO")

        log_step("Analyzing URLs...")
        if parsed_email.get("urls"):
            log_step("Querying Threat Intelligence (VirusTotal & PhishTank)...", "INFO")
        try:
            url_result = analyze_urls(parsed_email)
            vt_hits = url_result.get("features", {}).get("vt_hits", 0)
            pt_hits = url_result.get("features", {}).get("phishtank_hits", 0)
            if vt_hits > 0:
                log_step(f"VirusTotal Flag: {vt_hits} malicious vendors detected", "WARNING")
            if pt_hits > 0:
                log_step(f"PhishTank Flag: Confirmed Phishing URL found", "WARNING")
            
            if url_result.get("score", 0) > 0:
                 log_step(f"Suspicious URLs found (Score: {url_result.get('score')})", "WARNING")
            else:
                 log_step("No malicious URLs found.", "SUCCESS")
        except Exception as e:
            log_step(f"URL analysis failed: {e}", "ERROR")
            url_result = {}

        att_result = {}
        if parsed_email.get("attachments"):
            log_step(f"Processing {len(parsed_email['attachments'])} attachments...", "INFO")
            try:
                att_result = analyze_attachments(parsed_email["attachments"])
                vt_att_hits = att_result.get("features", {}).get("vt_malicious_files", 0)
                if vt_att_hits > 0:
                    log_step(f"VirusTotal Flag: {vt_att_hits} files detected as MALWARE", "WARNING")
                log_step(f"Attachment Score: {att_result.get('score', 0)}", "SUCCESS")
                if att_result.get("meta", {}).get("extracted_text"):
                     extra_text_context += " " + att_result["meta"]["extracted_text"]
            except Exception as e:
                 log_step(f"Attachment analysis failed: {e}", "ERROR")
        else:
             log_step("No attachments found.", "INFO")

        parsed_email["extra_text"] = extra_text_context.strip()
        log_step("Running NLP Ensemble (BERT+LSTM)...", "INFO")
        try:
            ml_result = ml_score_with_explanation(parsed_email)
            prob = ml_result.get("score", 0)
            log_step(f"NLP Risk Score: {prob}%", "SUCCESS" if prob < 50 else "WARNING")
        except Exception as e:
            log_step(f"ML analysis failed: {e}", "ERROR")
            ml_result = {}

        analysis_parts = {
            "rules": rule_result,
            "url": url_result,
            "image": image_result,
            "attachment": att_result,
            "ml": ml_result,
            "html": parsed_email.get("html_features", {})
        }
        
        log_step("Finalizing Decision (Heuristic Aggregation)...", "INFO")
        final_decision = decide(parsed_email, analysis_parts)
        
        from ml.feature_extractor import extract_features
        ml_vector = extract_features(analysis_parts)
        final_decision["ml_vector"] = ml_vector["vector"]
        
        final_decision["steps"] = steps
        final_decision["layer_details"] = analysis_parts
        
        try:
            from database.database import save_scan
            safe_atts = sanitize_for_json(parsed_email).get("attachments", [])
            db_record = save_scan(
                sender=parsed_email.get("headers", {}).get("from", "Unknown"),
                subject=parsed_email.get("headers", {}).get("subject", "No Subject"),
                body=parsed_email.get("body", ""),
                label=final_decision["label"],
                risk_score=final_decision["risk_score"],
                reasons=json.dumps(final_decision["reasons"], ensure_ascii=False),
                body_html=parsed_email.get("body_html", ""),
                content_hash=content_hash,
                attachments_json=json.dumps(safe_atts, ensure_ascii=False),
                ml_prob=prob,
                bert_prob=ml_result.get("bert_prob", 0),
                lstm_prob=ml_result.get("lstm_prob", 0)
            )
            final_decision["db_record"] = db_record
            log_step("Saved to database.", "SUCCESS")
        except Exception as db_err:
            log_step(f"Database save failed: {db_err}", "WARNING")
        
        log_step("Analysis Complete.", "SUCCESS")
        return final_decision

    except Exception as e:
        import traceback
        error_msg = f"Pipeline Error: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "risk_score": 0,
            "label": "ERROR",
            "color": "GRAY",
            "reasons": [error_msg]
        }


@router.post("/analyze")
@limiter.limit("20/minute")
async def analyze_email(request: Request, file: UploadFile = File(...)):
    try:
        allowed_extensions = ('.eml', '.msg', '.txt')
        allowed_content_types = ('message/rfc822', 'application/octet-stream', 'text/plain', 'multipart/mixed')
        fname = (file.filename or "").lower()
        if not fname.endswith(allowed_extensions):
            raise HTTPException(status_code=400, detail="Unsupported file format. Upload .eml, .msg, or .txt only.")
        if file.content_type and not any(ct in file.content_type for ct in allowed_content_types):
            logger.warning(f"Suspicious MIME type on upload: {file.content_type} | file={file.filename}")
            # We don't raise an exception here anymore, browsers often send application/octet-stream or similar generic types for valid .eml files.
            
        max_size = 20 * 1024 * 1024
        file_size = 0
        content = bytearray()
        
        while chunk := await file.read(1024 * 1024):
            file_size += len(chunk)
            if file_size > max_size:
                return {"error": "File too large", "message": "Maximum allowed file size is 20MB."}
            content.extend(chunk)
            
        email_bytes = bytes(content)
        parsed = parse_email_bytes(email_bytes, filename=file.filename)
        
        try:
            from core.tasks import analyze_email_pipeline
            safe_response = sanitize_for_json(parsed)
            
            # Offload ML to Redis/Celery background threads!
            task = analyze_email_pipeline.delay(safe_response)
            
            return {
                "status": "processing",
                "task_id": task.id,
                "message": "Email queued for deep ML analysis."
            }
        
        except Exception as celery_err:
            # Graceful fallback: Redis/Celery unavailable — run synchronously
            logger.warning(f"[FALLBACK] Celery unavailable ({celery_err}). Running analysis synchronously.")
            try:
                final_decision = await run_in_threadpool(process_single_email, parsed)
                return {
                    "status": "done",
                    "analysis": final_decision,
                    "message": "Email analyzed synchronously (Celery unavailable)."
                }
            except Exception as sync_err:
                logger.error("Synchronous fallback also failed", exc_info=True)
                return {"error": str(sync_err), "message": "Analysis failed completely."}
    
    except Exception as e:
        import traceback
        logger.error("Analyze Email Error", exc_info=True)
        return {"error": str(e), "details": traceback.format_exc(), "message": "Failed to queue email for analysis."}

from core.celery_app import celery_app

@router.get("/analyze/status/{task_id}")
def check_task_status(task_id: str):
    """
    Polled by the frontend to see if the AI completed its work.
    """
    task = celery_app.AsyncResult(task_id)
    if task.state == 'PENDING' or task.state == 'STARTED':
        return {"status": "processing"}
    elif task.state != 'FAILURE':
        return {"status": "done", "analysis": task.result}
    else:
        return {"status": "failed", "error": str(task.info)}

@router.get("/imap/check")
async def check_inbox():
    emails = fetch_latest_email(limit=1)
    if not emails:
        return {"status": "no emails found"}

    email_obj = emails[0]
    try:
        parsed = parse_email_bytes(email_obj["raw"])
    except Exception as e:
        return {"status": "error parsing email", "detail": str(e)}

    final_decision = await run_in_threadpool(process_single_email, parsed)
    safe_email = sanitize_for_json(parsed)

    # Broadcast real-time SOC alert if malicious
    db_record = final_decision.get("db_record")
    if db_record and final_decision.get("label") in ["PHISHING", "SUSPICIOUS"]:
        alert_payload = {
            "type": "new_alert",
            "alert": {
                "id": db_record["id"],
                "sender": parsed.get("headers", {}).get("from", "Unknown"),
                "subject": parsed.get("headers", {}).get("subject", "No Subject"),
                "label": final_decision["label"],
                "risk_score": final_decision["risk_score"],
                "created_at": db_record["created_at"],
                "quarantine_status": None,
                "status": "Open",
                "analyst_assigned": "Unassigned",
                "severity": "Critical" if final_decision["risk_score"] > 80 else "High" if final_decision["risk_score"] > 60 else "Medium",
                "sla_deadline": db_record["sla_deadline"]
            }
        }
        await manager.broadcast(alert_payload)

    return {
        "source_folder": email_obj["folder"],
        "email": safe_email,
        "analysis": {
            "risk_score": final_decision["risk_score"],
            "label": final_decision["label"],
            "color": final_decision.get("color", "GRAY"),
            "ml_probability": final_decision.get("ml_probability", 0),
            "ml_top_words": final_decision.get("ml_top_words", []),
            "reasons": final_decision["reasons"],
            "scan_time": parsed.get("scan_time")
        }
    }

@router.get("/debug/vt")
def debug_vt():
    from core.threat_intel import virustotal_url_check
    return virustotal_url_check("http://example.com")

@router.get("/soc/recent")
def recent_scans(limit: int = 50, cursor: int = None):
    db = next(get_db())
    
    query = db.query(EmailScan)
    if cursor is not None:
        query = query.filter(EmailScan.id < cursor)
        
    rows = query.order_by(EmailScan.id.desc()).limit(limit).all()
    
    result = []
    for row in rows:
        atts = []
        if row.attachments:
            try:
                atts = json.loads(row.attachments)
            except:
                pass
        result.append({
            "id": row.id, "sender": row.sender, "subject": row.subject, "label": row.label,
            "risk_score": row.risk_score, "created_at": row.created_at, "reasons": row.reasons,
            "body": row.body, "body_html": row.body_html, "attachments": atts
        })
    return result

@router.delete("/emails/delete")
def delete_emails(email_ids: str):
    try:
        ids = [int(id.strip()) for id in email_ids.split(',') if id.strip()]
        if not ids:
            return {"error": "No email IDs provided"}
        
        db = next(get_db())
        deleted_count = db.query(EmailScan).filter(EmailScan.id.in_(ids)).delete(synchronize_session=False)
        db.commit()
        
        return {"success": True, "deleted_count": deleted_count, "message": f"Successfully deleted {deleted_count} email(s)"}
    except Exception as e:
        logger.error(f"Delete Error: {e}")
        return {"error": str(e), "success": False}

@router.get("/user/stats")
def user_stats():
    try:
        db = next(get_db())
        total_scans = db.query(EmailScan).count()
        malicious_count = db.query(EmailScan).filter(EmailScan.label.in_(['PHISHING', 'SUSPICIOUS'])).count()
        
        return {"total_scans": total_scans, "malicious_count": malicious_count}
    except Exception as e:
        logger.error(f"User Stats Error: {e}")
        return {"total_scans": 0, "malicious_count": 0}

class FeedbackRequest(BaseModel):
    email_id: int
    label: str

@router.post("/feedback")
def submit_feedback(feedback: FeedbackRequest):
    try:
        db = next(get_db())
        new_label = feedback.label.upper()
        if new_label not in ["SAFE", "PHISHING", "SUSPICIOUS"]:
            return {"error": "Invalid label. Must be SAFE, PHISHING, or SUSPICIOUS"}
            
        update_count = db.query(EmailScan).filter(EmailScan.id == feedback.email_id).update({
            "label": new_label,
            "user_feedback_label": new_label
        }, synchronize_session=False)
        
        if update_count == 0:
            return {"error": "Email ID not found"}
            
        db.commit()
        
        logger.info(f"Feedback: email_id={feedback.email_id} marked as {new_label}")
        return {"success": True, "message": f"Email marked as {new_label}", "new_label": new_label}
    except Exception as e:
        logger.error(f"Feedback Error: {e}")
        return {"error": str(e), "success": False}
