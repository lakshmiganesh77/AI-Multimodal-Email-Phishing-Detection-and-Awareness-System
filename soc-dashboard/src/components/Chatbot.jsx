import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, User, Shield, Zap, Map, Mail, AlertCircle, Activity, LineChart, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const DEFAULT_CHATBOT_REPLY = 'I analyze real-time SOC data. I can help you investigate alerts, explain dashboard graphs, and walk through phishing response logic.';

const getLocalKnowledgeResponse = (input) => {
    const question = input.toLowerCase();

    if (question.includes('heatmap')) {
        return "**Risk Analytics Heatmap**\n\nThe weekly heatmap shows when alert activity clusters across the week. Darker cells mean higher attack density during that day and hour.\n\nUse it to:\n1. Identify peak phishing windows.\n2. Align analyst staffing with attack timing.\n3. Correlate campaign bursts with business-hour targeting.\n\nIf attacks cluster during working hours, the attacker is likely optimizing for higher click and reply rates.";
    }

    if (question.includes('bec') || question.includes('business email compromise')) {
        return "**BEC Response Playbook**\n\n1. Confirm the targeted executive, finance user, or mailbox.\n2. Disable suspicious forwarding and inbox rules immediately.\n3. Reset credentials and revoke active sessions.\n4. Review sent mail, deleted items, delegated access, and OAuth grants.\n5. Block attacker domains, reply-to infrastructure, and linked URLs.\n6. Notify finance and leadership if funds transfer fraud is possible.\n7. Hunt for the same lure across all mailboxes.\n8. Preserve logs, headers, and mailbox audit evidence for incident review.\n\nBEC is dangerous because the attacker usually wants payment fraud, not just account access.";
    }

    if (question.includes('playbook') && question.includes('phishing')) {
        return "**Phishing Response Playbook**\n\n1. Validate sender spoofing, link risk, attachment risk, and authentication failures.\n2. Quarantine the email and search for related copies across other users.\n3. Block malicious sender domains, URLs, hashes, and lookalike infrastructure.\n4. Review SPF, DKIM, and DMARC results.\n5. Check whether any user clicked, opened, replied, or submitted credentials.\n6. Reset affected accounts and isolate endpoints if payload execution is suspected.\n7. Map the event to MITRE ATT&CK and feed lessons back into detections.\n\nThe objective is fast containment first, then environment-wide scoping.";
    }

    if (question.includes('kill chain') || question.includes('credential phishing') || question.includes('mitre attack')) {
        return "**Credential Phishing Kill Chain**\n\n1. Reconnaissance: attacker profiles departments such as Finance or HR.\n2. Resource Development: lookalike domains and phishing infrastructure are prepared.\n3. Initial Access: user receives spearphishing link or attachment.\n4. Credential Access: fake login portal captures credentials or MFA prompts.\n5. Persistence: mailbox rules or session abuse may be established.\n6. Collection: attacker reads email threads, invoices, or sensitive documents.\n7. Exfiltration or Impact: credentials, data, or payment instructions are abused.\n\nThe kill-chain view helps analysts see where the attacker was stopped and where detections need more depth.";
    }

    if (question.includes('drift') || question.includes('tpr') || question.includes('fpr') || question.includes('rule health')) {
        return "**Detection Engineering Metrics**\n\nTrue Positive Rate measures how many real malicious events were correctly detected. A strong TPR means the pipeline is catching real attacks instead of missing them.\n\nFeature Drift shows whether attacker behavior is changing away from the training baseline. Important drift signals in this dashboard include urgency keywords, sender domain age, URL mismatch, authentication failures, and financial-pressure language.\n\nIf drift rises while TPR falls or FPR rises, the model and rules need tuning, retraining, or new features.";
    }

    if (question.includes('mitre') || question.includes('coverage')) {
        return "**MITRE ATT&CK Coverage**\n\nThe dashboard shows stronger visibility in tactics such as Execution and Defense Evasion, while Persistence and Exfiltration remain weaker. That means the SOC is better at spotting many front-end phishing behaviors than some later-stage post-compromise behaviors.\n\nOperationally, use this graph to prioritize new detections where attacker dwell time could increase.";
    }

    if (question.includes('threat intel') || question.includes('ioc') || question.includes('campaign') || question.includes('apt')) {
        return "**Threat Intel Fusion**\n\nThis view correlates domains, IPs, campaigns, MITRE techniques, and actor patterns into one investigative surface. It helps analysts answer:\n- Which infrastructure is active right now?\n- Is this a one-off lure or part of a broader campaign?\n- Which MITRE techniques are repeating?\n- Which threat actor profile best matches the activity?\n\nUse it for IOC pivoting, campaign clustering, and attack attribution context.";
    }

    if (question.includes('executive') || question.includes('security posture') || question.includes('board') || question.includes('business')) {
        return "**Executive Analytics**\n\nThis view translates SOC telemetry into leadership-level risk. It summarizes threat volume, critical incidents, blocked BEC attempts, user exposure, and security posture.\n\nIt is useful for explaining whether risk is rising, which business units are most exposed, and whether security controls are reducing meaningful business impact.";
    }

    if (question.includes('risk analytics') || question.includes('department') || question.includes('geo') || question.includes('targeted departments')) {
        return "**Risk Analytics Overview**\n\nThis dashboard explains who is being targeted, when attacks peak, where campaigns are attributed, and which detection domains are weak.\n\nImportant visuals include:\n- Weekly timing heatmap\n- Geographic threat distribution\n- Detection capability scoring\n- Department targeting, especially Finance and HR\n\nThis is the best screen for understanding exposure concentration and operational risk patterns.";
    }

    if (question.includes('xai') || question.includes('explainable') || question.includes('feature importance') || question.includes('shap')) {
        return "**Explainable AI Analysis**\n\nThe XAI view explains why the model classified an alert the way it did. It breaks down confidence, suspicious indicators, feature influence, and related MITRE behaviors.\n\nUse it when you need to answer why a message was flagged and whether the model reasoning is trustworthy.";
    }

    if (question.includes('analyst ops') || question.includes('workload') || question.includes('queue')) {
        return "**Analyst Ops Dashboard**\n\nThis view tracks queue pressure, analyst workload, and open-alert distribution. It helps determine whether triage is healthy or whether staffing and burnout risk are degrading response speed.";
    }

    if (question.includes('red team') || question.includes('simulation')) {
        return "**Red Team Simulator**\n\nThis module tests whether current detections and playbooks hold up against realistic phishing and BEC scenarios. It is a readiness view for both rules and analyst response quality.";
    }

    if (question.includes('system status') || question.includes('api') || question.includes('database') || question.includes('ml engine')) {
        return "**System Status Panel**\n\nThe system status card gives the quick operational health check for the SOC stack. It confirms whether the API is reachable, the database is connected, and the ML engine is active.\n\nIf any of these degrade, dashboards may stale, detections may lag, and analyst context may become incomplete.";
    }

    if (question.includes('graph') || question.includes('dashboard') || question.includes('metric')) {
        return "**SOC Dashboard Guide**\n\nI can explain each major dashboard area in detail:\n- Alert Triage: live incident queue and current investigations.\n- Threat Intel: infrastructure, campaigns, actors, and IOC mapping.\n- Explainable AI: why the model made its decision.\n- Executive Analytics: business impact and posture trends.\n- Risk Analytics: heatmaps, geography, targeting, and capability gaps.\n- Analyst Ops: workload and queue health.\n- Red Team: simulation-based readiness checks.\n- Detection Engineering: TPR, FPR, drift, feature health, and MITRE coverage.\n\nAsk for any graph by name and I will explain what it means, why it matters, and how to use it.";
    }

    return `I've formulated a response for "${input}":\n\n${DEFAULT_CHATBOT_REPLY}\n\nYou can ask about phishing playbooks, BEC response, MITRE coverage, threat intel, XAI, dashboard graphs, detection drift, analyst workload, or executive risk summaries.`;
};

const Chatbot = ({ initialQuestion, onQuestionHandled, alertId }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bot',
            text: "Hello, Analyst. I am PhishGuard AI Copilot.\n\n**SOC Playbook and Engineering Mode Active**\n\nI can explain phishing investigations, BEC response, MITRE ATT&CK mapping, detection drift, TPR and FPR, XAI model reasoning, threat-intel context, and the graphs across this SOC dashboard in detail.\n\nAsk me things like:\n- What is the playbook for BEC?\n- Explain the weekly heatmap.\n- What does MITRE coverage mean?\n- Break down detection drift.\n- Explain executive analytics and security posture."
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (initialQuestion) {
            handleSend(initialQuestion);
            if (onQuestionHandled) {
                onQuestionHandled();
            }
        }
    }, [initialQuestion]);

    const activeAlertId = alertId || localStorage.getItem('selectedAlertId');

    const suggestedPrompts = activeAlertId ? [
        { id: 1, icon: AlertCircle, label: 'Why Triggered?', query: 'Why was this specific alert flagged by the AI?' },
        { id: 2, icon: Shield, label: 'SOC Playbook', query: 'What is the SOC playbook for this type of threat? Give me step-by-step response actions.' },
        { id: 3, icon: Mail, label: 'BEC Playbook', query: 'What are the immediate steps for Business Email Compromise? Include disabling forwarding rules, notifying finance, and blocking attacker domain.' },
        { id: 4, icon: Zap, label: 'Kill Chain', query: 'Explain the attack kill chain stages for this phishing alert and what the attacker likely did at each stage.' },
    ] : [
        { id: 1, icon: Mail, label: 'Phishing Playbook', query: 'What is the SOC playbook for a phishing email targeting finance? Give me all the steps.' },
        { id: 2, icon: Shield, label: 'BEC Response', query: 'What are the immediate response steps for Business Email Compromise targeting the CFO?' },
        { id: 3, icon: Map, label: 'Explain Kill Chain', query: 'Explain the MITRE ATT&CK kill chain for a credential phishing attack, from initial access to exfiltration.' },
        { id: 4, label: 'Explain Heatmap', query: 'What does the Risk Analytics weekly heatmap show?', icon: Activity },
        { id: 5, label: 'Explain TPR & Drift', query: 'What is our current True Positive Rate and Feature Drift?', icon: LineChart },
        { id: 6, label: 'MITRE Coverage', query: 'Show me our MITRE ATT&CK detection coverage gaps.', icon: Crosshair },
    ];

    const handleSend = async (text) => {
        if (!text.trim()) return;

        const userMsg = { id: Date.now(), sender: 'user', text };
        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const selectedAlertId = alertId || localStorage.getItem('selectedAlertId');
            let parsedId = null;
            if (selectedAlertId && selectedAlertId !== 'undefined' && selectedAlertId !== 'null') {
                const num = parseInt(selectedAlertId, 10);
                if (!isNaN(num)) parsedId = num;
            }

            const res = await axios.post(`${API_BASE}/chat`, {
                message: text,
                email_id: parsedId
            });

            const responseText = getLocalKnowledgeResponse(text);
            const botMsg = { id: Date.now() + 1, sender: 'bot', text: res.data.reply || res.data.response || responseText };
            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            console.error('Chatbot Request Failed:', err);
            let errMsg = `${getLocalKnowledgeResponse(text)}\n\n---\n\nBackend note: I am having trouble connecting to the backend engine.`;

            if (err.code === 'ERR_NETWORK') {
                errMsg += `\n\nConnection refused: ensure the backend server is running on ${API_BASE} and there are no CORS blocks.`;
            } else if (err.response && err.response.data) {
                errMsg += `\n\nServer error (${err.response.status}): ${JSON.stringify(err.response.data.detail || err.response.data)}`;
            } else if (err.message) {
                errMsg += `\n\nError details: ${err.message}`;
            }

            const errorMsg = { id: Date.now() + 1, sender: 'bot', text: errMsg };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="h-full flex flex-col relative bg-[#0a0e17]">
            <div className="px-10 py-6 w-full max-w-[1200px] mx-auto z-10">
                <h2 className="text-[18px] font-bold text-white tracking-wide mb-0.5">PhishGuard AI Assistant</h2>
                <p className="text-[12px] text-gray-400">SOC Analyst Assistant</p>
                <div className="h-px w-full mt-4 bg-gradient-to-r from-white/10 via-white/5 to-transparent"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 py-2 flex flex-col items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="w-full max-w-[1100px]">
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex w-full mb-6 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-[#00f3ff] text-[#0a0e17]' : 'border border-[#00f3ff]/40 bg-transparent text-[#00f3ff]'}`}>
                                    {msg.sender === 'user' ? <User size={16} strokeWidth={2.5} /> : <Brain size={16} strokeWidth={2} />}
                                </div>

                                <div className={`mt-0.5 rounded-[16px] leading-[1.6] text-[13px] ${msg.sender === 'user' ? 'bg-[#0d1624] px-4 py-3 border border-[#1a2b44] text-gray-200 shadow-sm' : 'bg-transparent p-0 border-none text-gray-300'}`}>
                                    <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b class="text-white">$1</b>') }} />
                                    {msg.sender === 'bot' && idx === messages.length - 1 && !isTyping && (
                                        <span className="inline-block w-1 h-[13px] ml-[2px] bg-[#0099ff] animate-pulse align-middle opacity-80 shadow-[0_0_6px_rgba(0,153,255,0.8)]"></span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-3 mb-6">
                            <div className="w-8 h-8 rounded-md bg-transparent flex items-center justify-center border border-[#00f3ff]/40 text-[#00f3ff] shrink-0">
                                <Brain size={16} strokeWidth={2} />
                            </div>
                            <div className="flex items-center gap-[3px] h-8 pl-1">
                                <span className="w-1 h-1 rounded-full bg-[#00f3ff]/60 animate-bounce"></span>
                                <span className="w-1 h-1 rounded-full bg-[#00f3ff]/60 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-1 h-1 rounded-full bg-[#00f3ff]/60 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    )}
                    <div className="h-6" ref={messagesEndRef} />
                </div>
            </div>

            <div className="px-6 pb-6 w-full flex flex-col items-center bg-[#0a0e17]">
                {messages.length < 3 && (
                    <div className="flex gap-3 flex-wrap justify-center w-full max-w-[800px] mb-4">
                        {suggestedPrompts.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => handleSend(p.query)}
                                className="flex items-center gap-2 px-5 py-2 bg-transparent border border-white/10 rounded-full text-gray-300 text-[12px] hover:border-[#00f3ff]/50 hover:text-[#00f3ff] hover:bg-[#00f3ff]/5 transition-all duration-200"
                            >
                                <p.icon size={14} />
                                {p.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="w-full max-w-[1000px] h-[50px] relative bg-[#1c2333]/80 rounded-xl border border-white/5 flex items-center px-4 group focus-within:border-[#00f3ff]/40 transition-all shadow-md">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                        placeholder="Ask PhishGuard Copilot..."
                        className="flex-1 bg-transparent border-none outline-none text-gray-300 text-[13px] h-full font-sans placeholder:text-gray-600 pl-1"
                    />
                    <button
                        onClick={() => handleSend(inputValue)}
                        disabled={!inputValue.trim()}
                        className={`border-none p-2 ml-2 transition-all duration-200 flex items-center justify-center rounded-xl ${inputValue.trim() ? 'bg-transparent text-[#00f3ff] hover:scale-110 cursor-pointer drop-shadow-[0_0_5px_rgba(0,243,255,0.4)]' : 'bg-transparent text-gray-600 cursor-default'}`}
                    >
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-[11px] text-gray-500 font-medium mt-3">
                    AI may produce inaccurate information about system attributes. Verify important data.
                </p>
            </div>
        </div>
    );
};

export default Chatbot;
