import os
import json

# --- CONFIGURATION (UPDATED) ---
# Weighted Formula Co-efficients (Layer 7)
# Must sum to approx 1.0
W_ML = 0.30      # WAS 0.40
W_RULES = 0.20   # NEW: Rules are now a core component
W_URL = 0.20     # WAS 0.25
W_ATT = 0.15     # WAS 0.20
W_IMG = 0.15     # WAS 0.15

# Thresholds
TH_PHISHING = 70
TH_SUSPICIOUS = 40

def aggregate_features(analysis_parts):
    """
    Layer 6: Heuristic Aggregation
    Aggregates features into a unified vector.
    """
    # Extract component outputs
    ml = analysis_parts.get("ml", {})
    url = analysis_parts.get("url", {})
    att = analysis_parts.get("attachment", {})
    img = analysis_parts.get("image", {})
    rules = analysis_parts.get("rules", {})

    # Build Unified Feature Vector
    features = {
        # ML Features
        "ml_prob": ml.get("features", {}).get("ensemble_prob", 0.0),
        "bert_prob": ml.get("features", {}).get("bert_prob", 0.0),
        
        # URL Features
        "num_urls": url.get("features", {}).get("num_urls", 0),
        "url_risk_score": url.get("score", 0),
        "brand_similarity": url.get("features", {}).get("brand_similarity_score", 0.0),
        "is_impersonation": url.get("features", {}).get("impersonation_detected", 0) or rules.get("features", {}).get("is_impersonation", 0),
        "vt_hits": url.get("features", {}).get("vt_hits", 0),
        
        # Attachment Features
        "num_attachments": att.get("features", {}).get("num_attachments", 0),
        "attachment_risk_score": att.get("score", 0),
        "has_executable": att.get("features", {}).get("has_executable", 0),
        "pdf_js": att.get("features", {}).get("pdf_js_detected", 0),
        
        # Image Features
        "image_count": img.get("features", {}).get("image_count", 0),
        "image_risk_score": img.get("score", 0),
        "qr_links": img.get("features", {}).get("qr_links", 0),
        "detected_logos": img.get("features", {}).get("detected_logos", 0),
        
        # Rule Features
        "rule_score": rules.get("features", {}).get("rule_score", 0),
        "keyword_matches": rules.get("features", {}).get("keyword_matches", 0),
        "financial_scam": rules.get("features", {}).get("financial_scam", 0),
        "urgency": rules.get("features", {}).get("urgency_level", 0),
        "intent_urgency": rules.get("features", {}).get("intent_urgency_score", 0.0),
        "intent_financial": rules.get("features", {}).get("intent_financial_score", 0.0),
        "intent_credential": rules.get("features", {}).get("intent_credential_score", 0.0)
    }
    return features

def decide(parsed_email, analysis_parts):
    """
    Layer 7: Decision Engine
    Calculates final risk score and label.
    """
    reasons = []
    
    # 1. Heuristic Aggregation
    features = aggregate_features(analysis_parts)
    
    # 2. Extract Scores for Weights
    # Ensure scores are floats
    s_ml = float(analysis_parts.get("ml", {}).get("score", 0))
    s_url = float(analysis_parts.get("url", {}).get("score", 0))
    s_att = float(analysis_parts.get("attachment", {}).get("score", 0))
    s_img = float(analysis_parts.get("image", {}).get("score", 0))
    s_rules = float(analysis_parts.get("rules", {}).get("score", 0)) # NEW
    
    # 3. Apply Weighted Formula (Standardized)
    # Final Score = 0.3*ML + 0.2*RULES + 0.2*URL + 0.15*ATT + 0.15*IMG
    base_score = (W_ML * s_ml) + (W_RULES * s_rules) + (W_URL * s_url) + (W_ATT * s_att) + (W_IMG * s_img)
    
    # 4. Critical Overrides (Safety Net)
    # The weighted average might dilute a specific CRITICAL indicator.
    # If any specific high-confidence indicator is found, we boost the score.
    
    final_score = base_score
    override_reasons = []

    # --- BEHAVIORAL ZERO-TRUST MATRIX (NEW) ---
    # Phishing requires both a WEAPON (Attack Surface) and a MOTIVE (Intent).
    
    # 1. DEFINE INTENT (The "Why")
    has_high_intent = (
        features.get("intent_urgency", 0) > 0 or 
        features.get("intent_financial", 0) > 0 or 
        features.get("intent_credential", 0) > 0 or
        features.get("keyword_matches", 0) >= 3 or # High density of phishing keywords
        (features.get("ml_prob", 0) > 0.70) # ML often catches complex psychological manipulation
    )
    
    # 2. DEFINE ATTACK SURFACE (The "Weapon / How")
    has_attack_surface = (
        features.get("url_risk_score", 0) >= 80 or
        features.get("vt_hits", 0) > 0 or
        features.get("has_executable", 0) > 0 or
        features.get("pdf_js", 0) > 0 or
        features.get("is_impersonation", 0) > 0 or # Impersonation implies malicious link/intent
        features.get("html_forms", 0) > 0 or       # In-line credential harvesting
        features.get("detected_logos", 0) > 0      # Visual identity spoofing
    )
    
    # Extract Trust Flag for Matrix Execution
    is_trusted = analysis_parts.get("rules", {}).get("is_trusted_sender", False)

    # 3. APPLY MATRIX LOGIC
    # SCENARIO A: HIGH RISK PHISHING (Weapon + Motive)
    if has_attack_surface and has_high_intent:
        if final_score < 85:
            final_score = max(final_score, 85)
            override_reasons.append("🚨 CRITICAL BEHAVIOR: Email combines urgent/financial pressure with a dangerous attack surface (links/attachments).")
            
    # SCENARIO B: SPAM / SUSPICIOUS (Motive but NO Weapon)
    elif has_high_intent and not has_attack_surface:
        # It's trying to manipulate you, but there's no technical way for it to hack you. 
        # (e.g. Scummy marketing, plain-text scam, or just an aggressive corporate email)
        if final_score >= TH_PHISHING:
            # Downgrade to Suspicious
            final_score = 65
            override_reasons.append("🛡️ BEHAVIORAL DOWNGRADE: Email uses high-pressure language, but contains NO malicious links or attachments (Likely Spam/Marketing).")
        elif final_score < TH_SUSPICIOUS:
            # Upgrade purely text-based social engineering (BEC Scams)
            if features.get("intent_financial", 0) > 0 or features.get("intent_credential", 0) > 0 or features.get("keyword_matches", 0) >= 3:
                final_score = max(final_score, 60)
                override_reasons.append("🛡️ SOCIAL ENGINEERING: Email lacks links, but strongly demands action using high-risk keywords (Possible BEC/Fraud).")
            elif features.get("intent_urgency", 0) >= 0.4: # Require at least 2 urgency words to upgrade a safe email
                final_score = max(final_score, 45)
                override_reasons.append("🛡️ SUSPICIOUS TEXT: Email shows unusually high urgency/pressure tactics without context.")
            
    # SCENARIO C: SAFE BUT FLAGGED (Weapon but NO Motive)
    elif has_attack_surface and not has_high_intent:
        # A newsletter with lots of links, or a safe corporate alert.
        # Only override if the attack surface is explicitly identified as malware (VT Hits)
        if features.get("vt_hits", 0) > 0 or features.get("has_executable", 0) > 0:
            final_score = 100
            override_reasons.append("🚨 CRITICAL: Definitive Malware/Blacklisted Link detected. Overriding to Phishing.")
        elif features.get("is_impersonation", 0) > 0:
             final_score = max(final_score, 75)
             override_reasons.append("🚨 CRITICAL: Brand Impersonation detected.")
        elif features.get("detected_logos", 0) > 0 and not is_trusted:
             final_score = max(final_score, 65)
             override_reasons.append("🚨 WARNING: Known brand logo detected in an unauthenticated email.")
        else:
            # If it's just URL shorteners or IPs without malicious intent
            pass
            
    # SCENARIO D: THE "TRUSTED" EXCEPTION
    # We still allow perfectly authenticated, >1yr old domains to bypass generic heuristic scoring
    # unless they have a literal virus.
    if is_trusted:
        if features.get("vt_hits", 0) == 0 and not features.get("has_executable", 0):
            final_score = 0
            override_reasons.append("✅ Dynamic Trust: Verified, established institutional sender. Automatically marked as SAFE.")

    # SCENARIO E: BENIGN EMAIL SAFEGUARD (NEW)
    # If the email has no links/attachments AND no high intent, it's just plain text.
    # Prevent weak ML or rule scores from pushing it over the suspicious threshold.
    if not has_attack_surface and not has_high_intent:
        if final_score >= TH_SUSPICIOUS and final_score < 75:
            final_score = min(final_score, 35) # Keep it safe
            # No override reason appended to keep the UI clean

    # SCENARIO F: IMAGE-ONLY FAIL-CLOSE (NEW)
    # If the email is predominantly images with very little text, and OCR failed or found nothing,
    # it is a strong indicator of an Image-Only Phishing evasion tactic.
    body_text_len = len(parsed_email.get("body_text", parsed_email.get("body", "")))
    num_images = features.get("image_count", 0)
    ocr_text_len = len(analysis_parts.get("image", {}).get("meta", {}).get("extracted_text", ""))
    
    if num_images > 0 and body_text_len < 100:
        if ocr_text_len < 15: # OCR failed or found almost no text
            final_score += 40
            override_reasons.append("🚨 EVASION TACTIC: Image-only email with no readable text (OCR Bypass Attempt).")

    # 5. Collect Reasons
    if override_reasons:
        reasons.extend(override_reasons)
        
    # Append component reasons (and deduplicate)
    all_reasons = []
    all_reasons.extend(analysis_parts.get("rules", {}).get("reasons", []))
    all_reasons.extend(analysis_parts.get("url", {}).get("reasons", []))
    all_reasons.extend(analysis_parts.get("attachment", {}).get("reasons", []))
    all_reasons.extend(analysis_parts.get("image", {}).get("reasons", []))
    all_reasons.extend(analysis_parts.get("ml", {}).get("reasons", []))
    
    # Deduplicate 
    seen = set()
    unique_reasons = []
    for r in reasons + all_reasons:
        if r not in seen:
            unique_reasons.append(r)
            seen.add(r)

    # 6. Determine Label & Color
    final_score = min(float(final_score), 100.0)
    
    if final_score >= TH_PHISHING:
        label = "PHISHING"
        color = "RED"
    elif final_score >= TH_SUSPICIOUS:
        label = "SUSPICIOUS"
        color = "YELLOW"
    else:
        label = "SAFE"
        color = "GREEN"
        
        # UX FIX: If email is Safe, suppress confusing "AI flagged suspicious" warnings
        # unless it was a massive anomaly (which would have triggered overrides anyway).
        # This prevents the "Green check but Orange text" confusion.
        unique_reasons = [r for r in unique_reasons if "AI Analysis flagged" not in r]

    return {
        "risk_score": int(final_score),
        "label": label,
        "color": color,
        "reasons": unique_reasons[:10], # Limit to top 10 reasons
        "features": features, 
        "ml_probability": int(features.get("ml_prob", 0) * 100) # For UI compatibility
    }
