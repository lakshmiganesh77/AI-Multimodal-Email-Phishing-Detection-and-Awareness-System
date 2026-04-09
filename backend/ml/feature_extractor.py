import numpy as np

def extract_features(analysis_parts):
    """
    Consolidates outputs from all analysis engines into a single feature vector.
    
    Args:
        analysis_parts (dict): Output from main.py's analysis aggregation.
                               Contains keys: 'rules', 'url', 'image', 'attachment', 'ml'
                               
    Returns:
        dict: {
            "vector": list[float], # The input for the model
            "names": list[str],    # Feature names for explainability
            "debug": dict          # Readable features
        }
    """
    
    # 0. Base Data / Context
    # We expect `parsed_email` or `raw_data` to be somewhere in the context, but let's extract from what we have.
    # We will assume that main.py passes `parsed_email` info down or we extract from what's available here.
    # main.py passes `analysis_parts["email"]` if we updated it, but currently it only gets rules,url,image,attachment,ml.
    # So we will extract what we can from those 5 layers.
    
    # 1. URL Features (Layer 3)
    url_data = analysis_parts.get("url") or {}
    url_score = url_data.get("score", 0)
    url_meta = url_data.get("features") or {}
    num_urls = url_meta.get("num_urls", 0)
    has_malicious_url = 1 if url_meta.get("vt_hits", 0) > 0 or url_meta.get("phishtank_hits", 0) > 0 else 0
    brand_similarity_score = url_meta.get("brand_similarity_score", 0.0)
    young_domains = url_meta.get("young_domains", 0)
    shortened_count = url_meta.get("shortened_count", 0)

    # 2. Image Features (Layer 6)
    img_data = analysis_parts.get("image") or {}
    img_score = img_data.get("score", 0)
    img_meta = img_data.get("meta") or {}
    has_qr = 1 if img_meta.get("qr_found", 0) > 0 else 0
    has_img_ocr = 1 if img_meta.get("ocr_text_combined") else 0

    # 3. Attachment Features (Layer 5)
    att_data = analysis_parts.get("attachment") or {}
    att_score = att_data.get("score", 0)
    att_meta = att_data.get("features") or {}
    num_attachments = att_meta.get("num_attachments", 0)
    has_exec = att_meta.get("has_executable", 0)
    entropy_avg = att_meta.get("entropy_avg", 0.0)
    pdf_js_detected = att_meta.get("pdf_js_detected", 0)

    # 4. ML & Rules (Layer 4 & 1/2/9)
    ml_data = analysis_parts.get("ml") or {}
    ml_prob = ml_data.get("score", 0) / 100.0 # Normalize 0-100 to 0-1
    bert_prob = (ml_data.get("features") or {}).get("bert_prob", 0.0)
    lstm_prob = (ml_data.get("features") or {}).get("lstm_prob", 0.0)
    
    rule_data = analysis_parts.get("rules") or {}
    rule_score = rule_data.get("score", 0)
    rule_meta = rule_data.get("features") or {}
    
    # Identity / Authenticity (Layer 1 & 2)
    auth_spf_pass = rule_meta.get("auth_spf_pass", 0)
    auth_dkim_pass = rule_meta.get("auth_dkim_pass", 0)
    auth_dmarc_pass = rule_meta.get("auth_dmarc_pass", 0)
    is_homograph = rule_meta.get("is_homograph", 0)
    reply_to_mismatch = rule_meta.get("reply_to_mismatch", 0)

    # Intent (Layer 4)
    intent_urgency = rule_meta.get("intent_urgency_score", 0.0)
    intent_financial = rule_meta.get("intent_financial_score", 0.0)
    intent_credential = rule_meta.get("intent_credential_score", 0.0)
    
    # Needs to get HTML features from email_root in main.py, but for now we default 0 if not passed
    # We will assume `analysis_parts["html"]` was added by main.py
    html_data = analysis_parts.get("html", {})
    html_forms = html_data.get("has_forms", 0)
    html_iframes = html_data.get("has_iframes", 0)
    zw_count = html_data.get("zero_width_count", 0)

    # Behavioral (Layer 9) defaults 0 for now until DB integrated
    is_first_time_sender = analysis_parts.get("behavior", {}).get("is_first_time_sender", 0)

    # --- 30 FEATURE VECTOR OUT ---
    # Order MUST remain consistent for training and inference
    features = [
        # Domain/Auth (5)
        auth_spf_pass, auth_dkim_pass, auth_dmarc_pass, is_homograph, reply_to_mismatch,
        # URL (6)
        num_urls, shortened_count, young_domains, brand_similarity_score, has_malicious_url, url_score,
        # Intent (4)
        intent_urgency, intent_financial, intent_credential, rule_score,
        # HTML/Format (3)
        html_forms, html_iframes, zw_count,
        # Payload/Attachment (5)
        num_attachments, has_exec, entropy_avg, pdf_js_detected, att_score,
        # Image (3)
        has_qr, has_img_ocr, img_score,
        # Behavior (1)
        is_first_time_sender,
        # ML Base Models (3)
        bert_prob, lstm_prob, ml_prob
    ]
    
    feature_names = [
        "auth_spf_pass", "auth_dkim_pass", "auth_dmarc_pass", "is_homograph", "reply_to_mismatch",
        "num_urls", "shortened_count", "young_domains", "brand_similarity_score", "has_malicious_url", "url_score",
        "intent_urgency", "intent_financial", "intent_credential", "rule_score",
        "html_forms", "html_iframes", "zw_count",
        "num_attachments", "has_exec", "entropy_avg", "pdf_js_detected", "att_score",
        "has_qr", "has_img_ocr", "img_score",
        "is_first_time_sender",
        "bert_prob", "lstm_prob", "ml_prob"
    ]

    return {
        "vector": features,
        "names": feature_names,
        "debug": dict(zip(feature_names, features))
    }
