import difflib
import re
from .base import BaseRule
from .constants import BRAND_DOMAINS

class BrandImpersonationRule(BaseRule):
    def __init__(self, weight: int = 40):
        super().__init__(weight)
        
    def evaluate(self, email_data: dict, context: dict) -> dict:
        text = context.get("text", "")
        sender_email = context.get("sender_email", "")
        sender_name = context.get("sender_name", "")
        is_trusted_sender = context.get("is_trusted_sender", False)
        
        score = 0
        reasons = []
        features = {"is_impersonation": 0}

        if not is_trusted_sender:
            for brand, valid_domains in BRAND_DOMAINS.items():
                if sender_name and brand in sender_name:
                    is_legitimate_domain = any(sender_email.endswith(domain) for domain in valid_domains)
                    
                    if not is_legitimate_domain:
                        public_domains = ["@gmail.com", "@yahoo.com", "@hotmail.com", "@outlook.com"]
                        is_public = any(sender_email.endswith(pub) for pub in public_domains)
                        
                        features["is_impersonation"] = 1
                        if is_public:
                            score += 55
                            reasons.append(f"🎭 This email pretends to be from '{brand.title()}' but was sent from a free email account.")
                        else:
                            score += 40
                            reasons.append(f"🎭 The sender claims to be '{brand.title()}' but the email address doesn't match.")

                elif brand in text:
                     is_legitimate = any(sender_email.endswith(domain) for domain in valid_domains)
                     if not is_legitimate:
                         suspicious_context = ["verify", "account", "login", "suspended", "confirm"]
                         if any(k in text for k in suspicious_context):
                             score += 60
                             features["is_impersonation"] = 1
                             reasons.append(f" CRITICAL: This email mentions '{brand.title()}' and asks for sensitive info from a mismatched domain.")

        return {"score": score, "reasons": reasons, "features": features}

class DomainSpoofingRule(BaseRule):
    def __init__(self, weight: int = 50):
        super().__init__(weight)
        
    def evaluate(self, email_data: dict, context: dict) -> dict:
        sender_email = context.get("sender_email", "")
        is_trusted_sender = context.get("is_trusted_sender", False)
        
        score = 0
        reasons = []
        features = {}

        if not is_trusted_sender and sender_email:
            domain_match = re.search(r'@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', sender_email)
            if domain_match:
                sender_domain = domain_match.group(1).lower()
                sender_base = sender_domain.split('.')[0]

                CRITICAL_BRANDS = {
                    "paypal": "paypal.com",
                    "amazon": "amazon.com", 
                    "google": "google.com",
                    "apple": "apple.com",
                    "microsoft": "microsoft.com",
                    "netflix": "netflix.com",
                    "facebook": "facebook.com",
                    "instagram": "instagram.com",
                    "chase": "chase.com",
                    "wellsfargo": "wellsfargo.com",
                    "bankofamerica": "bankofamerica.com"
                }

                for brand_name, official_domain in CRITICAL_BRANDS.items():
                    if sender_domain.endswith(official_domain):
                        continue

                    similarity = difflib.SequenceMatcher(None, sender_base, brand_name).ratio()
                    if similarity > 0.80:
                        score += 65
                        reasons.append(f" DANGER: The sender's address '{sender_domain}' is designed to look like '{official_domain}'.")
                        break

                    if brand_name in sender_base and sender_domain != official_domain:
                        if not sender_domain.endswith(f".{official_domain}"):
                            score += 50
                            reasons.append(f"⚠ The domain '{sender_domain}' is trying to impersonate '{brand_name}' but is not their official website.")
                            break

        return {"score": score, "reasons": reasons, "features": features}
