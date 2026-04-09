# PhishGuard Rules Constants

# ENHANCED PHISHING KEYWORDS - More comprehensive
PHISHING_KEYWORDS = [
    "urgent", "verify", "suspended", "immediately", "click here",
    "account", "security alert", "password", "bank", "login",
    "confirm", "update", "action required", "locked", "unusual activity",
    "reactivate", "validate", "expire", "limited time"
]

# TRUSTED DOMAINS - Legitimate platforms that may mention other brands
TRUSTED_DOMAINS = [
    "@dare2compete.news",      # Unstop (job/competition platform)
    "@unstop.com",
    "@noreply.unstop.com",
    "@linkedin.com",            # LinkedIn (job platform)
    "@noreply.linkedin.com",
    "@newsletters-noreply.linkedin.com",
    "newsletters-noreply@linkedin.com",
    "@fortinet.com",
    "@global.fortinet.com",
    "info@global.fortinet.com",
    "@indeed.com",
    "@glassdoor.com",
    "@angel.co",
    "@wellfound.com",
    "@mail.google.com",
    "@notifications.google.com",
    "@kotak.com",
    "@kotakbank.com",
    "@kotak.bank.in",
    "@BankStatements@kotak.bank.in",
    "@nse.co.in",
    "@nseindia.com",
    "@bseindia.com",
    "@cdslindia.com",
    "@cdslindia.co.in",
    "@nsdl.co.in",
    "@nsdl.com",
    "@gov.in",
    "@nic.in"
]

# Brand domains for impersonation detection
BRAND_DOMAINS = {
    "amazon": ["@amazon.com", "@amazon.co.uk", "@aws.amazon.com"],
    "paypal": ["@paypal.com", "@mail.paypal.com"],
    "apple": ["@apple.com", "@icloud.com", "@email.apple.com"],
    "microsoft": ["@microsoft.com", "@outlook.com", "@onedrive.com"],
    "google": ["@google.com", "@gmail.com", "@accounts.google.com"],
    "netflix": ["@netflix.com", "@mailer.netflix.com"],
    "facebook": ["@facebook.com", "@meta.com"],
    "chase": ["@chase.com", "@jpmorgan.com"],
    "wellsfargo": ["@wellsfargo.com"],
    "bofa": ["@bankofamerica.com"],
    "fortinet": ["@fortinet.com", "@global.fortinet.com"]
}
