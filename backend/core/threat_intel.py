import requests
import os
import hashlib
import base64
from dotenv import load_dotenv
from functools import lru_cache

# ---------- Deep Link Unwrapping ----------
def unwrap_redirects(url):
    """
    Follows redirects to find the final landing page of a shortened or redirected URL.
    Useful for 'unwrapping' bit.ly or t.co links before sending to VT.
    """
    try:
        # Use a timeout and limit redirects to prevent hanging or infinite loops
        session = requests.Session()
        session.max_redirects = 5
        response = session.head(url, allow_redirects=True, timeout=5)
        
        # If head doesn't work, sometimes GET is required, but HEAD is faster
        if response.status_code >= 400 and response.status_code != 405:
            response = session.get(url, allow_redirects=True, timeout=5)
            
        final_url = response.url
        if final_url != url:
            return {"redirected": True, "final_url": final_url}
    except requests.TooManyRedirects:
        return {"error": "Too many redirects (Suspicious)"}
    except requests.RequestException:
        pass # Often fails on bad domains, which VT might catch anyway
        
    return {"redirected": False, "final_url": url}

load_dotenv()
VT_API_KEY = os.getenv("VT_API_KEY")

# ---------- VirusTotal URL Check ----------
@lru_cache(maxsize=100)
def virustotal_url_check(url):
    # Fetch key dynamically to ensure it's loaded
    api_key = os.getenv("VT_API_KEY")
    if not api_key:
        return {"error": "VT_API_KEY is missing from environment"}

    headers = {"x-apikey": api_key}
    try:
        # VirusTotal v3 uses Base64 encoded URL as ID
        url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
        api_url = f"https://www.virustotal.com/api/v3/urls/{url_id}"

        r = requests.get(api_url, headers=headers, timeout=5)
        
        if r.status_code == 401:
            return {"error": "401 Unauthorized (Wrong Key)"}
        if r.status_code == 429: # Rate Limit / Quota Exceeded
            return {"error": "429 Quota Exceeded (VT Limit Reached)"}
        if r.status_code == 404:
            # 404 means this URL has NEVER been scanned by VirusTotal globally.
            # In the context of Phishing, completely unseen URLs are highly suspicious (Zero-Day).
            return {"result": "URL not found in VirusTotal", "unseen_zero_day": True}
        if r.status_code != 200:
            return {"error": f"API Error {r.status_code}", "detail": r.text}

        return r.json()["data"]["attributes"]["last_analysis_stats"]
    except requests.exceptions.Timeout:
         return {"error": "Timeout connecting to VirusTotal"}
    except Exception as e:
        return {"error": f"Exception: {str(e)}"}


# ---------- VirusTotal File Hash Check ----------
@lru_cache(maxsize=100)
def virustotal_file_check(file_hash):
    """
    Checks confidence of a file hash against VirusTotal V3 API.
    """
    api_key = os.getenv("VT_API_KEY")
    if not api_key:
        return {"error": "VT_API_KEY is missing"}

    headers = {"x-apikey": api_key}
    api_url = f"https://www.virustotal.com/api/v3/files/{file_hash}"

    try:
        r = requests.get(api_url, headers=headers, timeout=5)
        
        if r.status_code == 404:
            return {"result": "File hash not found in VirusTotal"}
        if r.status_code != 200:
            return {"error": f"API Error {r.status_code}"}

        return r.json()["data"]["attributes"]["last_analysis_stats"]
    except Exception as e:
        return {"error": f"Exception: {str(e)}"}


# ---------- PhishTank URL Check ----------
@lru_cache(maxsize=100)
def phishtank_url_check(url):
    payload = {
        "url": url,
        "format": "json"
    }
    
    headers = {
        "User-Agent": "PhishGuard-Security-App/1.0",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    try:
        # Note: PhishTank public API is often rate-limited or deprecated. 
        # A robust production app would use the localized database download.
        r = requests.post("https://checkurl.phishtank.com/checkurl/", data=payload, headers=headers, timeout=5)
        
        if r.status_code != 200:
            return {"error": f"API Error {r.status_code}", "results": {"in_database": False}}

        return r.json()
    except Exception as e:
        return {"error": str(e), "results": {"in_database": False}}
