import re
import tldextract
import json
import os
import difflib
from datetime import datetime
from bs4 import BeautifulSoup

try:
    import whois
except ImportError:
    whois = None

# --- CONFIGURATION ---
SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "bit.do", "b.link"
}

SUSPICIOUS_TLDS = {
    "xyz", "top", "click", "buzz", "cam", "vip", "stream", "icu", "date", "live"
}

# Common Substitutions for IDN Homoglyph Attacks
HOMOGLYPH_MAP = {
    '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '6': 'g', '7': 't', 
    '@': 'a', '$': 's', '!': 'i', 'α': 'a', 'ρ': 'p', 'τ': 't', 'ο': 'o', 'ν': 'n'
}

TARGET_BRANDS = [
    "paypal", "google", "microsoft", "apple", "amazon", "facebook", "netflix", 
    "chase", "wellsfargo", "bankofamerica", "linkedin", "dropbox", "adobe"
]

BLACKLIST_FILE = os.path.join(os.path.dirname(__file__), "blacklist.json")

def load_blacklist():
    if os.path.exists(BLACKLIST_FILE):
        try:
            with open(BLACKLIST_FILE, "r") as f:
                return set(json.load(f))
        except:
            return set()
    return set()

def normalize_homoglyphs(domain: str) -> str:
    """
    Decodes IDN (punycode) and normalizes homoglyphs (e.g. g00gle -> google)
    """
    # 1. Decode Punycode (xn--)
    try:
        domain = domain.encode('idna').decode('utf-8')
    except Exception:
        pass # Not punycode, or invalid
        
    # 2. Homoglyph Substitution
    normalized = []
    for char in domain.lower():
        normalized.append(HOMOGLYPH_MAP.get(char, char))
    
    return "".join(normalized)

def check_brand_similarity(domain: str, normalized_domain: str):
    """
    Detects if a domain tries to look like a target brand.
    Returns: (is_impersonation, target_brand, similarity_score)
    """
    # Extract main part (e.g. "paypal-secure" from "paypal-secure.com")
    ext = tldextract.extract(domain)
    main_domain = ext.domain
    
    # 1. Check Normalized Version (resolves "paypa1")
    norm_ext = tldextract.extract(normalized_domain)
    norm_main = norm_ext.domain
    
    best_match = None
    highest_score = 0.0
    
    for brand in TARGET_BRANDS:
        # Skip if legitimate (exact match)
        if main_domain == brand:
            return False, brand, 0.0
            
        # Sequence Matcher on Normalized Domain
        ratio = difflib.SequenceMatcher(None, norm_main, brand).ratio()
        
        if ratio > highest_score:
            highest_score = ratio
            best_match = brand
            
    # Thresholds
    if highest_score > 0.85: # Very high similarity (typosquatting)
        return True, best_match, highest_score
        
    return False, None, highest_score

from functools import lru_cache
import concurrent.futures

@lru_cache(maxsize=1000)
def domain_age_days(domain: str):
    if not whois: return None
    try:
        # Some whois modules don't support timeout natively easily, so we rely on system sockets or futures timeout
        w = whois.whois(domain)
        created = w.creation_date
        if isinstance(created, list): created = created[0]
        if not created: return None
        return (datetime.utcnow() - created).days
    except:
        return None

def analyze_urls(email_data: dict):
    """
    Layer 2: URL Analysis Engine
    Returns standardized multimodal response.
    """
    urls = email_data.get("urls", [])
    
    score = 0
    reasons = []
    features = {
        "num_urls": len(urls),
        "young_domains": 0,
        "shortened_count": 0,
        "brand_similarity_score": 0.0,
        "impersonation_detected": 0,
        "vt_hits": 0,
        "phishtank_hits": 0
    }
    
    if not urls:
        return {
            "score": 0.0,
            "confidence": 0.0,
            "features": features,
            "reasons": []
        }

    blacklist = load_blacklist()
    # Lazy import to avoid circular dep
    from core.threat_intel import virustotal_url_check, phishtank_url_check, unwrap_redirects
    
    processed_count = 0
    max_brand_score = 0.0
    
    # Anchor Link Mismatch (Visual trickery)
    html_body = email_data.get("body_html", "")
    if html_body:
        try:
            soup = BeautifulSoup(html_body, "html.parser")
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                text = a_tag.get_text(strip=True)
                
                # Check if the text itself looks like a URL but differs from href
                if text.startswith("http") or "www." in text or ".com" in text:
                    text_ext = tldextract.extract(text)
                    href_ext = tldextract.extract(href)
                    text_domain = f"{text_ext.domain}.{text_ext.suffix}".strip('.')
                    href_domain = f"{href_ext.domain}.{href_ext.suffix}".strip('.')
                    
                    if text_domain and href_domain and text_domain != href_domain:
                        if text_domain not in href_domain:
                            score += 65
                            reasons.append(f"Visual Link Mismatch: Text shows '{text_domain}' but actually links to '{href_domain}'")
                            break # Top-level alert
        except Exception:
            pass

    # PRE-FETCH WHOIS DOMAIN AGES CONCURRENTLY TO PREVENT BLOCKING I/O
    domain_to_check = []
    for url in set(urls[:5]):
        ext = tldextract.extract(url)
        domain_to_check.append(f"{ext.domain}.{ext.suffix}")
        
    domain_ages = {}
    if whois and domain_to_check:
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_domain = {executor.submit(domain_age_days, d): d for d in domain_to_check}
            for future in concurrent.futures.as_completed(future_to_domain, timeout=5):
                domain = future_to_domain[future]
                try:
                    domain_ages[domain] = future.result()
                except Exception:
                    domain_ages[domain] = None

    unique_urls = list(set(urls[:5]))  # Top 5 unique URLs
    final_urls_to_scan = []
    
    # 1. PRE-UNWRAP SHORTENERS BEFORE THREAT INTEL
    for url in unique_urls:
         ext = tldextract.extract(url)
         domain = f"{ext.domain}.{ext.suffix}"
         if domain in SHORTENERS:
             unwrap_result = unwrap_redirects(url)
             if unwrap_result.get("redirected") and unwrap_result.get("final_url"):
                 final_url = unwrap_result["final_url"]
                 final_urls_to_scan.append(final_url)
                 reasons.append(f"Shortened URL '{domain}' unmasks to: {final_url}")
             else:
                 final_urls_to_scan.append(url) # Keep original if failed
                 if unwrap_result.get("error"):
                      score += 30
                      reasons.append(f"URL Redirection Error: {unwrap_result['error']}")
         else:
             final_urls_to_scan.append(url)

    # --- PARALLEL THREAT INTEL (VT + PhishTank fired concurrently for ALL URLs) ---
    def vt_check_task(original, final):
        return original, "vt", virustotal_url_check(final)

    def pt_check_task(original, final):
        return original, "pt", phishtank_url_check(final)

    threat_intel_results = {}  # { original_url: {"vt": ..., "pt": ...} }
    for u in unique_urls:
        threat_intel_results[u] = {}

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        ti_futures = []
        for i, orig_url in enumerate(unique_urls):
            final_url = final_urls_to_scan[i]
            ti_futures.append(executor.submit(vt_check_task, orig_url, final_url))
            ti_futures.append(executor.submit(pt_check_task, orig_url, final_url))
            
        for future in concurrent.futures.as_completed(ti_futures, timeout=8):
            try:
                url_key, check_type, result = future.result()
                threat_intel_results[url_key][check_type] = result
            except Exception:
                pass  # Timeout or connection error – skip gracefully

    for url in unique_urls:
        processed_count += 1

        # Extract Domain
        ext = tldextract.extract(url)
        domain = f"{ext.domain}.{ext.suffix}"

        # URL Length Anomaly
        if len(url) > 150:
            score += 20
            reasons.append(f"Suspiciously long URL detected ({len(url)} chars)")

        # Suspicious TLD check
        if ext.suffix.lower() in SUSPICIOUS_TLDS:
            score += 35
            reasons.append(f"High-Risk TLD detected: .{ext.suffix} ({domain})")

        # 1. Normalization & Homoglyphs
        norm_domain = normalize_homoglyphs(domain)

        # 2. Blacklist Check
        if url in blacklist or domain in blacklist:
            score += 100
            reasons.append(f"CRITICAL: URL in Blacklist ({domain})")
            continue

        # 3. Shortener Check
        if domain in SHORTENERS:
            features["shortened_count"] += 1
            score += 20
            reasons.append(f"Shortened URL detected: {domain}")

        # 4. Brand Similarity / Typosquatting
        is_imp, target, sim_score = check_brand_similarity(domain, norm_domain)
        max_brand_score = max(max_brand_score, sim_score)

        if is_imp:
            features["impersonation_detected"] = 1
            score += 75
            reasons.append(f"Typosquatting/Impersonation detected: '{domain}' ~ '{target}'")

        # 5. Domain Age (Using pre-fetched parallel results)
        age = domain_ages.get(domain)
        if age is not None:
            if age < 30:
                features["young_domains"] += 1
                score += 30
                reasons.append(f"New domain (<30 days): {domain}")
            elif age < 90:
                score += 10

        # 6. VirusTotal result (already fetched in parallel above)
        vt_res = threat_intel_results.get(url, {}).get("vt") or {}
        if vt_res:
            if vt_res.get("malicious", 0) > 0:
                features["vt_hits"] += vt_res["malicious"]
                score += 100
                reasons.append(f"VirusTotal: Flagged by {vt_res['malicious']} vendors ({domain})")
            elif vt_res.get("unseen_zero_day"):
                score += 15
                reasons.append(f"Warning: URL has never been scanned by VirusTotal (Potential Zero-Day)")
            elif vt_res.get("error") and "Quota" in str(vt_res.get("error", "")):
                reasons.append(f"Warning: VirusTotal URL scan skipped (Quota/Rate Limit reached)")

        # 7. PhishTank result (already fetched in parallel above)
        pt_res = threat_intel_results.get(url, {}).get("pt") or {}
        if pt_res:
            if pt_res.get("results", {}).get("in_database") and pt_res["results"].get("valid"):
                features["phishtank_hits"] += 1
                score += 100
                reasons.append(f"PhishTank: Confirmed Phishing Site ({domain})")

        # 8. Suspicious Keywords in URL path
        if any(w in url.lower() for w in ["login", "verify", "secure", "update", "account", "signin"]):
            score += 15
            reasons.append(f"Suspicious auth keywords in URL: {domain}")

    features["brand_similarity_score"] = float(max_brand_score)
    
    # Calculate Confidence based on depth of analysis
    confidence = 0.5
    if features["vt_hits"] > 0 or features["phishtank_hits"] > 0: confidence = 1.0
    elif features["impersonation_detected"]: confidence = 0.9
    elif processed_count > 0: confidence = 0.8
    else: confidence = 0.0

    return {
        "score": min(float(score), 100.0),
        "confidence": confidence,
        "features": features,
        "reasons": reasons
    }
