import hashlib
import re
import math
import io
from collections import Counter

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    from oletools.olevba import VBA_Parser
except ImportError:
    VBA_Parser = None

from core.threat_intel import virustotal_file_check

DANGEROUS_EXTENSIONS = [
    # Windows
    ".exe", ".msi", ".bat", ".cmd", ".scr", ".ps1", ".dll", ".com",
    # Scripts
    ".js", ".vbs", ".wsf", ".jar", ".py", ".sh",
    # Archives
    ".zip", ".rar", ".7z", ".tar", ".gz", ".iso",
    # Office Macros
    ".docm", ".xlsm", ".pptm",
    # Linux / Mac
    ".app", ".dmg", ".pkg", ".run", ".bin"
]

URL_REGEX = r"(?:https?|hxxps?)://[^\s]+"

def calculate_entropy(data):
    """Calculate Shannon Entropy to detect packed/encrypted files"""
    if not data: return 0
    entropy = 0
    total_len = len(data)
    if total_len == 0: return 0
        
    counts = Counter(data)
    for count in counts.values():
        p_x = count / total_len
        if p_x > 0:
            entropy += - p_x * math.log(p_x, 2)
    return entropy

def analyze_attachments(attachments):
    """
    Layer 3: Attachment Analysis Engine
    Returns standardized multimodal response.
    """
    if not attachments:
        return {
            "score": 0.0,
            "confidence": 0.0,
            "features": {
                "num_attachments": 0,
                "has_executable": 0,
                "entropy_avg": 0.0,
                "vt_malicious_files": 0,
                "embedded_urls": 0,
                "pdf_js_detected": 0
            },
            "reasons": []
        }

    total_score = 0
    reasons = []
    attachment_hashes = []
    
    features = {
        "num_attachments": len(attachments),
        "has_executable": 0,
        "entropy_avg": 0.0,
        "vt_malicious_files": 0,
        "embedded_urls": 0,
        "pdf_js_detected": 0
    }
    
    total_entropy = 0
    
    for att in attachments:
        filename = att["filename"].lower()
        content = att["bytes"]

        # 1️⃣ FILE EXTENSION CHECK
        if re.search(r'\.[a-z0-9]{2,4}\.[a-z0-9]{2,4}$', filename):
             total_score += 40
             reasons.append(f"Suspicious double extension detected: {filename}")

        is_dangerous = False
        for ext in DANGEROUS_EXTENSIONS:
            if filename.endswith(ext):
                is_dangerous = True
                if ext in [".exe", ".msi", ".bat", ".vbs", ".js", ".wsf"]:
                    total_score += 50
                    features["has_executable"] = 1
                    reasons.append(f"Executable/Script attachment detected: {ext}")
                elif ext in [".html", ".htm"]:
                    total_score += 40
                    reasons.append(f"HTML attachment (Phishing Vector) detected: {ext}")
                elif ext in [".zip", ".rar", ".7z", ".iso"]:
                    total_score += 20
                    reasons.append(f"Archive attachment (Inspect contents): {ext}")
                    
                    # --- DEEP ARCHIVE INSPECTION (ZIP) ---
                    if ext == ".zip":
                        try:
                            import zipfile
                            with zipfile.ZipFile(io.BytesIO(content)) as z:
                                total_uncompressed_size = sum(info.file_size for info in z.infolist())
                                if total_uncompressed_size > 50 * 1024 * 1024: # 50MB limit
                                    reasons.append(f"Zip Bomb Protection: Archive uncompressed size exceeds 50MB limits.")
                                
                                file_list = z.namelist()
                                for z_file in file_list:
                                    z_lower = z_file.lower()
                                    for d_ext in [".exe", ".msi", ".bat", ".vbs", ".js", ".wsf", ".scr", ".ps1"]:
                                        if z_lower.endswith(d_ext):
                                            features["has_executable"] = 1
                                            total_score += 60 # High penalty for hidden executables
                                            reasons.append(f"CRITICAL: Hidden executable script ({d_ext}) found inside ZIP archive '{filename}'")
                                            break # Only flag once per zip
                        except Exception as e:
                            reasons.append(f"Warning: Could not extract ZIP contents for deep inspection.")
                else:
                    total_score += 30
                    reasons.append(f"Risky attachment type: {ext}")

        # 2️⃣ HASH & VIRUSTOTAL
        generated_hash = hashlib.sha256(content).hexdigest()
        attachment_hashes.append(generated_hash)
        
        if is_dangerous or total_score > 0:
            vt_stats = virustotal_file_check(generated_hash)
            if vt_stats:
                if vt_stats.get("malicious", 0) > 0:
                    features["vt_malicious_files"] += 1
                    total_score += 100
                    reasons.append(f"VirusTotal: File flagged by {vt_stats['malicious']} vendors! (MALWARE)")
                elif vt_stats.get("error") and "Quota" in vt_stats["error"]:
                    reasons.append(f"Warning: VirusTotal file scan skipped (Quota/Rate Limit reached)")

        # 3️⃣ ENTROPY
        entropy = calculate_entropy(content)
        total_entropy += entropy
        is_compressed = filename.endswith(('.zip', '.rar', '.7z', '.gz', '.jpg', '.png', '.pdf'))
        
        if entropy > 7.2 and not is_compressed: 
             total_score += 40
             reasons.append(f"High Entropy ({entropy:.2f}): Potential packed malware/encrypted payload")
        
        # 4️⃣ DEEP PDF ANALYSIS (JavaScript Detection)
        if filename.endswith(".pdf") and pypdf:
            try:
                # Direct check for JS objects in PDF structure
                # We convert bytes to string (latin1) to regex search safely
                # This is faster/safer than parsing full tree
                raw_str = content.decode('latin-1', errors='ignore')
                
                # Check for JavaScript actions
                if re.search(r'/JavaScript|/JS|/OpenAction', raw_str):
                    features["pdf_js_detected"] = 1
                    total_score += 60 # High risk for PDF JS
                    reasons.append(f"Active Content (JavaScript/AutoAction) detected in PDF: {filename}")
                
                 # Check for URLs in PDF (Text Extraction)
                try:
                    pdf_file = io.BytesIO(content)
                    reader = pypdf.PdfReader(pdf_file)
                    pdf_text = ""
                    for i, page in enumerate(reader.pages):
                         if i > 5: break
                         pdf_text += page.extract_text() or ""
                except Exception as e:
                    print(f"PyPDF extract failed for {filename}, falling back to raw string extraction. Error: {e}")
                    # Fallback text extraction
                    pdf_text = raw_str
                
                embedded_urls = re.findall(URL_REGEX, pdf_text)
                if embedded_urls:
                    features["embedded_urls"] += len(embedded_urls)
                    total_score += 25
                    reasons.append(f"PDF contains embedded URLs ({len(embedded_urls)} found)")
                    
            except Exception as e:
                print(f"Error parsing PDF {filename}: {e}")
                pass

        # 5️⃣ DEEP MACRO ANALYSIS (oletools)
        if VBA_Parser and filename.endswith((".doc", ".xls", ".ppt", ".docm", ".xlsm", ".pptm", ".docb", ".xltm", ".potm")):
            try:
                vbaparser = VBA_Parser(filename, data=content)
                if vbaparser.detect_vba_macros():
                    features["has_executable"] = 1
                    total_score += 40 
                    reasons.append(f"Active VBA Macros detected in Office file: {filename}")
                    
                    # Deep analysis for malicious intent
                    results = vbaparser.analyze_macros()
                    if results:
                        for kw_type, keyword, description in results:
                            if kw_type in ['Suspicious', 'AutoExec', 'IOC']:
                                total_score += 45
                                reasons.append(f"CRITICAL: Malicious indicators found in VBA Macro ({keyword})")
                                break # Score once per file
                vbaparser.close()
            except Exception:
                pass

        # 6️⃣ EMBEDDED URL CHECK (TEXT/HTML/PDF EXTRACTED)
        if filename.endswith((".txt", ".html", ".htm")):
            try:
                text = content.decode(errors="ignore")
                urls = re.findall(URL_REGEX, text)
                if urls:
                    features["embedded_urls"] += len(urls)
                    total_score += 30
                    reasons.append(f"Attachment ({filename}) contains {len(urls)} embedded URLs")
            except Exception:
                pass

    features["entropy_avg"] = total_entropy / len(attachments) if attachments else 0
    
    # Analyze extracted texts (can be used by NLP layer later if passed up)
    extracted_texts = [] # We could return this in META for NLP layer
    
    if features["vt_malicious_files"] > 0: confidence = 1.0
    elif features["has_executable"]: confidence = 0.9
    else: confidence = 0.7

    return {
        "score": min(float(total_score), 100.0),
        "confidence": confidence,
        "features": features,
        "reasons": reasons
    }
