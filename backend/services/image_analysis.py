import pytesseract
from PIL import Image
import io
import cv2
import numpy as np
import os
import sys

# Keywords commonly found in phishing images
IMAGE_PHISHING_KEYWORDS = [
    "verify", "urgent", "login", "account", "microsoft", "office 365",
    "suspended", "confirm", "security", "password", "update", "action required"
]

# Paths to reference logos (You will need to place .png files here)
# e.g., assets/microsoft_logo.png
ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
REFERENCE_LOGOS = {
    "microsoft": os.path.join(ASSETS_DIR, "microsoft_logo.png"),
    "paypal": os.path.join(ASSETS_DIR, "paypal_logo.png")
}

try:
    from core.threat_intel import virustotal_url_check
except ImportError:
    virustotal_url_check = lambda x: None

def preprocess_image_cv2(image_bytes):
    """
    Use OpenCV to improve OCR accuracy:
    1. Grayscale
    2. Thresholding (Binarization)
    3. Noise Removal
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to gray
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding to get black and white only (better for text)
        # Using Otsu's binarization
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        success, encoded_img = cv2.imencode('.png', thresh)
        if success:
            return encoded_img.tobytes()
        return image_bytes
    except Exception as e:
        # print(f"CV2 Preprocessing failed: {e}")
        return image_bytes

def extract_text_from_image(image_bytes):
    try:
        # Preprocess with OpenCV first
        clean_bytes = preprocess_image_cv2(image_bytes)
        
        img = Image.open(io.BytesIO(clean_bytes))
        # Basic robustness: Try to find tesseract in common Windows paths if not in PATH
        if sys.platform == "win32" and not os.access(pytesseract.pytesseract.tesseract_cmd, os.X_OK):
             possible_paths = [
                 r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                 r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                 os.path.join(os.getenv("LOCALAPPDATA", ""), r"Tesseract-OCR\tesseract.exe")
             ]
             for p in possible_paths:
                 if os.path.exists(p):
                     pytesseract.pytesseract.tesseract_cmd = p
                     break
        
        text = pytesseract.image_to_string(img)
        return text.lower()
    except Exception as e:
         return ""

def detect_qr_codes(image_bytes):
    """
    Uses OpenCV (cv2) to detect QR codes.
    Alternative to pyzbar which causes DLL errors on some Windows systems.
    """
    try:
        img_array = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        detector = cv2.QRCodeDetector()
        retval, decoded_info, points, straight_qrcode = detector.detectAndDecodeMulti(img)
        
        if retval:
            # decoded_info is a list of strings
            return [str(s) for s in decoded_info if s]
            
        return []
    except Exception:
        return []

def detect_logos(image_bytes):
    """
    Basic Logo Detection using OpenCV Template Matching.
    In a real-world scenario, a YOLOv8 or CNN ResNet model would be used here.
    This acts as a lightweight proxy for academic demonstration.
    Returns a list of detected brand names.
    """
    detected_brands = []
    try:
        # Load target image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_rgb = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_rgb is None:
            return []
            
        img_gray = cv2.cvtColor(img_rgb, cv2.COLOR_BGR2GRAY)
        
        for brand, template_path in REFERENCE_LOGOS.items():
            if not os.path.exists(template_path):
                continue
                
            # Load template logo
            template = cv2.imread(template_path, cv2.IMREAD_GRAYSCALE)
            if template is None:
                continue
                
            # Template matching requires the template to be smaller than the image
            if template.shape[0] > img_gray.shape[0] or template.shape[1] > img_gray.shape[1]:
                # Resize template to be 20% of the image width if it's too big
                scale = (img_gray.shape[1] * 0.2) / template.shape[1]
                if scale < 1.0:
                    width = int(template.shape[1] * scale)
                    height = int(template.shape[0] * scale)
                    template = cv2.resize(template, (width, height))
            
            # Use multi-scale template matching or standard matchTemplate
            w, h = template.shape[::-1]
            res = cv2.matchTemplate(img_gray, template, cv2.TM_CCOEFF_NORMED)
            threshold = 0.8 # 80% match confidence
            loc = np.where(res >= threshold)
            
            if len(loc[0]) > 0:
                detected_brands.append(brand)
                
        return list(set(detected_brands))
    except Exception as e:
        print(f"Logo detection error: {e}")
        return []

def analyze_images(images):
    """
    Layer 4: Image Analysis Engine
    Returns standardized multimodal response.
    """
    if not images:
        return {
            "score": 0.0,
            "confidence": 0.0,
            "features": {
                "ocr_text_length": 0,
                "qr_links": 0,
                "ocr_phishing_probability": 0.0,
                "image_count": 0
            },
            "reasons": []
        }

    total_score = 0
    reasons = []
    
    features = {
        "ocr_text_length": 0,
        "qr_links": 0,
        "ocr_phishing_probability": 0.0,
        "image_count": len(images),
        "detected_logos": 0
    }

    ocr_texts = []
    all_qr_links = []
    all_detected_brands = []
    qr_found_count = 0

    for img in images:
        image_bytes = img["bytes"]

        # 1️⃣ OCR TEXT EXTRACTION
        ocr_text = extract_text_from_image(image_bytes)
        ocr_texts.append(ocr_text)
        features["ocr_text_length"] += len(ocr_text)

        # Simple OCR Keyword Matching (ML Classifier placeholder)
        keyword_hits = 0
        for kw in IMAGE_PHISHING_KEYWORDS:
            if kw in ocr_text:
                keyword_hits += 1
                total_score += 15
                reasons.append(f"Image OCR keyword detected: {kw}")
        
        if keyword_hits > 0:
            features["ocr_phishing_probability"] = min(1.0, 0.2 + (keyword_hits * 0.1))

        # 2️⃣ QR CODE DETECTION
        qr_links = detect_qr_codes(image_bytes)

        if qr_links:
            all_qr_links.extend(qr_links)
            qr_found_count += 1
            features["qr_links"] += len(qr_links)
            total_score += 40 # Increased risk for QR codes
            reasons.append(f"Found QR code linking to: {qr_links}")
            
            # Check QR links in VirusTotal
            for link in qr_links:
                if link.startswith("http"):
                    vt_res = virustotal_url_check(link)
                    if vt_res and vt_res.get("malicious", 0) > 0:
                         total_score += 50
                         reasons.append(f"CRITICAL: QR Code leads to known MALICIOUS site ({link})")
                    elif "192.168" in link or "10." in link:
                         total_score += 20
                         reasons.append(f"QR Code leads to private IP ({link})")

    # Pass OCR text up for NLP layer?
    # We can store it in features if needed, but 'reasons' and feature stats are key.
    
    # 3️⃣ LOGO DETECTION (Brand Impersonation)
    # If a brand logo is detected in an image, but the email domain doesn't match, it's a critical flag.
    # This logic is best handled in rules.py or decision_engine.py, so we pass the detected brands up.
    if len(images) > 0:
        for img in images:
            brands = detect_logos(img["bytes"])
            if brands:
                all_detected_brands.extend(brands)
                features["detected_logos"] += len(brands)
                
                # We don't automatically score here unless we know for sure it's impersonated,
                # but for simplicity we flag the presence of the logo.
                for br in brands:
                    reasons.append(f"Visual Logo Detected: '{br.title()}'")
                    
        # Small ML score bump simply for having heavy brand imagery in the email
        if features["detected_logos"] > 0:
            total_score += 15

    confidence = 0.5
    if features["ocr_text_length"] > 100: confidence = 0.8
    if features["qr_links"] > 0: confidence = 0.9
    if features["detected_logos"] > 0: confidence = 0.85

    return {
        "score": min(float(total_score), 100.0),
        "confidence": confidence,
        "features": features,
        "reasons": reasons,
        "meta": {
            "extracted_text": " ".join(ocr_texts).strip(),
            "extracted_qr_links": all_qr_links,
            "detected_brands": list(set(all_detected_brands))
        }
    }
