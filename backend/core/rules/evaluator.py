import re
from typing import List, Dict

# Import new rules
from .base import BaseRule
from .keywords import KeywordRule, UrgencyRule, CredentialRule, FinancialScamRule
from .impersonation import BrandImpersonationRule, DomainSpoofingRule
from .sender import AuthenticationRule, SenderSpoofingRule

class RuleEvaluator:
    def __init__(self):
        # Initialize all the rules to run
        self.rules: List[BaseRule] = [
            KeywordRule(),
            UrgencyRule(),
            CredentialRule(),
            FinancialScamRule(),
            BrandImpersonationRule(),
            DomainSpoofingRule(),
            AuthenticationRule(),
            SenderSpoofingRule()
        ]

    def evaluate_all(self, email_data: dict, context: dict) -> Dict:
        total_score = 0
        all_reasons = []
        combined_features = {
            "keyword_matches": 0,
            "urgency_level": 0.0,
            "intent_urgency_score": 0.0,
            "intent_financial_score": 0.0,
            "intent_credential_score": 0.0,
            "auth_fail": 0,
            "auth_spf_pass": 0,
            "auth_dkim_pass": 0,
            "auth_dmarc_pass": 0,
            "is_homograph": 0,
            "reply_to_mismatch": 0,
            "is_impersonation": 0,
            "financial_scam": 0
        }

        for rule in self.rules:
            try:
                result = rule.evaluate(email_data, context)
                total_score += result.get("score", 0)
                all_reasons.extend(result.get("reasons", []))
                
                # Merge features from rule using max (e.g. if one rule sets auth_fail to 1, keep it 1)
                for key, val in result.get("features", {}).items():
                    if key in combined_features:
                        if isinstance(val, (int, float)) and isinstance(combined_features[key], (int, float)):
                            combined_features[key] = max(combined_features[key], val)
            except Exception as e:
                import logging
                logger = logging.getLogger("phishguard.rules")
                logger.error(f"Rule {rule.__class__.__name__} failed: {e}")

        # Rule 10: Context Aware Reduction (Hardcoded for simplicity)
        subject = email_data.get('subject', '').lower()
        body = email_data.get('body', '').lower()
        
        low_risk_indicators = ["newsletter", "security awareness", "training", "webinar", "course", "summit", "conference", "expert session"]
        if any(ind in subject for ind in low_risk_indicators) or "newsletter" in body[-500:]:
            if total_score > 0:
                total_score = max(total_score - 30, 0)
                all_reasons.append("ℹ Context: Identified as likely Security Newsletter or Training. Risk score reduced.")

        return {
            "score": min(total_score, 100),
            "reasons": all_reasons,
            "features": combined_features
        }
