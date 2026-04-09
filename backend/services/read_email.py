import email
from email import policy
from email.parser import BytesParser
import re
from datetime import datetime

# Layer 1: Enhanced Regex for Obfuscated URLs
URL_REGEX = r"(?:https?|hxxps?)://[^\s]+"

MAX_EMAIL_SIZE = 20 * 1024 * 1024  # 20 MB

def extract_email_content(raw_bytes: bytes, filename: str = None):
    if len(raw_bytes) > MAX_EMAIL_SIZE:
        raise ValueError(f"Email size {len(raw_bytes)} exceeds maximum allowed size of {MAX_EMAIL_SIZE} bytes")
        
    msg = BytesParser(policy=policy.default).parsebytes(raw_bytes)

    subject = msg.get("Subject", "")
    if not subject and filename:
        subject = filename

    headers = {
        "from": msg.get("From", ""),
        "subject": subject,
        "to": msg.get("To", ""),
        "received": str(msg.get("Received", ""))
    }

    body_text = ""
    body_html = ""
    urls = []
    images = []
    attachments = []
    html_features = {
        "has_forms": 0,
        "has_iframes": 0,
        "zero_width_count": 0
    }

    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            filename = part.get_filename()

            # TEXT
            if content_type == "text/plain" and not filename:
                text = part.get_content()
                body_text += text
                urls.extend(re.findall(URL_REGEX, text))

            # HTML
            elif content_type == "text/html" and not filename:
                html = part.get_content()
                
                # Store the original HTML (sanitized for safety)
                if not body_html:  # Only take the first HTML part
                    body_html = html
                
                urls.extend(re.findall(URL_REGEX, html))
                
                # Enhanced HTML to Text conversion using BeautifulSoup
                # Enhanced HTML to Text conversion using BeautifulSoup
                try:
                    from bs4 import BeautifulSoup
                    # Try lxml, fallback to html.parser (standard lib) if lxml is missing
                    try:
                        soup = BeautifulSoup(html, 'lxml')
                    except Exception:
                        soup = BeautifulSoup(html, 'html.parser')
                    
                    if soup.find('form'):
                        html_features["has_forms"] = 1
                    if soup.find('iframe'):
                        html_features["has_iframes"] = 1
                    
                    # Remove script and style elements
                    for script in soup(["script", "style"]):
                        script.decompose()
                    
                    # Get text and clean whitespace
                    text_from_html = soup.get_text(separator=' ', strip=True)
                    text_from_html = re.sub(r'\s+', ' ', text_from_html).strip()
                    
                    # Append if body is empty or very short
                    if not body_text or len(body_text) < 50:
                        body_text += text_from_html
                except Exception as e:
                    # Fallback to improved regex if BeautifulSoup fails
                    print(f"HTML parsing error: {e}, using regex fallback")
                    # 1. Remove style and script CONTENT
                    text_from_html = re.sub(r'<(style|script)[^>]*>.*?</\1>', ' ', html, flags=re.IGNORECASE | re.DOTALL)
                    # 2. Remove remaining tags
                    text_from_html = re.sub(r'<[^>]+>', ' ', text_from_html)
                    text_from_html = re.sub(r'\s+', ' ', text_from_html).strip()
                    if not body_text or len(body_text) < 50:
                        body_text += text_from_html

            # IMAGE
            elif content_type.startswith("image/"):
                images.append({
                    "filename": filename or "image",
                    "content_type": content_type,
                    "bytes": part.get_payload(decode=True)
                })

            # ATTACHMENT
            elif filename:
                attachments.append({
                    "filename": filename,
                    "content_type": content_type,
                    "bytes": part.get_payload(decode=True)
                })
    else:
        # Single part email (usually text)
        content_type = msg.get_content_type()
        text = msg.get_content()
        
        if content_type == "text/html":
            body_html = text
            # Also extract plain text from HTML
            try:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(text, 'html.parser')
                
                if soup.find('form'):
                    html_features["has_forms"] = 1
                if soup.find('iframe'):
                    html_features["has_iframes"] = 1
                    
                for script in soup(["script", "style"]):
                    script.decompose()
                body_text = soup.get_text(separator=' ', strip=True)
                body_text = re.sub(r'\s+', ' ', body_text).strip()
            except:
                body_text = re.sub(r'<[^>]+>', ' ', text)
                body_text = re.sub(r'\s+', ' ', body_text).strip()
        else:
            body_text += text
        
        urls.extend(re.findall(URL_REGEX, text))

    # Canonical Headers
    canonical_headers = {
        "from": headers.get("from", ""),
        "to": headers.get("to", ""),
        "subject": headers.get("subject", ""),
        "received": headers.get("received", ""),
        # NEW: Authentication Headers
        "authentication_results": str(msg.get("Authentication-Results", "")),
        "received_spf": str(msg.get("Received-SPF", "")),
        "dkim_signature": str(msg.get("DKIM-Signature", ""))
    }

    # Clean URLs
    cleaned_urls = []
    if urls:
        for u in set(urls): # Dedupe first
            if "<" in u or ">" in u or " " in u:
                continue
            cleaned_urls.append(u)
            
    # Count Zero-Width Characters in body text and html
    zero_width_pattern = r'[\u200b\u200c\u200d\ufeff\u2028\u2029]'
    zw_count = len(re.findall(zero_width_pattern, body_html)) + len(re.findall(zero_width_pattern, body_text))
    html_features["zero_width_count"] = zw_count

    return {
        "headers": canonical_headers, # Clean structure
        "body_text": body_text or "",
        "body_html": body_html or "",
        "html_features": html_features,
        "urls": list(set(cleaned_urls)), # Final Unique List
        "images": images if images else [],
        "attachments": attachments if attachments else [],
        "scan_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S") # Real-time timestamp
    }

def parse_email_bytes(raw_bytes: bytes, filename: str = None):
    """
    Wrapper for backward compatibility with main.py and ML pipeline.
    Flattens the structure to what other modules expect.
    """
    data = extract_email_content(raw_bytes, filename)
    return {
        "subject": data["headers"]["subject"],
        "from": data["headers"]["from"],
        "body": data["body_text"],
        "body_html": data["body_html"],
        "html_features": data.get("html_features", {}),
        "urls": data["urls"],
        "images": data["images"],
        "attachments": data["attachments"],
        "scan_time": data.get("scan_time"), # Pass through real-time timestamp
        # expose new structure as well for future use
        "headers": data["headers"], 
        "raw_data": data 
    }

if __name__ == "__main__":
    with open("sample.eml", "rb") as f:
        print(extract_email_content(f.read()))
