import csv
import random

# Simple synthetic dataset generator for POC ML model
# A real SOC uses massive datasets like PhishTank/OpenPhish feeds
# We simulate those patterns here.

BENIGN_DOMAINS = ['google.com', 'microsoft.com', 'amazon.com', 'wikipedia.org', 'enron.com', 'github.com', 'yahoo.com', 'bbc.co.uk']
BENIGN_PATHS = ['', '/index.html', '/about', '/contact', '/login', '/search?q=hello', '/user/profile']

PHISHING_DOMAINS = ['login-update-secure.com', 'paypal-verification.net', 'appleid-auth.org', '192.168.1.100', 'bit.ly', 'mybank-security-alert.com']
PHISHING_PATHS = ['/secure/login.php', '/verify_account.html', '/cmd=_s-xclick&submit=1', '/update-billing', '/webapps/mpp/home']

def generate_benign():
    protocol = random.choice(['http://', 'https://'])
    domain = random.choice(BENIGN_DOMAINS)
    path = random.choice(BENIGN_PATHS)
    
    # Sometimes add subdomains
    if random.random() > 0.7:
        domain = 'www.' + domain
    elif random.random() > 0.9:
        domain = 'mail.' + domain
        
    return f"{protocol}{domain}{path}", 0  # 0 = Safe

def generate_phishing():
    protocol = random.choice(['http://', 'https://'])
    domain = random.choice(PHISHING_DOMAINS)
    path = random.choice(PHISHING_PATHS)
    
    # Phishing often uses many subdomains, hyphens, or IPs
    if random.random() > 0.5:
        domain = f"secure-login-{random.randint(100, 999)}.{domain}"
        
    # Sometime add @ symbol (auth obfuscation)
    url = f"{protocol}{domain}{path}"
    if random.random() > 0.8:
        url = url.replace('://', f"://admin:admin@{domain}/")
        
    return url, 1  # 1 = Phishing

if __name__ == '__main__':
    print("Generating synthetic URL dataset...")
    
    dataset = []
    
    # Generate 500 benign
    for _ in range(500):
        dataset.append(generate_benign())
        
    # Generate 500 phishing
    for _ in range(500):
        dataset.append(generate_phishing())
        
    # Shuffle
    random.shuffle(dataset)
    
    # Save to CSV
    import os
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "synth_url_dataset.csv")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['url', 'label'])
        for row in dataset:
            writer.writerow(row)
            
    print(f"Generated {len(dataset)} URLs into synth_url_dataset.csv")    
