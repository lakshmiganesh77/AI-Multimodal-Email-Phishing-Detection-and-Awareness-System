import re
import math
from urllib.parse import urlparse
import tldextract

def get_url_entropy(url):
    """Calculate Shannon entropy of the URL string"""
    prob = [float(url.count(c)) / len(url) for c in dict.fromkeys(list(url))]
    entropy = - sum([p * math.log(p) / math.log(2.0) for p in prob])
    return entropy

def extract_url_features(url):
    """Extracts numerical and boolean features from a URL for ML classification"""
    try:
        parsed = urlparse(url)
        ext = tldextract.extract(url)
        
        domain = ext.domain
        suffix = ext.suffix
        subdomain = ext.subdomain
        
        # Base lengths
        url_len = len(url)
        domain_len = len(domain)
        path_len = len(parsed.path)
        
        # Suspicious characters
        num_dots = url.count('.')
        num_hyphens = url.count('-')
        num_at = url.count('@')
        num_percent = url.count('%')
        num_digits = sum(c.isdigit() for c in url)
        
        # Entropy
        entropy = get_url_entropy(url)
        
        # Suspicious keywords
        suspicious_words = ['login', 'secure', 'account', 'update', 'verify', 'bank', 'paypal', 'signin', 'admin']
        has_suspicious_word = any(word in url.lower() for word in suspicious_words)
        
        # Is IP address used as domain?
        is_ip = 1 if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", domain) else 0

        # Protocols
        is_https = 1 if parsed.scheme == 'https' else 0
        
        return [
            url_len, domain_len, path_len, 
            num_dots, num_hyphens, num_at, num_percent, num_digits,
            entropy,
            1 if has_suspicious_word else 0,
            is_ip,
            is_https
        ]
        
    except Exception as e:
        # Fallback for completely malformed URLs
        return [len(url), 0, 0, url.count('.'), url.count('-'), url.count('@'), url.count('%'), 0, get_url_entropy(url), 0, 0, 0]

# Define feature names for easy reference later
FEATURE_NAMES = [
    'url_len', 'domain_len', 'path_len', 
    'num_dots', 'num_hyphens', 'num_at', 'num_percent', 'num_digits',
    'entropy',
    'has_suspicious_word',
    'is_ip',
    'is_https'
]
