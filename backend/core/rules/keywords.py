import re
from .base import BaseRule

class KeywordRule(BaseRule):
    def __init__(self, weight: int = 15):
        super().__init__(weight)
        
    def evaluate(self, email_data: dict, context: dict) -> dict:
        text = context.get("text", "")
        is_trusted_sender = context.get("is_trusted_sender", False)
        
        score = 0
        reasons = []
        features = {}
        
        if not is_trusted_sender:
            high_risk_keywords = ["verify", "login", "account", "lockout", "suspended", 
                                  "unusual activity", "security alert", "action required",
                                  "invoice", "payment", "amount due", "transaction", "receipt", "password"]
            
            hit_keywords = [kw for kw in high_risk_keywords if kw in text]
            if hit_keywords:
                score += 10 + (min(len(hit_keywords), 3) * 5)
                features["keyword_matches"] = len(hit_keywords)
                keyword_list = "• " + "\n• ".join([f'"{kw.upper()}"' for kw in hit_keywords[:5]])
                reasons.append(f"⚠ This email uses pressure/financial tactics to make you act.\n\nDetected keywords:\n{keyword_list}")
                
        return {"score": score, "reasons": reasons, "features": features}

class UrgencyRule(BaseRule):
    def __init__(self, weight: int = 15):
        super().__init__(weight)
        
    def evaluate(self, email_data: dict, context: dict) -> dict:
        text = context.get("text", "")
        is_trusted_sender = context.get("is_trusted_sender", False)
        
        score = 0
        reasons = []
        features = {}

        if not is_trusted_sender:
            urgency_patterns = [
                "immediately", "now", "urgent", "asap", "right away",
                "within 24 hours", "within 48 hours", "expire soon",
                "limited time", "act now", "don't wait", "deadline",
                "overdue", "final notice"
            ]
            urgency_count = sum(1 for pattern in urgency_patterns if pattern in text.lower())
            features["urgency_level"] = min(urgency_count * 0.2, 1.0)
            
            if urgency_count > 0:
                urgency_score = min(15 + (urgency_count * 5), 30)
                score += urgency_score
                found_urgency = [p.upper() for p in urgency_patterns if p in text.lower()]
                urgency_list = "• " + "\n• ".join([f'"{word}"' for word in found_urgency[:5]])
                reasons.append(f"⏰ This email creates artificial urgency to pressure you. Real companies rarely demand immediate action.\n\nUrgent phrases found:\n{urgency_list}")
                
        return {"score": score, "reasons": reasons, "features": features}

class CredentialRule(BaseRule):
    def __init__(self, weight: int = 25):
        super().__init__(weight)
        
    def evaluate(self, email_data: dict, context: dict) -> dict:
        text = context.get("text", "")
        
        score = 0
        reasons = []
        features = {"intent_credential_score": 0.0}

        credential_patterns = [
            "enter your password", "confirm your password", "updated password",
            "reset password", "change your password", "password reset",
            "social security", "credit card", "account number", "pin code",
            "billing info", "payment details"
        ]
        
        for pattern in credential_patterns:
            if pattern in text:
                score += 25
                features["intent_credential_score"] = 1.0
                reasons.append(f"🔑 This email asks for '{pattern}'. Legitimate companies NEVER ask for sensitive information via email.")

        return {"score": score, "reasons": reasons, "features": features}

class FinancialScamRule(BaseRule):
    def __init__(self, weight: int = 45):
        super().__init__(weight)
        
    def evaluate(self, email_data: dict, context: dict) -> dict:
        text = context.get("text", "")
        is_trusted_sender = context.get("is_trusted_sender", False)
        
        score = 0
        reasons = []
        features = {"financial_scam": 0, "intent_financial_score": 0.0}

        crypto_keywords = [
            "bitcoin", "btc", "ethereum", "eth", "crypto", "wallet", 
            "investment", "profit", "returns", "guarantee", "risk-free", 
            "loan", "debt", "interest rate", "winner", "prize", "lottery"
        ]
        
        found_crypto = [kw for kw in crypto_keywords if kw in text]
        if found_crypto and not is_trusted_sender:
            score += 45
            features["financial_scam"] = 1
            features["intent_financial_score"] = 1.0
            reasons.append(f"💸 Financial/Crypto Scam indicators detected: {', '.join(found_crypto[:3])}. Be careful with 'get rich quick' offers.")

        return {"score": score, "reasons": reasons, "features": features}
