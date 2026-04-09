"""
Rule-Based Chatbot for PhishGuard
Provides intelligent, context-aware responses about phishing emails using defined rules.
No external AI/Ollama dependency required.
"""

from typing import Optional, Dict, Any
import logging
import json

logger = logging.getLogger(__name__)

class GeminiAIChatbot:
    """
    PhishGuard AI Security Assistant.
    Advanced, context-aware phishing education and analysis for SOC analysts.
    """
    
    def __init__(self):
        # Educational Knowledge Base
        self.education_db = {
            "lookalike_domain": {
                "concept": "👀 **Lookalike Domain (Typosquatting)**",
                "explanation": "Attackers register domains that look almost identical to real ones (e.g., `goog1e.com` vs `google.com`).",
                "action": "👉 **Safe Action**: Check the URL bar carefully for spelling errors or unexpected characters."
            },
            "malicious_attachment": {
                "concept": "📎 **Dangerous Attachment**",
                "explanation": "Files like `.exe`, `.scr`, or `.zip` often contain malware. Legitimate invoices are usually PDFs sent directly in the email.",
                "action": "👉 **Safe Action**: Do not download. Verify with the sender via phone."
            },
            "brand_impersonation": {
                "concept": "🏢 **Brand Impersonation**",
                "explanation": "The email uses official logos and branding but comes from an unrelated address.",
                "action": "👉 **Safe Action**: Ignore the graphics. Look at the sender address headers."
            },
            "urgency": {
                "concept": " **Psychological Trigger: Urgency**",
                "explanation": "Hackers use words like 'Immediate Action', 'Suspended', or '24 Hours' to make you panic. When you panic, you stop thinking critically.",
                "action": "👉 **Safe Action**: Do NOT click. Call the sender on a known, official number to verify."
            },
            "credentials": {
                "concept": "🔑 **Credential Harvesting**",
                "explanation": "Legitimate companies (like Google or Banks) will NEVER ask for your password via email link.",
                "action": "👉 **Safe Action**: Go directly to the official website (type the URL yourself) instead of clicking the link."
            },
            "scanner_spoofing": { # Generic spoofing
                 "concept": "🎭 **Identity Spoofing**",
                 "explanation": "The sender name says 'Support', but the email address is random (e.g., `support@gmail.com` instead of `support@google.com`).",
                 "action": "👉 **Safe Action**: Check the 'From' address carefully. Hover over the name to see the real email."
            },
            "url_shortener": {
                "concept": "🔗 **Hidden Links (URL Shorteners)**",
                "explanation": "Services like bit.ly hide the true destination of a link. Hackers use this to mask malicious sites.",
                "action": "👉 **Safe Action**: Use a URL Expander or hover over the link to see where it really goes."
            },
            "financial_scam": {
                "concept": "💸 **Financial/Invoice Scam**",
                "explanation": "Attackers send fake invoices or payment demands to pressure you into transferring money or revealing banking details.",
                "action": "👉 **Safe Action**: Verify the invoice directly with your billing department or log into your account manually instead of clicking."
            },
            "ransomware": {
                "concept": "🔒 **Ransomware Delivery**",
                "explanation": "Malicious software that encrypts your files and demands payment (usually crypto) to unlock them. Often delivered via innocent-looking attachments (like PDFs with embedded links or fake Word macros).",
                "action": "👉 **Safe Action**: Never click 'Enable Content' on unexpected Office documents. Keep offline backups of critical data."
            },
            "mfa_fatigue": {
                "concept": "📱 **MFA Fatigue (Push Bombing)**",
                "explanation": "Hackers who have your password will flood your phone with login approval requests, hoping you accidentally hit 'Approve' or do it just to stop the buzzing.",
                "action": "👉 **Safe Action**: If you didn't initiate a login, NEVER approve the prompt. Immediately change your password."
            },
            "bec": {
                "concept": "🕴️ **Business Email Compromise (BEC)**",
                "explanation": "Attackers compromise or spoof an executive's email (like the CEO) and trick an employee into wiring funds or buying gift cards.",
                "action": "👉 **Safe Action**: Always verify wire transfers or unusual financial requests via a phone call or in-person conversation, even if the email looks 100% real."
            },
            "domain_age": {
                "concept": "📅 **Domain Age Spoofing**",
                "explanation": "Attackers frequently register new domains just days or hours before launching an attack to bypass traditional blocklists. A domain age of less than 30 days is a significant indicator of potential malicious activity.",
                "action": "👉 **Safe Action**: Treat emails from newly registered domains with extreme caution. Verify the sender through out-of-band communication."
            }
        }

        # Simulation Scenarios (Mini-Game)
        self.simulation_scenarios = [
            {
                "id": 1,
                "text": "Subject: URGENT: Your account will be locked!\nFrom: Apple Support <apple-support@gmail.com>\nBody: Click here to verify your identity within 1 hour or lose access.",
                "answer": "sender", # by default check for sender/urgency
                "type": "spoofing",
                "explanation": "Correct! The sender is `apple-support@gmail.com` (a public domain), not `apple.com`. Also, uses extreme urgency."
            },
            {
                "id": 2,
                "text": "Subject: Invoice #12345 attached\nFrom: Billing <billing@company.com>\nBody: Please review the attached zip file for payment.",
                "answer": "attachment",
                "type": "attachment",
                "explanation": "Good catch! Unexpected zip files / invoices are a classic way to deliver malware. Verify with the finance team first."
            },
            {
                "id": 3,
                "text": "Subject: Update your password\nFrom: HR <hr@g00gle.com>\nBody: Click here to update your password immediately.",
                "answer": "sender", 
                "type": "typosquatting",
                "explanation": "Spot on! Look closely at the domain: `g00gle.com` uses zeros instead of 'o's (Typosquatting)."
            },
            {
                "id": 4,
                "text": "Subject: Your Amazon Order #992-1234 has shipped\nFrom: Amazon <orders@amazon.com>\nBody: Thank you for your $1,200 purchase! If you did not make this purchase, call us immediately at 1-800-FAKE-NUM.",
                "answer": "number", 
                "type": "vishing",
                "explanation": "Excellent! This is a Vishing (Voice Phishing) setup. The email looks real, but the phone number connects you to a scammer who will try to steal your credit card details. Always look up official numbers yourself."
            },
            {
                "id": 5,
                "text": "Subject: Are you at your desk?\nFrom: CEO John Smith <ceo.john.smith.external@gmail.com>\nBody: I'm in a meeting and need you to buy 5 Apple Gift cards for a client right now. I will reimburse you later.",
                "answer": "gift card", 
                "type": "bec",
                "explanation": "Correct! This is Business Email Compromise (BEC). CEOs do not ask employees to buy gift cards from external Yahoo/Gmail addresses. The urgency and payment method are huge red flags."
            },
            {
                "id": 6,
                "text": "Subject: Please Review Draft Proposal\nFrom: Colleague <trusted.colleague@company.com>\nBody: Hey, please review this secure document. [Link: bit.ly/draft-proposal-v2]",
                "answer": "link", 
                "type": "shortener",
                "explanation": "Great catch! Even if the sender looks like a trusted colleague (their account may be compromised), a URL shortener (`bit.ly`) masking a 'secure document' is highly suspicious."
            }
        ]
        self.user_session = {} # Track simulation state per user (mocked for single user context)

    async def chat(self, message: str, email_data: Optional[Dict[str, Any]] = None) -> str:
        return self._generate_response(message, email_data)
    
    def _generate_response(self, message: str, email_data: Optional[Dict[str, Any]] = None) -> str:
        msg_lower = message.lower()
        
        try:
            # --- 0. WALKTHROUGH / CAPABILITIES ---
            if any(phrase in msg_lower for phrase in ['walkthrough', 'what can you do', 'capabilities', 'features']):
                return ("✨ **I am the PhishGuard AI Assistant, your Cybersecurity Co-pilot.**\n\n"
                        "Here is what I can do for you:\n"
                        "1. **🔍 Email Analysis**: Open an email and ask *'Why is this flagged?'* to get a breakdown of risks.\n"
                        "2. **🎓 Phishing Education**: Ask about concepts like *'What is spoofing?'* or *'Explain urgency'*.\n"
                        "3. **🎮 Interactive Training**: Type *'Train me'* to start a simulation and test your skills.\n"
                        "4. ** Safety Checks**: Ask *'How do I verify this safely?'* for actionable advice.\n\n"
                        "How would you like to proceed?")

            # --- 1. SIMULATION MODE (Interactive Quiz) ---
            # Trigger Simulation
            if "train me" in msg_lower or "simulation" in msg_lower:
                self.user_session["mode"] = "simulation"
                self.user_session["step"] = 0
                scenario = self.simulation_scenarios[0]
                return (f"🎓 **SOC Training Module Activated (Level 1/6)**\n\n"
                        f"Analyze this email snippet:\n\n"
                        f"---\n{scenario['text']}\n---\n\n"
                        f"What is the biggest red flag here? (Hint: Is it the Sender, Attachment, Link, Number, or Urgency?)")

            # Handle Simulation Answers vs Force Exit
            if self.user_session.get("mode") == "simulation":
                # ESCAPE HATCH: If user asks a normal question, quit simulation immediately
                if any(w in msg_lower for w in ['why', 'explain', 'flagged', 'verify', 'help', 'what', 'stop', 'exit']):
                    self.user_session = {} # Reset session
                    # Fall through to normal logic below...
                else:
                    # Check answer for simulation
                    step = self.user_session.get("step", 0)
                    scenario = self.simulation_scenarios[step]
                    
                    # Flexible answer matching
                    params = [scenario["answer"], scenario["type"]]
                    if any(p in msg_lower for p in params) or ("link" in msg_lower and "url" in scenario["type"]):
                        # Correct!
                        response = f" **Correct!**\n{scenario['explanation']}"
                        next_step = step + 1
                        if next_step < len(self.simulation_scenarios):
                            self.user_session["step"] = next_step
                            next_scen = self.simulation_scenarios[next_step]
                            response += f"\n\n🚀 **Next Challenge (Level {next_step + 1}/6):**\n\n---\n{next_scen['text']}\n---\nWhat's suspicious here?"
                            return response
                        else:
                            self.user_session = {} # Reset
                            return response + "\n\n🎉 **Training Complete!** You have successfully identified all threats."
                    else:
                        return f"❌ Not quite. Look closer at the '{scenario['answer']}'... Try again! (Or type 'Stop' to exit)"


            # --- 2. CONTEXT AWARE EDUCATION (If viewing an email) ---
            if email_data:
                risk_score = email_data.get('risk_score', 0)
                reasons = email_data.get('reasons', []) or []
                
                # BUG FIX: Ensure reasons is a list, not a string (prevent "H", "i", "g", "h" flags)
                if isinstance(reasons, str):
                    try:
                        reasons = json.loads(reasons.replace("'", '"'))
                    except Exception:
                        if ',' in reasons:
                            reasons = [r.strip() for r in reasons.split(',')]
                        else:
                            reasons = [reasons]
                
                # Clean up formatting artifacts (JSON brackets, escaped quotes, newlines)
                cleaned_reasons = []
                for r in reasons:
                    r_str = str(r)
                    r_str = r_str.replace('\\n', '\n').replace('\\"', '"')
                    
                    # Strip leading/trailing array brackets and quotes that might have survived double-serialization
                    if r_str.startswith('["') or r_str.startswith("['"): r_str = r_str[2:]
                    elif r_str.startswith('[') or r_str.startswith('"') or r_str.startswith("'"): r_str = r_str[1:]
                    
                    if r_str.endswith('"]') or r_str.endswith("']"): r_str = r_str[:-2]
                    elif r_str.endswith(']') or r_str.endswith('"') or r_str.endswith("'"): r_str = r_str[:-1]
                    
                    # One more pass to catch anything remaining
                    r_str = r_str.strip('[]"\'')
                    
                    cleaned_reasons.append(r_str.strip())
                reasons = cleaned_reasons
                
                # User asks "Why?" or regarding flags
                if any(w in msg_lower for w in ['why', 'explain', 'flagged', 'dangerous', 'analysis']):
                    if not reasons:
                        return "This email appears safe. The AI has detected no significant threats."
                    
                    # 1. VISUALIZATION TAG (Frontend will render this as a bar)
                    response_parts = [f"[RISK_METER:{risk_score}]"]
                    response_parts.append(f"**AI Analysis**: Risk Score **{risk_score}/100**.")
                    
                    # 2. Get ML Keywords for Highlighting
                    top_words = email_data.get('top_words', [])
                    # handle similar bug for top_words
                    if isinstance(top_words, str): 
                         if ',' in top_words: top_words = [w.strip() for w in top_words.split(',')]
                         else: top_words = [top_words]
                    
                    found_topics = set()
                    
                    # Dedup reasons
                    seen_reasons = set()
                    unique_reasons = []
                    for r in reasons:
                        if r not in seen_reasons and not r.startswith("[SAFE]"):
                            seen_reasons.add(r)
                            unique_reasons.append(r)

                    for reason in unique_reasons:
                        reason_lower = reason.lower()
                        
                        # Add the actual flag from the engine
                        response_parts.append(f"\n🚩 **Flag Detected:**\n{reason}")
                        
                        # Match reason to educational topic
                        topic = None
                        if "urgency" in reason_lower or "urgent" in reason_lower: topic = "urgency"
                        elif "password" in reason_lower or "credential" in reason_lower: topic = "credentials"
                        elif "spoof" in reason_lower or "match" in reason_lower or "public domain" in reason_lower: topic = "scanner_spoofing"
                        elif "short" in reason_lower: topic = "url_shortener"
                        elif "attachment" in reason_lower or "file" in reason_lower or "zip" in reason_lower: topic = "malicious_attachment"
                        elif "typo" in reason_lower or "lookalike" in reason_lower: topic = "lookalike_domain"
                        elif "brand" in reason_lower or "impersonation" in reason_lower or "pretends to be" in reason_lower: topic = "brand_impersonation"
                        elif "financial" in reason_lower or "crypto" in reason_lower or "invoice" in reason_lower or "payment" in reason_lower: topic = "financial_scam"
                        
                        # If a specific educational topic applies, explain it (only once per topic)
                        if topic and topic not in found_topics:
                            found_topics.add(topic)
                            edu = self.education_db.get(topic)
                            if edu:
                                explanation = edu['explanation']
                                response_parts.append(f"\n*(Education: {edu['concept']})*\n*Why:* {explanation}\n{edu['action']}")
                            
                    if top_words and any(top_words):
                        cleaned_words = [w for w in top_words if w.strip()]
                        if cleaned_words:
                            response_parts.append(f"\n🧠 **AI Focus Words:** {', '.join(cleaned_words)}")

                    return "\n".join(response_parts)

                if 'quarantine' in msg_lower:
                    if risk_score >= 80:
                        return f"🚨 **Yes, Quarantine Highly Recommended.**\n\nThis email has a **Risk Score of {risk_score}/100** and is classified as **{email_data.get('label', 'UNKNOWN')}**. It poses a direct threat to the organization based on the detected NLP and behavioral telemetry."
                    elif risk_score >= 50:
                        return f"⚠️ **Proceed with Caution.**\n\nThis email has a **Risk Score of {risk_score}/100** (Suspicious). It contains anomalies that require manual analyst review before release. Quarantining until verified is a safe approach."
                    else:
                        return f"✅ **Probably Not.**\n\nThis email has a low **Risk Score of {risk_score}/100** and appears safe. Unless you have external threat intelligence suggesting otherwise, it is likely a false positive if flagged."

                if 'spf' in msg_lower and 'fail' in msg_lower:
                    return f"🛡️ **SPF (Sender Policy Framework) FAIL** means that the IP address sending this email is not authorized by the domain owner. For this specific email (Risk {risk_score}/100), this represents a high probability of **Identity Spoofing**—the sender is forged."

                if 'risk score' in msg_lower and 'high' in msg_lower:
                    return f"A Risk Score of **{risk_score}/100** is considered **{'Critical/High' if risk_score >= 80 else 'Medium/Suspicious' if risk_score >= 50 else 'Low/Safe'}**. This score is an aggregate of ML feature weights including NLP anomalies, domain reputation, and authentication failures."

                if 'kill chain' in msg_lower:
                    label = email_data.get('label', 'UNKNOWN')
                    if label == 'PHISHING' or risk_score >= 70:
                        return f"🔗 **Attack Kill Chain (Current Context: {label})**:\n1. **Reconnaissance**: Attacker identified the target email address.\n2. **Weaponization/Delivery**: Sending this malicious payload to bypass perimeter defenses.\n3. **Exploitation/Installation**: (Pending User Action) If clicked, it steals credentials or drops malware.\n\n👉 *Status*: We have successfully intercepted at the **Delivery** phase."
                    else:
                        return f"🔗 **Attack Kill Chain (Current Context: {label})**:\nBased on current telemetry, this email does not strongly map to an active attack progression. If it is an attack, it was stopped very early in the reconnaissance/delivery phase."

            # --- 3. GENERAL KNOWLEDGE (Definitions) ---
            # Action Advice / Safety Checks (Global)
            if any(w in msg_lower for w in ['safely', 'verify', 'do', 'action', 'safety check', 'remediation', 'remediate']):
                return (" **Gemini AI Safety Protocol**:\n"
                        "1. **Hover, Don't Click**: Check the actual URL destination.\n"
                        "2. **Verify Out-of-Band**: Contact the sender via a known, official channel.\n"
                        "3. **Inspect Headers**: Check the 'From' address for subtle misspellings.")
                        
            if 'what is phishing' in msg_lower:
                return "🎣 **Phishing** is a deceptive practice where attackers masquerade as trusted entities to steal sensitive data. My algorithms help you detect these attempts through analysis and education."
            
            if 'spoofing' in msg_lower:
                return "🎭 **Spoofing** involves falsifying data to masquerade as a legitimate source (e.g., sending an email from `security@paypa1.com` instead of `paypal.com`)."
                
            if 'phishtank' in msg_lower:
                return "🐟 **PhishTank** is a collaborative clearing house for data and information about phishing on the Internet. We cross-reference URLs against their database."

            if 'ransomware' in msg_lower:
                return self.education_db['ransomware']['concept'] + "\n" + self.education_db['ransomware']['explanation'] + "\n\n" + self.education_db['ransomware']['action']

            if 'spear' in msg_lower:
                return "🎯 **Spear Phishing**: Unlike mass phishing, this is highly targeted. The attacker researches you (via LinkedIn, etc.) and crafts an email specifically for you, using real names and projects to build trust."
                
            if 'whaling' in msg_lower:
                return "🐳 **Whaling**: A specialized form of Spear Phishing aimed at high-profile targets like CEOs or CFOs to steal massive funds or highly confidential company data."

            if 'bec' in msg_lower or 'business email compromise' in msg_lower:
                 return self.education_db['bec']['concept'] + "\n" + self.education_db['bec']['explanation'] + "\n\n" + self.education_db['bec']['action']

            if 'mfa' in msg_lower or 'push' in msg_lower:
                 return self.education_db['mfa_fatigue']['concept'] + "\n" + self.education_db['mfa_fatigue']['explanation'] + "\n\n" + self.education_db['mfa_fatigue']['action']

            if 'domain age' in msg_lower:
                 return self.education_db['domain_age']['concept'] + "\n" + self.education_db['domain_age']['explanation'] + "\n\n" + self.education_db['domain_age']['action']

            # --- 4. PANIC BUTTON (Emergency Response) ---
            if any(w in msg_lower for w in ['clicked', 'downloaded', 'opened', 'mistake', 'help me', 'panicking', 'scared', 'hacked', 'compromised']):
                 return ("🚨 **EMERGENCY RESPONSE PROTOCOL** 🚨\n\n"
                        "Don't panic. If you think you've interacted with malicious content, act fast:\n"
                        "1. **Disconnect from the network immediately** (unplug the ethernet cable, turn off Wi-Fi). This stops malware from spreading or data from leaving.\n"
                        "2. **Contact IT Support / SOC immediately** via phone. Tell them exactly what you clicked or downloaded.\n"
                        "3. **Change your passwords** ASAP using a *different, clean device*. Start with your email and banking passwords.\n"
                        "4. **Run a full antivirus scan** and do not reboot or turn off the machine unless instructed by IT (it might destroy memory forensics).")

            # --- 5. DASHBOARD GRAPH EXPLANATIONS --- 
            if 'heatmap' in msg_lower or 'mitre' in msg_lower:
                return ("📊 **MITRE ATT&CK Heatmap**\n\n"
                        "**What is it used for?**\n"
                        "Visualizes active threats mapped directly to the MITRE ATT&CK framework tactics and techniques.\n\n"
                        "**How to measure & interpret:**\n"
                        "Darker colors (red/orange) indicate a higher concentration of alerts for a specific tactic. Use this to understand the adversary's current progression through the kill chain.")
                        
            if 'advanced detection matrix' in msg_lower or 'confusion matrix' in msg_lower:
                 return ("📊 **Advanced Detection Matrix**\n\n"
                        "**What is it used for?**\n"
                        "Provides a detailed confusion matrix comparing the model's predictions with actual observed threats. Used for calculating core ML health metrics.\n\n"
                        "**How to measure & interpret:**\n"
                        "Measure the False Positive count (blocking legitimate mail) versus False Negative count (missing actual attacks). High FP creates user friction, high FN creates security risk.")
                        
            if 'safe sender density' in msg_lower or 'density grid' in msg_lower:
                 return ("📊 **Safe Sender Density Grid**\n\n"
                        "**What is it used for?**\n"
                        "This visualizes clusters of emails originating from known domains and passing as 'Safe'. It provides a quick overview of baseline normal traffic patterns.\n\n"
                        "**How to measure & interpret:**\n"
                        "Bright green spots indicate high volume clusters. Look for sudden, unexpected high-density spots that might indicate abnormal traffic bypassing filters.")

            if 'alert volume spike' in msg_lower or 'spike analysis' in msg_lower:
                 return ("📊 **Alert Volume Spike Analysis**\n\n"
                        "**What is it used for?**\n"
                        "Tracks the volume of scanned versus detected emails over time, helping analysts identify large-scale, coordinated attack campaigns.\n\n"
                        "**How to measure & interpret:**\n"
                        "Monitor the visual delta between total scanned emails and blocked threats. A sudden, sharp spike in phishing detections indicates an ongoing attack wave or a compromised internal account.")

            if 'false positive trend' in msg_lower or 'fp rate trend' in msg_lower:
                 return ("📊 **False Positive Trend**\n\n"
                        "**What is it used for?**\n"
                        "Monitors the rate of legitimate emails incorrectly classified as phishing over a 7-day period. Crucial for operational friction tracking.\n\n"
                        "**How to measure & interpret:**\n"
                        "A rising trendline indicates model drift or an overly aggressive new detection signature. A steep slope means immediate model retraining is required.")

            if 'confidence threshold' in msg_lower or 'threshold tuning' in msg_lower:
                 return ("📊 **Confidence Threshold Tuning**\n\n"
                        "**What is it used for?**\n"
                        "Visualizes the direct relationship between the AI's confidence threshold setting and the resulting False Positive rate.\n\n"
                        "**How to measure & interpret:**\n"
                        "Find the optimal intersection point. If the operational threshold drops too low, FPs will surge. Use this graph to recalibrate the baseline risk score required for quarantine.")

            if 'missed threat analysis' in msg_lower or 'fn tracker' in msg_lower:
                 return ("📊 **Missed Threat Analysis (FN Tracker)**\n\n"
                        "**What is it used for?**\n"
                        "Tracks actual threats (False Negatives) that bypassed automated detection and were reported manually. This is critical for uncovering blind spots.\n\n"
                        "**How to measure & interpret:**\n"
                        "Review the 'Count' and 'Source' columns. Repeated missed threats of the same type indicate a systemic failure in the current signatures or ML features.")

            if 'top risk users' in msg_lower:
                 return ("📊 **Top Risk Users Panel**\n\n"
                        "**What is it used for?**\n"
                        "Highlights the organization's most targeted individuals based on aggregate risk score, including inbound attacks and risky behavior.\n\n"
                        "**How to measure & interpret:**\n"
                        "Users marked 'Active Incident' or with a score > 90 require immediate VIP protection or account review. Measure by the volume of active alerts assigned to them.")
                        
            if 'traffic analysis' in msg_lower or 'real-time traffic' in msg_lower:
                 return ("📊 **Real-Time Traffic Analysis**\n\n"
                        "**What is it used for?**\n"
                        "Correlates overall network traffic volume against system load and the rate of incoming threats within the last 24 hours.\n\n"
                        "**How to measure & interpret:**\n"
                        "Watch for anomalies where Threat Volume spikes independently of Traffic Volume, which strongly suggests a targeted attack rather than background noise.")

            if 'threat trend' in msg_lower or '30 day trend' in msg_lower:
                return ("📊 **Threat Trend (30 Days)**\n\n"
                        "**What is it used for?**\n"
                        "Provides a high-level overview of the total volume of detected potential risks versus actual blocked threats over the last month.\n\n"
                        "**How to measure & interpret:**\n"
                        "Use this to monitor the overall threat landscape. A widening gap between Detected and Blocked indicates a growing volume of noise or low-confidence alerts.")
                        
            if 'threat distribution' in msg_lower or 'threat type' in msg_lower:
                return ("📊 **Threat Type Distribution**\n\n"
                        "**What is it used for?**\n"
                        "Breaks down the total volume of blocked attacks into exact threat categories (e.g., Credential Theft, Malware, BEC).\n\n"
                        "**How to measure & interpret:**\n"
                        "Used to identify the most common attack vectors targeting the organization. A sudden shift in the dominant slice requires updating the relevant playbook priorities.")

            if 'detection drift' in msg_lower or 'feature drift' in msg_lower:
                 return ("📊 **Detection Drift Monitoring**\n\n"
                        "**What is it used for?**\n"
                        "Tracks the AI model's Confidence and False Positive (FP) rates over a 30-day period, alongside feature weight changes.\n\n"
                        "**How to measure & interpret:**\n"
                        "A declining confidence trend or rising FP rate indicates the model is degrading (drifting). The feature weight section shows exactly which signals are changing.")

            if 'confidence breakdown' in msg_lower or 'xai analysis' in msg_lower:
                 return ("📊 **Confidence Breakdown (XAI)**\n\n"
                        "**What is it used for?**\n"
                        "Visualizes how the Explainable AI (XAI) engine weighted different features to arrive at the final Risk Score and Threat Classification.\n\n"
                        "**How to measure & interpret:**\n"
                        "High scores in specific categories indicate the primary attack vector. For example, a 95% URL Analysis score implies the email contains a highly suspicious link.")

            # --- 5. CONVERSATIONAL AI & PROJECT CONTEXT ---
            if any(w in msg_lower for w in ['who made you', 'who created you', 'your creator', 'who built you']):
                return "I am the PhishGuard AI Assistant, custom-built for **Project PhishGuard**. My purpose is to help users identify and understand email-based cyber threats using advanced machine learning models (BERT, LSTM, XGBoost) and behavioral telemetry."
                
            if any(w in msg_lower for w in ['how does this work', 'how do you work', 'how does it work', 'machine learning', 'ai works']):
                return "🧠 **Under the Hood**: When you analyze an email, I use an ensemble of 4 models:\n1. **BERT (NLP)** reads the context of the text.\n2. **LSTM** sequence analyzes the writing style for anomalies.\n3. **XGBoost & Random Forest** analyze metadata (URLs, sender domain, SPF/DKIM records) to calculate a final Risk Score."

            if any(w in msg_lower for w in ['tell me a joke', 'funny', 'joke']):
                return "Here's a cybersecurity joke for you:\n\n*Why did the hacker break up with the internet?*\n*Because there was no connection!* 🤖😆"
                
            if any(w in msg_lower for w in ['thank you', 'thanks', 'helpful']):
                return "You're very welcome! Stay safe out there in the digital wild. If you need anything else, just ask!"
                
            if any(w in msg_lower for w in ['are you real', 'are you a human', 'are you a person']):
                return "I am a highly advanced cybersecurity AI designed specifically for PhishGuard. While I'm not human, my training allows me to detect threats that humans might miss!"

            # --- 6. GENERAL GREETINGS ---
            if "hello" in msg_lower or "hi" in msg_lower or "hey" in msg_lower:
                return ("✨ **Hello, I am the PhishGuard AI Assistant!**\n"
                        "I am your PhishGuard cybersecurity assistant.\n\n"
                        "Ask me:\n"
                        "- 'Give me a walkthrough'\n"
                        "- 'Train me'\n"
                        "- 'Why is this email flagged?'\n"
                        "- 'How does your AI work?'")

            # --- 7. SMART FALLBACK ---
            return ("I understand you're asking about **" + message[:30] + "...**\n\n"
                    "I am currently specialized strictly in **Cybersecurity and Email Threat Analysis** for PhishGuard. \n"
                    "Try asking me to `Train me`, `Give me a walkthrough`, or ask a specific question like `What is ransomware?`")

        except Exception as e:
            logger.error(f"Chatbot Error: {e}")
            return "The AI Assistant encountered a processing error. Please try again."

# Global chatbot instance
chatbot = GeminiAIChatbot()

