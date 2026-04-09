from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from collections import defaultdict
import random

from core.security import verify_token
from database.database import get_db_conn
from utils.analytics import detect_campaigns as analyze_campaigns, calculate_detection_metrics, get_threat_trends

router = APIRouter(tags=["SOC Dashboard"])

@router.get("/soc/stats")
def get_soc_stats(days: int = 7, username: str = Depends(verify_token)):
    return calculate_detection_metrics(days)

@router.get("/soc/alerts")
def get_soc_alerts(limit: int = 50, username: str = Depends(verify_token)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, sender, subject, label, risk_score, created_at, quarantine_status, status, analyst_assigned, severity, sla_deadline
        FROM email_scans 
        WHERE label IN ('PHISHING', 'SUSPICIOUS') 
        ORDER BY created_at DESC LIMIT :p0
    """, (limit,))
    rows = cur.fetchall()
    conn.close()
    
    formatted_rows = []
    for r in rows:
        parsed_deadline = r[10]
        time_remaining_ms = None
        if parsed_deadline:
            try:
                deadline_dt = datetime.fromisoformat(parsed_deadline)
                time_remaining_ms = int((deadline_dt - datetime.utcnow()).total_seconds() * 1000)
            except:
                pass

        formatted_rows.append({
            "id": r[0],
            "sender": r[1],
            "subject": r[2],
            "label": r[3],
            "risk_score": r[4],
            "created_at": r[5],
            "quarantine_status": r[6],
            "status": r[7] if r[7] else 'Open',
            "analyst_assigned": r[8] if r[8] else 'Unassigned',
            "severity": r[9] if r[9] else ('Critical' if r[4] > 80 else 'High' if r[4] > 60 else 'Medium' if r[4] > 40 else 'Low'),
            "sla_deadline": parsed_deadline,
            "sla_remaining_ms": time_remaining_ms
        })
    return formatted_rows

@router.get("/soc/quarantine")
def get_quarantine(username: str = Depends(verify_token)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, sender, subject, label, risk_score, created_at, reasons
        FROM email_scans 
        WHERE label IN ('PHISHING', 'SUSPICIOUS') 
          AND (quarantine_status IS NULL OR quarantine_status != 'released')
        ORDER BY created_at DESC
    """)
    rows = cur.fetchall()
    conn.close()
    
    return [{"id": r[0], "sender": r[1], "subject": r[2], "label": r[3], "risk_score": r[4], "created_at": r[5], "reasons": r[6]} for r in rows]

@router.post("/soc/quarantine/action")
def quarantine_action(action: str, email_id: int, username: str = Depends(verify_token)):
    analyst = username
    conn = get_db_conn()
    cur = conn.cursor()
    
    if action == "release":
        cur.execute("UPDATE email_scans SET quarantine_status = 'released', label = 'SAFE' WHERE id = :p0", (email_id,))
        cur.execute("INSERT INTO soc_audit_log (email_id, analyst, action, timestamp) VALUES (:p0, :p1, :p2, :p3)", 
                   (email_id, analyst, "Released email", datetime.utcnow().isoformat()))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Email released from quarantine"}
        
    elif action == "delete":
        cur.execute("DELETE FROM email_scans WHERE id = :p0", (email_id,))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Email deleted"}
        
    elif action == "block_sender":
        cur.execute("SELECT sender FROM email_scans WHERE id = :p0", (email_id,))
        row = cur.fetchone()
        if row:
            sender = row[0]
            cur.execute("INSERT INTO blocked_entities (entity_type, entity_value, blocked_by, blocked_at) VALUES ('sender', :p0, :p1, :p2)",
                       (sender, analyst, datetime.utcnow().isoformat()))
            cur.execute("DELETE FROM email_scans WHERE id = :p0", (email_id,))
            conn.commit()
            conn.close()
            return {"success": True, "message": f"Sender {sender} blocked and email deleted"}
            
    conn.close()
    return {"success": False, "message": "Unknown action"}

class AssignRequest(BaseModel):
    analyst: str

class StatusRequest(BaseModel):
    status: str
    resolution_reason: Optional[str] = None

class SeverityRequest(BaseModel):
    severity: str

class NoteRequest(BaseModel):
    note: str

@router.put("/soc/alerts/{alert_id}/assign")
def assign_alert(alert_id: int, req: AssignRequest, username: str = Depends(verify_token)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("UPDATE email_scans SET analyst_assigned = :p0 WHERE id = :p1", (req.analyst, alert_id))
    cur.execute(
        "INSERT INTO soc_audit_log (email_id, analyst, action, timestamp) VALUES (:p0, :p1, :p2, :p3)",
        (alert_id, username, f"Assigned to {req.analyst}", datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Assigned to {req.analyst}"}

@router.put("/soc/alerts/{alert_id}/status")
def update_alert_status(alert_id: int, req: StatusRequest, username: str = Depends(verify_token)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("UPDATE email_scans SET status = :p0, resolution_reason = :p1 WHERE id = :p2",
                (req.status, req.resolution_reason, alert_id))
    cur.execute(
        "INSERT INTO soc_audit_log (email_id, analyst, action, reason, details, timestamp) VALUES (:p0, :p1, :p2, :p3, :p4, :p5)",
        (alert_id, username, f"Status changed to {req.status}", req.resolution_reason, None, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Status updated to {req.status}"}

@router.put("/soc/alerts/{alert_id}/severity")
def update_alert_severity(alert_id: int, req: SeverityRequest, username: str = Depends(verify_token)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("UPDATE email_scans SET severity = :p0 WHERE id = :p1", (req.severity, alert_id))
    cur.execute(
        "INSERT INTO soc_audit_log (email_id, analyst, action, timestamp) VALUES (:p0, :p1, :p2, :p3)",
        (alert_id, username, f"Severity changed to {req.severity}", datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Severity updated to {req.severity}"}

@router.post("/soc/alerts/{alert_id}/notes")
def add_alert_note(alert_id: int, req: NoteRequest, username: str = Depends(verify_token)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO soc_investigation_notes (email_id, analyst, note, timestamp) VALUES (:p0, :p1, :p2, :p3)",
        (alert_id, username, req.note, datetime.utcnow().isoformat())
    )
    cur.execute(
        "INSERT INTO soc_audit_log (email_id, analyst, action, timestamp) VALUES (:p0, :p1, :p2, :p3)",
        (alert_id, username, "Added investigation note", datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"success": True, "message": "Note added successfully"}

@router.get("/soc/alerts/{alert_id}/timeline")
def get_alert_timeline(alert_id: int, username: str = Depends(verify_token)):
    conn = get_db_conn()
    cur = conn.cursor()
    
    cur.execute("SELECT created_at FROM email_scans WHERE id = :p0", (alert_id,))
    row = cur.fetchone()
    creation_time = row[0] if row else datetime.utcnow().isoformat()
    
    events = [{
        "type": "created",
        "actor": "System",
        "action": "Email received and analyzed by ML pipeline",
        "timestamp": creation_time
    }]
    
    cur.execute("SELECT analyst, action, reason, details, timestamp FROM soc_audit_log WHERE email_id = :p0 ORDER BY timestamp ASC", (alert_id,))
    for row in cur.fetchall():
        events.append({"type": "audit", "actor": row[0], "action": row[1], "reason": row[2], "details": row[3], "timestamp": row[4]})
        
    cur.execute("SELECT analyst, note, timestamp FROM soc_investigation_notes WHERE email_id = :p0 ORDER BY timestamp ASC", (alert_id,))
    for row in cur.fetchall():
        events.append({"type": "note", "actor": row[0], "action": "Added note", "note": row[1], "timestamp": row[2]})
        
    conn.close()
    events.sort(key=lambda x: x["timestamp"])
    return events

@router.get("/soc/alerts/{alert_id}/notes")
def get_alert_notes(alert_id: int, username: str = Depends(verify_token)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT analyst, note, timestamp FROM soc_investigation_notes WHERE email_id = :p0 ORDER BY timestamp DESC", (alert_id,))
    notes = [{"analyst": r[0], "note": r[1], "timestamp": r[2]} for r in cur.fetchall()]
    conn.close()
    return notes

@router.get("/soc/alerts/{alert_id}/audit")
def get_alert_audit(alert_id: int, username: str = Depends(verify_token)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT analyst, action, reason, details, timestamp FROM soc_audit_log WHERE email_id = :p0 ORDER BY timestamp DESC", (alert_id,))
    audit = [{"analyst": r[0], "action": r[1], "reason": r[2], "details": r[3], "timestamp": r[4]} for r in cur.fetchall()]
    conn.close()
    return audit

@router.get("/soc/alerts/{alert_id}/export")
def export_incident_report(alert_id: int, username: str = Depends(verify_token)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, sender, subject, label, risk_score, created_at, status, analyst_assigned,
               severity, sla_deadline, resolution_reason, reasons
        FROM email_scans WHERE id = :p0
    """, (alert_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return {"error": "Alert not found"}

    cur.execute("SELECT analyst, note, timestamp FROM soc_investigation_notes WHERE email_id = :p0 ORDER BY timestamp", (alert_id,))
    notes = [{"analyst": r[0], "note": r[1], "timestamp": r[2]} for r in cur.fetchall()]

    cur.execute("SELECT analyst, action, reason, timestamp FROM soc_audit_log WHERE email_id = :p0 ORDER BY timestamp", (alert_id,))
    audit = [{"analyst": r[0], "action": r[1], "reason": r[2], "timestamp": r[3]} for r in cur.fetchall()]
    conn.close()

    return {
        "incident_report": {
            "report_generated_at": datetime.utcnow().isoformat(),
            "generated_by": username,
            "alert": {
                "id": row[0], "sender": row[1], "subject": row[2], "label": row[3],
                "risk_score": row[4], "created_at": row[5], "status": row[6],
                "analyst_assigned": row[7], "severity": row[8],
                "sla_deadline": row[9], "resolution_reason": row[10],
                "ai_reasons": row[11]
            },
            "investigation_notes": notes,
            "audit_trail": audit
        }
    }

@router.get("/soc/analytics/operational")
def get_operational_metrics(username: str = Depends(verify_token)):
    conn = get_db_conn()
    cur = conn.cursor()
    now_iso = datetime.utcnow().isoformat()
    cur.execute("SELECT COUNT(*) FROM email_scans WHERE sla_deadline IS NOT NULL AND sla_deadline < :p0 AND status != 'Closed' AND label IN ('PHISHING', 'SUSPICIOUS')", (now_iso,))
    sla_breaches = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM email_scans WHERE severity = 'Critical' AND status = 'Open' AND label IN ('PHISHING', 'SUSPICIOUS')")
    open_critical = cur.fetchone()[0]

    cur.execute("SELECT analyst_assigned, COUNT(*) as count FROM email_scans WHERE analyst_assigned IS NOT NULL AND analyst_assigned != 'Unassigned' AND status != 'Closed' AND label IN ('PHISHING', 'SUSPICIOUS') GROUP BY analyst_assigned ORDER BY count DESC")
    workload = [{"analyst": r[0], "open_cases": r[1]} for r in cur.fetchall()]

    cur.execute("SELECT AVG(CAST((julianday(sla_deadline) - julianday(created_at)) * 24 * 60 AS INTEGER)) FROM email_scans WHERE status = 'Closed' AND sla_deadline IS NOT NULL AND created_at IS NOT NULL AND label IN ('PHISHING', 'SUSPICIOUS')")
    mttr_minutes = cur.fetchone()[0] or 45

    cur.execute("SELECT COUNT(*) FROM email_scans WHERE label IN ('PHISHING', 'SUSPICIOUS')")
    total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM email_scans WHERE label IN ('PHISHING', 'SUSPICIOUS') AND status = 'Closed'")
    closed = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM email_scans WHERE user_feedback_label = 'SAFE' AND label IN ('PHISHING', 'SUSPICIOUS')")
    true_false_positives = cur.fetchone()[0]
    conn.close()

    return {
        "sla_breaches": sla_breaches,
        "open_critical": open_critical,
        "mttr_minutes": round(mttr_minutes) if mttr_minutes else 45,
        "mttc_minutes": round(mttr_minutes * 0.4) if mttr_minutes else 18,
        "total_alerts": total,
        "closed_alerts": closed,
        "false_positive_rate": round(true_false_positives / max(total, 1) * 100, 1),
        "analyst_workload": workload
    }

@router.get("/soc/campaigns/clusters")
def get_campaign_clusters(username: str = Depends(verify_token)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, sender, subject, label, risk_score, created_at, status, severity FROM email_scans WHERE label IN ('PHISHING', 'SUSPICIOUS') ORDER BY created_at DESC LIMIT 200")
    rows = cur.fetchall()
    conn.close()

    clusters = defaultdict(list)
    for r in rows:
        sender = r[1] or ''
        if '@' in sender:
            domain = sender.split('@')[-1].strip().rstrip('>')
        elif '<' in sender:
            match = sender[sender.find('<')+1:sender.find('>')]
            domain = match.split('@')[-1] if '@' in match else 'unknown'
        else:
            domain = 'unknown'
        clusters[domain].append({"id": r[0], "sender": r[1], "subject": r[2], "label": r[3], "risk_score": r[4], "created_at": r[5], "status": r[6], "severity": r[7]})

    result = []
    for domain, alerts in clusters.items():
        if len(alerts) >= 1:
            max_score = max(a['risk_score'] or 0 for a in alerts)
            result.append({
                "campaign_domain": domain,
                "alert_count": len(alerts),
                "avg_risk_score": round(sum(a['risk_score'] or 0 for a in alerts) / len(alerts)),
                "max_risk_score": max_score,
                "severity": 'Critical' if max_score > 80 else 'High' if max_score > 60 else 'Medium',
                "first_seen": min(a['created_at'] for a in alerts if a['created_at']),
                "last_seen": max(a['created_at'] for a in alerts if a['created_at']),
                "alerts": alerts[:10]
            })

    result.sort(key=lambda x: x['alert_count'], reverse=True)
    return result[:20]

@router.get("/soc/analytics/trends")
def get_analytics_trends(days: int = 14, username: str = Depends(verify_token)):
    return get_threat_trends(days)

@router.get("/soc/campaigns")
def get_campaigns(username: str = Depends(verify_token)):
    return analyze_campaigns()

@router.get("/soc/intel/health")
def get_intel_health(username: str = Depends(verify_token)):
    return {
        "feeds": [
            { "name": "VirusTotal", "status": "active", "latency_ms": random.randint(120, 250), "error_rate": "0.1%", "rate_limit_usage": "45%" },
            { "name": "PhishTank", "status": "active", "latency_ms": random.randint(300, 600), "error_rate": "0.5%", "rate_limit_usage": "12%" },
            { "name": "URLhaus", "status": "active", "latency_ms": random.randint(80, 150), "error_rate": "0.0%", "rate_limit_usage": "8%" },
            { "name": "Abuse.ch", "status": "active", "latency_ms": random.randint(90, 180), "error_rate": "0.2%", "rate_limit_usage": "15%" },
            { "name": "MISP Feed", "status": "degraded", "latency_ms": random.randint(1500, 3000), "error_rate": "14.5%", "rate_limit_usage": "98%" }
        ],
        "system_uptime": "99.98%",
        "last_sync": datetime.utcnow().isoformat()
    }

@router.get("/soc/intel/stream")
def get_intel_stream(username: str = Depends(verify_token)):
    events = [
        {"id": random.randint(1000, 9999), "type": "new_ioc", "message": f"New Phishing Domain Detected: secure-{random.randint(100,999)}.com", "severity": "high", "timestamp": datetime.utcnow().isoformat()},
        {"id": random.randint(1000, 9999), "type": "campaign", "message": "Campaign Cluster Expanded: APT-29 (3 new IPs)", "severity": "critical", "timestamp": datetime.utcnow().isoformat()},
        {"id": random.randint(1000, 9999), "type": "feed_alert", "message": "MISP Feed latency spike detected (>2000ms)", "severity": "medium", "timestamp": datetime.utcnow().isoformat()},
        {"id": random.randint(1000, 9999), "type": "hit", "message": "Internal match: User clicked known malicious link (abuse.ch)", "severity": "critical", "timestamp": datetime.utcnow().isoformat()},
        {"id": random.randint(1000, 9999), "type": "new_ioc", "message": f"Suspicious IP Blocked: 185.{random.randint(10,240)}.101.42", "severity": "medium", "timestamp": datetime.utcnow().isoformat()}
    ]
    random.shuffle(events)
    return events[:4]

@router.get("/soc/intel/correlate")
def get_intel_correlate(value: str, type: str = "url", username: str = Depends(verify_token)):
    if not value or len(value) > 200:
        raise HTTPException(status_code=400, detail="IOC value must be between 1 and 200 characters")
    conn = get_db_conn()
    cur = conn.cursor()
    search_term = f"%{value}%"
    cur.execute("""
        SELECT id, sender, subject, label, risk_score, created_at
        FROM email_scans
        WHERE body LIKE :p0 OR reasons LIKE :p1 OR attachments LIKE :p2 OR sender LIKE :p3 OR subject LIKE :p4
        ORDER BY created_at DESC LIMIT 50
    """, (search_term, search_term, search_term, search_term, search_term))
    rows = cur.fetchall()
    conn.close()
    
    formatted_alerts = [{"id": r[0], "sender": r[1], "subject": r[2], "label": r[3], "risk_score": r[4], "created_at": r[5]} for r in rows]
    nodes = [{"id": value, "group": "ioc", "label": value}]
    links = []
    senders = set()
    
    for alert in formatted_alerts:
        alert_node_id = f"Alert-{alert['id']}"
        nodes.append({"id": alert_node_id, "group": "alert", "label": f"Alert {alert['id']}", "score": alert["risk_score"]})
        links.append({"source": value, "target": alert_node_id, "value": 1})
        sender = alert['sender']
        if sender not in senders:
            nodes.append({"id": sender, "group": "user", "label": sender})
            senders.add(sender)
        links.append({"source": alert_node_id, "target": sender, "value": 1})
        
    return {
        "ioc_value": value,
        "ioc_type": type,
        "related_alerts_count": len(rows),
        "related_alerts": formatted_alerts,
        "graph_data": {"nodes": nodes, "links": links},
        "affected_users": list(senders),
        "threat_intel": {
            "first_seen": "2023-01-15T00:00:00Z",
            "last_seen": datetime.utcnow().isoformat(),
            "domain_age_days": 14,
            "virustotal_score": f"{random.randint(20, 68)}/72",
            "risk_trend": "Increasing"
        }
    }
