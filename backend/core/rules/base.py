from abc import ABC, abstractmethod

class BaseRule(ABC):
    """
    Base class for all email analysis rules.
    """
    def __init__(self, weight: int = 10):
        self.weight = weight

    @abstractmethod
    def evaluate(self, email_data: dict, context: dict) -> dict:
        """
        Evaluates the rule against the email data.
        Returns a dict:
        {
            "score": int, (0 to 100)
            "reasons": list[str],
            "features": dict
        }
        """
        pass
