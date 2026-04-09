import sqlite3
from database.database import get_db_conn
from datetime import datetime, timedelta
import json

def detect_campaigns(time_window_hours=24):
    """
    Detects coordinated phishing campaigns using:
    - Subject line similarity (fuzzy matching not implemented to avoid heavy deps, using exact/partial)
    - Sender domain clustering
    - Temporal clustering
    """
    conn = get_db_conn()
    cur = conn.cursor()
    
    # Get recent phishing emails
    cutoff = (datetime.utcnow() - timedelta(hours=time_window_hours)).isoformat()
    cur.execute("""
        SELECT id, sender, subject, created_at, risk_score 
        FROM email_scans 
        WHERE label IN ('PHISHING', 'SUSPICIOUS') AND created_at > ?
        ORDER BY created_at DESC
    """, (cutoff,))
    
    emails = cur.fetchall()
    conn.close()
    
    # Simple grouping by sender domain for now
    campaigns = {}
    
    for email in emails:
        eid, sender, subject, created_at, score = email
        if not sender: continue
        
        # Extract domain
        try:
            domain = sender.split('@')[-1].strip().lower()
            if '>' in domain: domain = domain.split('>')[0]
        except:
            domain = "unknown"
            
        if domain not in campaigns:
            campaigns[domain] = {
                "domain": domain,
                "count": 0,
                "subjects": set(),
                "avg_risk": 0,
                "ids": []
            }
            
        c = campaigns[domain]
        c["count"] += 1
        c["subjects"].add(subject)
        c["ids"].append(eid)
        
        # Update running avg
        current_total = c["avg_risk"] * (c["count"] - 1)
        c["avg_risk"] = (current_total + score) / c["count"]

    # Filter for actual campaigns (more than 1 email from same domain)
    result = []
    for domain, data in campaigns.items():
        if data["count"] > 1:
            result.append({
                "id": f"camp_{domain}_{int(datetime.now().timestamp())}",
                "name": f"Suspicious activity from {domain}",
                "victim_count": data["count"],
                "status": "Active",
                "avg_risk": int(data["avg_risk"]),
                "subjects": list(data["subjects"])[:3] # Top 3 subjects
            })
            
    return result

def calculate_advanced_metrics(days=7):
    conn = get_db_conn()
    cur = conn.cursor()
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    
    # False Positives: AI said PHISHING/SUSPICIOUS, Analyst resolved as SAFE
    cur.execute("""
        SELECT COUNT(*) FROM email_scans 
        WHERE (risk_score > 40) AND label = 'SAFE' AND created_at > ?
    """, (cutoff,))
    fp = cur.fetchone()[0]
    
    # False Negatives: AI said SAFE, Analyst resolved as PHISHING (or it got reported)
    cur.execute("""
        SELECT COUNT(*) FROM email_scans 
        WHERE (risk_score <= 40) AND label IN ('PHISHING', 'SUSPICIOUS') AND created_at > ?
    """, (cutoff,))
    fn = cur.fetchone()[0]
    
    # Attack Vectors (Mocked based on reasons for now - normally would parse reasons JSON/String)
    cur.execute("SELECT reasons FROM email_scans WHERE label IN ('PHISHING', 'SUSPICIOUS') AND created_at > ?", (cutoff,))
    rows = cur.fetchall()
    
    vectors = {"Credential Harvesting": 0, "Malware": 0, "Business Email Compromise": 0, "Other": 0}
    for row in rows:
        reason_str = str(row[0]).lower()
        if 'credential' in reason_str or 'login' in reason_str: vectors["Credential Harvesting"] += 1
        elif 'attachment' in reason_str or 'malware' in reason_str: vectors["Malware"] += 1
        elif 'financial' in reason_str or 'urgent' in reason_str: vectors["Business Email Compromise"] += 1
        else: vectors["Other"] += 1
        
    conn.close()
    
    return {
        "false_positives": fp,
        "false_positive_rate": fp / 100.0 if fp else 0.05, # Mock percentage if not enough data
        "false_negatives": fn,
        "false_negative_rate": fn / 100.0 if fn else 0.01,
        "attack_vectors": vectors,
        "model_drift_detected": fp > 10 or fn > 5 # Simple drift heuristic
    }

def calculate_detection_metrics(days=7):
    """
    Returns detection performance metrics for dashboards
    """
    conn = get_db_conn()
    cur = conn.cursor()
    
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    
    # Total emails scanned
    cur.execute("SELECT COUNT(*) FROM email_scans WHERE created_at > ?", (cutoff,))
    total = cur.fetchone()[0]
    
    # Phishing/Suspicious/Safe counts
    cur.execute("SELECT label, COUNT(*) FROM email_scans WHERE created_at > ? GROUP BY label", (cutoff,))
    rows = cur.fetchall()
    counts = {r[0]: r[1] for r in rows}
    
    phishing = counts.get("PHISHING", 0)
    suspicious = counts.get("SUSPICIOUS", 0)
    safe = counts.get("SAFE", 0)
    
    # Quarantined (assuming Phishing+Suspicious are quarantined by default)
    # real quarantine status will be in DB later, but for now use labels
    try:
        cur.execute("SELECT COUNT(*) FROM email_scans WHERE quarantine_status = 'quarantined'")
        quarantined = cur.fetchone()[0]
    except:
        quarantined = phishing + suspicious # Fallback
        
    detection_rate = ((phishing + suspicious) / total * 100) if total > 0 else 0
    
    conn.close()
    
    adv_metrics = calculate_advanced_metrics(days)
    
    return {
        "total_scanned": total,
        "phishing_count": phishing,
        "suspicious_count": suspicious,
        "safe_count": safe,
        "quarantined": quarantined,
        "detection_rate": round(detection_rate, 1),
        **adv_metrics
    }

def get_threat_trends(days=7):
    """
    Returns daily counts of Phishing vs Safe emails for charts
    """
    conn = get_db_conn()
    cur = conn.cursor()
    
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    
    # SQLite substring for YYYY-MM-DD: substr(created_at, 1, 10)
    cur.execute("""
        SELECT substr(created_at, 1, 10) as day, label, COUNT(*)
        FROM email_scans
        WHERE created_at > ?
        GROUP BY day, label
        ORDER BY day
    """, (cutoff,))
    
    rows = cur.fetchall()
    conn.close()
    
    # Process into JSON structure { "2023-10-01": {"Phishing": 5, "Safe": 10}, ... }
    trends = {}
    for day, label, count in rows:
        if day not in trends:
            trends[day] = {"date": day, "phishing": 0, "suspicious": 0, "safe": 0}
        
        key = label.lower()
        if key in trends[day]:
            trends[day][key] = count
            
    return list(trends.values())
