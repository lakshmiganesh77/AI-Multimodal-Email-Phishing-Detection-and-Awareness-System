import re
from core.rules.constants import PHISHING_KEYWORDS, TRUSTED_DOMAINS, BRAND_DOMAINS

def rule_based_analysis(email_data: dict):
    # Extract text and headers
    headers = email_data.get('headers', {})
    subject = email_data.get('subject', '') or headers.get('subject', '')
    if not subject and isinstance(headers, dict):
        subject = headers.get("Subject", "")

    body = email_data.get('body', '') or email_data.get('body_text', '')
    text = f"{subject} {body}".lower()
    
    # Extract Sender Details
    raw_sender = headers.get("from", "") or headers.get("From", "")
    sender_email = ""
    sender_name = ""
    
    curr_match = re.search(r'(.*)<(.*)>', raw_sender)
    if curr_match:
        sender_name = curr_match.group(1).strip().lower()
        sender_email = curr_match.group(2).strip().lower()
    else:
        sender_email = raw_sender.strip().lower()

    is_trusted_sender = any(sender_email.endswith(domain) for domain in TRUSTED_DOMAINS)
    
    # Dynamic Trust Engine
    if not is_trusted_sender and sender_email:
        auth_res = headers.get("authentication_results", "").lower()
        spf_res = headers.get("received_spf", "").lower()
        
        has_auth = "dmarc=pass" in auth_res or "dkim=pass" in auth_res or "spf=pass" in auth_res or "spf=pass" in spf_res
        is_public = any(sender_email.endswith(d) for d in ["@gmail.com", "@yahoo.com", "@hotmail.com", "@outlook.com", "@icloud.com"])
        
        if has_auth and not is_public:
            sender_domain_parts = sender_email.split('@')
            if len(sender_domain_parts) == 2:
                sender_domain_str = sender_domain_parts[1]
                try:
                    from services.url_analysis import domain_age_days
                    age = domain_age_days(sender_domain_str)
                    if age is not None and age > 360:
                        is_trusted_sender = True
                except Exception:
                    pass
    
    # Build evaluation context
    context = {
        "text": text,
        "headers": headers,
        "sender_email": sender_email,
        "sender_name": sender_name,
        "is_trusted_sender": is_trusted_sender,
        "is_first_time_sender": email_data.get("is_first_time_sender", False)
    }

    # Evaluate all object-oriented rules
    from core.rules.evaluator import RuleEvaluator
    evaluator = RuleEvaluator()
    result = evaluator.evaluate_all(email_data, context)
    
    # Extra rules that didn't fit easily but need execution
    score = result["score"]
    reasons = result["reasons"]
    features = result["features"]
    
    if re.search(r"http[s]?://[^\s]+", text):
        if re.search(r"http[s]?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", text):
            score += 35
            reasons.append("IP-based URL detected (highly suspicious)")
        shorteners = ["bit.ly", "tinyurl", "goo.gl", "ow.ly", "t.co", "is.gd"]
        if any(shortener in text for shortener in shorteners):
            score += 15
            reasons.append("URL shortener detected")
            
    # Calculate confidence based on hits
    confidence = 1.0 if score > 0 else 0.5
    features["rule_score"] = float(score)

    return {
        "score": float(score),
        "confidence": float(confidence),
        "features": features,
        "reasons": reasons,
        "is_trusted_sender": is_trusted_sender 
    }
