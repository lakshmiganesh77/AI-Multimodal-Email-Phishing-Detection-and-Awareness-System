import re
from .base import BaseRule

class AuthenticationRule(BaseRule):
    def __init__(self, weight: int = 30):
        super().__init__(weight)
        
    def evaluate(self, email_data: dict, context: dict) -> dict:
        headers = context.get("headers", {})
        sender_email = context.get("sender_email", "")
        
        score = 0
        reasons = []
        features = {}

        auth_results = headers.get("authentication_results", "").lower()
        spf_header = headers.get("received_spf", "").lower()
        
        auth_failures = 0
        
        if "spf=fail" in auth_results or "spf=fail" in spf_header:
            score += 30
            reasons.append("Authentication Alert: SPF validation FAILED (Spoofing Risk)")
            auth_failures += 1
        elif "spf=softfail" in auth_results or "spf=softfail" in spf_header:
            score += 15
            reasons.append("Authentication Warning: SPF Softfail (Sender IP not fully authorized)")

        if "dkim=fail" in auth_results:
            score += 30
            reasons.append("Authentication Alert: DKIM validation FAILED (Modified Content Risk)")
            auth_failures += 1
        elif "dkim=neutral" in auth_results or "dkim=none" in auth_results:
            if any(d in sender_email for d in ["@gmail.com", "@yahoo.com", "@outlook.com", "@paypal.com", "@amazon.com"]):
                 score += 20
                 reasons.append("Authentication Warning: Missing DKIM from major provider")
        
        if "dmarc=fail" in auth_results:
            score += 40
            reasons.append("CRITICAL: DMARC Policy Validation FAILED")
            auth_failures += 1
            
        if auth_failures >= 2:
            score += 20
            reasons.append("CRITICAL: Multiple Authentication Failures Detected")

        features.update({
            "auth_fail": 1 if auth_failures > 0 else 0,
            "auth_spf_pass": 1 if "spf=pass" in auth_results or "spf=pass" in spf_header else 0,
            "auth_dkim_pass": 1 if "dkim=pass" in auth_results else 0,
            "auth_dmarc_pass": 1 if "dmarc=pass" in auth_results else 0
        })

        return {"score": score, "reasons": reasons, "features": features}

class SenderSpoofingRule(BaseRule):
    def __init__(self, weight: int = 40):
        super().__init__(weight)
        
    def evaluate(self, email_data: dict, context: dict) -> dict:
        headers = context.get("headers", {})
        sender_email = context.get("sender_email", "")
        
        score = 0
        reasons = []
        features = {"is_homograph": 0, "reply_to_mismatch": 0}

        if sender_email:
            sender_domain_parts = sender_email.split('@')
            if len(sender_domain_parts) == 2:
                sender_domain_str = sender_domain_parts[1]
                
                try:
                    if sender_domain_str.encode('idna').decode('ascii') != sender_domain_str:
                        score += 80
                        features["is_homograph"] = 1
                        reasons.append(f" CRITICAL DANGER: Hidden Homograph attack! The sender domain '{sender_domain_str}' uses fake look-alike letters.")
                except Exception:
                    pass

                reply_to = headers.get("reply-to", "") or headers.get("Reply-To", "")
                if reply_to:
                    reply_to = reply_to.lower()
                    reply_match = re.search(r'<([^>]+)>', reply_to)
                    if reply_match:
                        reply_to_email = reply_match.group(1).strip()
                    else:
                        reply_to_email = reply_to.strip()
                        
                    reply_parts = reply_to_email.split('@')
                    if len(reply_parts) == 2:
                        reply_domain_str = reply_parts[1]
                        
                        import tldextract
                        sender_base = tldextract.extract(sender_domain_str)
                        reply_base = tldextract.extract(reply_domain_str)
                        
                        if sender_base.domain != reply_base.domain and reply_base.domain != "":
                            score += 40
                            features["reply_to_mismatch"] = 1
                            reasons.append(f" Spoofing Alert: Replies are routed to a different domain ({reply_domain_str}) than the sender ({sender_domain_str}).")

        return {"score": score, "reasons": reasons, "features": features}
