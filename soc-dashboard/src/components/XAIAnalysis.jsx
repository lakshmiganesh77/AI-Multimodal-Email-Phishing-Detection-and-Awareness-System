import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Brain, AlertTriangle, Shield, CheckCircle,
    AlertCircle, BarChart2, Zap, Globe, Lock, Eye, Expand, X,
    Crosshair, AlignLeft, ShieldAlert, Cpu, Activity, Clock
} from 'lucide-react';
import CustomTooltip from './CustomTooltip';

const XAIAnalysis = () => {
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');
    const [expandedPanel, setExpandedPanel] = useState(null); // ID of the panel to expand

    const emails = [
        {
            id: 1,
            type: 'Suspicious',
            confidence: 61,
            subject: 'CEO Request: Wire transfer needed today',
            sender: 'invoice@paypa1-billing.com',
            timestamp: '10 mins ago',
            riskScore: 75,
            threatType: 'Spear Phishing',
            signals: [
                { id: 1, text: 'Sender domain registered 3 days ago', severity: 'high' },
                { id: 2, text: 'Urgency detected in email body ("needed today")', severity: 'medium' },
                { id: 3, text: 'Mismatched display name and email address', severity: 'medium' }
            ],
            featureImportance: [
                { feature: 'Urgency Language', value: 32 },
                { feature: 'New Domain Age', value: 24 },
                { feature: 'Sender Reputation', value: 18 },
                { feature: 'Malicious URL', value: 16 },
                { feature: 'Header Anomaly', value: 10 }
            ],
            headers: {
                spf: 'Fail', dkim: 'Fail', dmarc: 'Fail',
                ip: '185.220.101.47', geo: 'Russia'
            },
            attackPattern: {
                technique: 'CEO Impersonation',
                mitreId: 'T1566',
                category: 'Social Engineering'
            },
            timeline: [
                { step: 'Email parsed', desc: 'Extracted headers, body, and attachments.' },
                { step: 'NLP urgency detected', desc: 'BERT model flagged "urgent transfer required".' },
                { step: 'Domain age anomaly', desc: 'WHOIS lookup reveals domain is 3 days old.' },
                { step: 'Threat score increased', desc: 'Combined signals crossed suspicious threshold (Risk: 75).' }
            ],
            recommendedActions: [
                'Block sender domain (paypa1-billing.com)',
                'Quarantine email from user inbox',
                'Notify finance team of CEO impersonation attempt'
            ],
            xaiMethod: {
                model: 'NLP Phishing Classifier',
                method: 'SHAP Feature Attribution'
            }
        },
        {
            id: 2,
            type: 'Phishing',
            confidence: 89,
            subject: 'Password reset required - Action needed',
            sender: 'hr@internal-updates.org',
            timestamp: '25 mins ago',
            riskScore: 98,
            threatType: 'Credential Theft',
            signals: [
                { id: 1, text: 'URL redirects to known phishing infrastructure', severity: 'critical' },
                { id: 2, text: 'Login page clone detected', severity: 'high' }
            ],
            featureImportance: [
                { feature: 'Suspicious URL Redirect', value: 45 },
                { feature: 'Visual UI Clone (Login)', value: 30 },
                { feature: 'Sender Impersonation', value: 15 },
                { feature: 'Zero-day Domain', value: 10 }
            ],
            headers: {
                spf: 'Fail', dkim: 'Pass', dmarc: 'Fail',
                ip: '45.133.19.12', geo: 'Romania'
            },
            attackPattern: {
                technique: 'Credential Harvesting',
                mitreId: 'T1056.002',
                category: 'Collection'
            },
            timeline: [
                { step: 'Email parsed', desc: 'Identified embedded hyperlink.' },
                { step: 'URL sandbox detonated', desc: 'Link redirects to fake Microsoft login portal.' },
                { step: 'Heuristics matched', desc: 'Visual clone detected with 94% similarity.' },
                { step: 'Zero-day threat flagged', desc: 'IP matches known botnet infrastructure.' }
            ],
            recommendedActions: [
                'Blacklist URL across all endpoints',
                'Force password reset for targeted user',
                'Start automated incident response playbook'
            ],
            xaiMethod: {
                model: 'Computer Vision & XGBoost Engine',
                method: 'LIME Instance Explanation'
            }
        },
        {
            id: 3,
            type: 'Legitimate',
            confidence: 95,
            subject: 'Your package delivery receipt',
            sender: 'support@amazon.com',
            timestamp: '42 mins ago',
            riskScore: 5,
            threatType: 'None',
            signals: [
                { id: 1, text: 'Passed DKIM/SPF authentication (amazon.com)', severity: 'low' },
                { id: 2, text: 'Known transactional email template', severity: 'low' }
            ],
            featureImportance: [
                { feature: 'Verified Sender IP', value: 40 },
                { feature: 'Cryptographic Auth', value: 35 },
                { feature: 'Template Similarity', value: 25 }
            ],
            headers: {
                spf: 'Pass', dkim: 'Pass', dmarc: 'Pass',
                ip: '54.240.27.18', geo: 'United States'
            },
            attackPattern: {
                technique: 'N/A',
                mitreId: 'None',
                category: 'Benign Traffic'
            },
            timeline: [
                { step: 'Auth Check', desc: 'SPF, DKIM, DMARC passed successfully.' },
                { step: 'Reputation Check', desc: 'Sender IP is highly trusted (Amazon AWS).' },
                { step: 'Content Scan', desc: 'No malicious links or attachments detected.' }
            ],
            recommendedActions: [
                'No action required',
                'Deliver to user inbox'
            ],
            xaiMethod: {
                model: 'Reputation Scoring System',
                method: 'Rule-based Trust Trees'
            }
        },
        {
            id: 4,
            type: 'Suspicious',
            confidence: 83,
            subject: 'Invoice #8492 Overdue',
            sender: 'billing@contos0.com',
            timestamp: '1 hour ago',
            riskScore: 82,
            threatType: 'Impersonation',
            signals: [
                { id: 1, text: 'Typosquatting in sender domain (contos0 instead of contoso)', severity: 'high' },
                { id: 2, text: 'Suspicious attachment (.zip)', severity: 'high' }
            ],
            featureImportance: [
                { feature: 'Typosquatting Domain', value: 55 },
                { feature: 'High-risk Attachment', value: 25 },
                { feature: 'Financial Keyword Density', value: 20 }
            ],
            headers: {
                spf: 'Pass', dkim: 'Fail', dmarc: 'Fail',
                ip: '109.234.33.1', geo: 'Germany'
            },
            attackPattern: {
                technique: 'Spearphishing Attachment',
                mitreId: 'T1566.001',
                category: 'Initial Access'
            },
            timeline: [
                { step: 'Domain analysis', desc: 'Detected Levenshtein distance anomaly: contos0 vs contoso.' },
                { step: 'Attachment scan', desc: 'Identified .zip containing obfuscated JavaScript.' },
                { step: 'Behavioral flag', desc: 'Financial extortion keywords matched.' }
            ],
            recommendedActions: [
                'Quarantine attachment in secure sandbox',
                'Alert user about typosquatting attempt',
                'Add "contos0.com" to blocklist'
            ],
            xaiMethod: {
                model: 'Levenshtein Distance & NLP Ensemble',
                method: 'Integrated Gradients'
            }
        },
        {
            id: 5,
            type: 'Phishing',
            confidence: 97,
            subject: 'URGENT: Your account has been compromised',
            sender: 'support@company-urgent-security.net',
            timestamp: '2 hours ago',
            riskScore: 99,
            threatType: 'Extortion',
            signals: [
                { id: 1, text: 'High-pressure urgency tactics', severity: 'high' },
                { id: 2, text: 'Known extortion campaign signature', severity: 'critical' }
            ],
            featureImportance: [
                { feature: 'Campaign Signature Match', value: 60 },
                { feature: 'Urgency/Threat Language', value: 25 },
                { feature: 'Cryptocurrency Wallet Detected', value: 15 }
            ],
            headers: {
                spf: 'Fail', dkim: 'Fail', dmarc: 'Fail',
                ip: '178.128.1.1', geo: 'Vietnam'
            },
            attackPattern: {
                technique: 'Extortion via Email',
                mitreId: 'T1040',
                category: 'Impact'
            },
            timeline: [
                { step: 'Signature Hash', desc: 'Exact match with known Bitcoin extortion campaign.' },
                { step: 'Threat Intel Sync', desc: 'IP listed on 4 active threat intelligence feeds.' },
                { step: 'Immediate Classification', desc: 'Auto-flagged as critical priority.' }
            ],
            recommendedActions: [
                'Auto-delete from all tenant inboxes',
                'Report cryptocurrency wallet to abuse trackers',
                'Update Threat Intel ruleset'
            ],
            xaiMethod: {
                model: 'Threat Intel Campaign Matching',
                method: 'Exact Signature Override'
            }
        }
    ];

    const getTheme = (type) => {
        switch (type) {
            case 'Phishing': return { color: '#f85149', bg: 'rgba(248, 81, 73, 0.1)', border: '#f85149', icon: AlertCircle };
            case 'Suspicious': return { color: '#d29922', bg: 'rgba(210, 153, 34, 0.1)', border: '#d29922', icon: AlertTriangle };
            case 'Legitimate': return { color: '#3fb950', bg: 'rgba(63, 185, 80, 0.1)', border: '#3fb950', icon: CheckCircle };
            default: return { color: '#7d8590', bg: 'rgba(125, 133, 144, 0.1)', border: '#7d8590', icon: AlertCircle };
        }
    };

    // Filter Logic
    const filteredEmails = emails.filter(email => {
        const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.sender.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'All' || email.type === filter;
        return matchesSearch && matchesFilter;
    });

    // Sub-components
    const PanelWrapper = ({ id, title, icon: Icon, tooltip, children, className = '' }) => (
        <div
            className={`bg-[#161b22] rounded-xl border border-[#30363d] hover:z-50 flex flex-col ${className}`}
            onDoubleClick={() => setExpandedPanel(id)}
        >
            <div className="px-5 py-3 border-b border-[#30363d] flex items-center justify-between bg-[#1c2128]/50 rounded-t-xl">
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={16} className="text-[#58a6ff]" />}
                    <h3 className="text-[#e6edf3] font-semibold text-sm m-0 flex items-center gap-2">
                        {title}
                    </h3>
                    {tooltip && <CustomTooltip {...tooltip} />}
                </div>
                <button
                    className="text-[#7d8590] hover:text-[#e6edf3] transition-colors p-1"
                    onClick={() => setExpandedPanel(id)}
                    title="Double-click panel or click to expand to fullscreen"
                >
                    <Expand size={14} />
                </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                {children}
            </div>
        </div>
    );

    const renderFeatureImportance = () => {
        if (!selectedEmail) return null;
        return (
            <div className="flex flex-col gap-3">
                {selectedEmail.featureImportance.map((item, idx) => (
                    <div key={idx}>
                        <div className="flex justify-between mb-1.5">
                            <span className="text-[#7d8590] text-xs font-medium">{item.feature}</span>
                            <span className="text-[#e6edf3] text-xs font-bold">{item.value}%</span>
                        </div>
                        <div className="h-2 bg-[#30363d] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.value}%` }}
                                transition={{ duration: 0.8, delay: idx * 0.1 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: getTheme(selectedEmail.type).color }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderTimeline = () => {
        if (!selectedEmail) return null;
        return (
            <div className="px-2">
                {selectedEmail.timeline.map((item, idx) => (
                    <div key={idx} className="relative pl-6 pb-6 last:pb-2">
                        {/* Connecting Line */}
                        {idx !== selectedEmail.timeline.length - 1 && (
                            <div className="absolute left-[7px] top-6 bottom-0 w-[2px] bg-[#30363d]"></div>
                        )}
                        {/* Dot */}
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-[#161b22] bg-[#58a6ff] z-10 
                                      shadow-[0_0_8px_rgba(88,166,255,0.6)]"></div>

                        <h4 className="text-[#e6edf3] text-sm font-semibold m-0 mb-1">{item.step}</h4>
                        <p className="text-[#7d8590] text-xs m-0 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        );
    };

    // Fullscreen Modal Render
    const renderFullscreenModal = () => {
        if (!expandedPanel || !selectedEmail) return null;

        let content = null;
        let title = "";

        if (expandedPanel === 'features') { title = "AI Decision Factors (Feature Importance)"; content = renderFeatureImportance(); }
        else if (expandedPanel === 'timeline') { title = "Behavioral Risk Timeline"; content = renderTimeline(); }
        else if (expandedPanel === 'headers') {
            title = "Email Authentication (Headers)";
            content = (
                <div className="grid grid-cols-2 gap-6 text-lg">
                    {Object.entries(selectedEmail.headers).map(([key, value]) => (
                        <div key={key} className="bg-[#1c2128] p-6 rounded-lg border border-[#30363d]">
                            <div className="text-[#7d8590] mb-2 uppercase tracking-wide text-sm">{key}</div>
                            <div className={`font-bold ${value === 'Fail' ? 'text-[#f85149]' : value === 'Pass' ? 'text-[#3fb950]' : 'text-[#e6edf3]'}`}>
                                {value}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-[#0d1117]/95 backdrop-blur-md flex items-center justify-center p-8"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-[#30363d] shrink-0">
                            <h2 className="text-2xl font-bold text-[#e6edf3] m-0">{title}</h2>
                            <button
                                onClick={() => setExpandedPanel(null)}
                                className="p-2 hover:bg-[#30363d] rounded-full text-[#7d8590] hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar text-base">
                            {content || <div className="text-[#7d8590]">Content scaling not supported for this panel yet.</div>}
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col -mt-5 relative">
            {renderFullscreenModal()}

            {/* Header */}
            <div className="mb-5">
                <div className="flex items-center gap-3 mb-1">
                    <Brain size={24} color="#58a6ff" />
                    <h2 className="text-[#e6edf3] text-2xl font-semibold m-0">
                        Explainable AI Analysis
                    </h2>
                </div>
                <p className="text-[#7d8590] text-sm ml-9 m-0">
                    Human-readable explanations for AI classification decisions
                </p>
            </div>

            {/* Main Layout */}
            <div className="flex gap-5 flex-1 min-h-0">

                {/* Left Column: Email List & Filters */}
                <div className="w-[35%] flex flex-col gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search size={16} color="#7d8590" className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search emails to analyze..."
                            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md py-3 pr-3 pl-9 text-[#e6edf3] outline-none text-[13px] focus:border-[#58a6ff] transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2 bg-[#0d1117] p-1 rounded-md border border-[#30363d]">
                        {['All', 'Phishing', 'Suspicious', 'Legitimate'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition-colors ${filter === f ? 'bg-[#30363d] text-white' : 'text-[#7d8590] hover:text-[#e6edf3]'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
                        {filteredEmails.map(email => {
                            const theme = getTheme(email.type);
                            const Icon = theme.icon;
                            const isSelected = selectedEmail?.id === email.id;

                            return (
                                <div
                                    key={email.id}
                                    onClick={() => setSelectedEmail(email)}
                                    className={`relative p-4 rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'bg-[#1c2128]' : 'bg-[#161b22] hover:bg-[#1c2128]'}`}
                                    style={{
                                        border: isSelected ? `1px solid ${theme.color}` : '1px solid #30363d',
                                        borderLeft: `3px solid ${theme.color}`
                                    }}
                                >
                                    <div className="flex justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                                style={{ color: theme.color, backgroundColor: theme.bg }}
                                            >
                                                {email.type}
                                            </span>
                                            <span className="text-[#7d8590] text-[11px]">
                                                {email.confidence}% confidence
                                            </span>
                                        </div>
                                    </div>
                                    <h4 className="text-[#e6edf3] text-[13px] font-semibold mb-1 m-0">
                                        {email.subject}
                                    </h4>
                                    <p className="text-[#7d8590] text-xs m-0">
                                        {email.sender}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Detailed Panels */}
                <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar gap-5 pr-2">
                    {selectedEmail ? (
                        <>
                            {/* Panel 1: Top Level Classification & Breakdown */}
                            <div className="grid grid-cols-2 gap-5 shrink-0">
                                <PanelWrapper id="overview" title="AI Classification Result" icon={Eye} className="h-[220px]">
                                    <div className="flex flex-col gap-4 h-full">
                                        <div className="bg-[#0d1117] p-3 rounded border border-[#30363d]">
                                            <div className="text-[11px] text-[#7d8590] uppercase tracking-wider mb-1">Status</div>
                                            <div className="text-xl font-bold" style={{ color: getTheme(selectedEmail.type).color }}>{selectedEmail.type}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-[#0d1117] p-3 rounded border border-[#30363d]">
                                                <div className="text-[11px] text-[#7d8590] uppercase tracking-wider mb-1">Risk Score</div>
                                                <div className="text-lg font-bold text-[#e6edf3]">{selectedEmail.riskScore}/100</div>
                                            </div>
                                            <div className="bg-[#0d1117] p-3 rounded border border-[#30363d]">
                                                <div className="text-[11px] text-[#7d8590] uppercase tracking-wider mb-1">Threat Type</div>
                                                <div className="text-sm font-bold text-[#e6edf3] mt-1">{selectedEmail.threatType}</div>
                                            </div>
                                        </div>
                                    </div>
                                </PanelWrapper>

                                <PanelWrapper
                                    id="confidence"
                                    title="AI Confidence Breakdown"
                                    icon={BarChart2}
                                    className="h-[220px]"
                                    tooltip={{
                                        title: "Confidence Analysis",
                                        usedFor: "Shows the raw probability output from the final Softmax layer of the XAI classification model.",
                                        interpret: "A high distance between Phishing/Benign indicates strong model certainty."
                                    }}
                                >
                                    <div className="flex justify-center items-center h-full">
                                        <div className="w-full flex flex-col gap-6 -mt-2">
                                            <div>
                                                <div className="flex justify-between text-xs font-semibold mb-2">
                                                    <span className="text-[#f85149]">Phishing Probability</span>
                                                    <span className="text-[#e6edf3]">{selectedEmail.type === 'Legitimate' ? 100 - selectedEmail.confidence : selectedEmail.confidence}%</span>
                                                </div>
                                                <div className="h-4 bg-[#30363d] rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${selectedEmail.type === 'Legitimate' ? 100 - selectedEmail.confidence : selectedEmail.confidence}%` }} className="h-full bg-[#f85149] rounded-full" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs font-semibold mb-2">
                                                    <span className="text-[#3fb950]">Benign Probability</span>
                                                    <span className="text-[#e6edf3]">{selectedEmail.type !== 'Legitimate' ? 100 - selectedEmail.confidence : selectedEmail.confidence}%</span>
                                                </div>
                                                <div className="h-4 bg-[#30363d] rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${selectedEmail.type !== 'Legitimate' ? 100 - selectedEmail.confidence : selectedEmail.confidence}%` }} className="h-full bg-[#3fb950] rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </PanelWrapper>
                            </div>

                            {/* Panel 2: Feature Importance (SHAP) & Headers */}
                            <div className="grid grid-cols-2 gap-5 shrink-0">
                                <PanelWrapper
                                    id="features"
                                    title="AI Decision Factors (SHAP)"
                                    icon={AlignLeft}
                                    className="h-[260px]"
                                    tooltip={{
                                        title: "Feature Importance",
                                        usedFor: "Identifies which specific data points drove the AI's classification.",
                                        interpret: "Higher percentage means the feature had a stronger weight in determining the final Risk Score."
                                    }}
                                >
                                    {renderFeatureImportance()}
                                </PanelWrapper>

                                <PanelWrapper
                                    id="headers"
                                    title="Email Authentication (Headers)"
                                    icon={Shield}
                                    className="h-[260px]"
                                >
                                    <div className="grid grid-cols-[1fr_1fr] gap-3 mb-3">
                                        {['spf', 'dkim', 'dmarc'].map(protocol => (
                                            <div key={protocol} className="bg-[#0d1117] px-4 py-2 rounded flex justify-between items-center border border-[#30363d]">
                                                <span className="text-[#7d8590] text-xs font-bold uppercase">{protocol}</span>
                                                <span className={`text-xs font-bold ${selectedEmail.headers[protocol] === 'Fail' ? 'text-[#f85149]' : 'text-[#3fb950]'}`}>
                                                    {selectedEmail.headers[protocol]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-[#0d1117] px-4 py-2 rounded flex justify-between items-center border border-[#30363d]">
                                            <span className="text-[#7d8590] text-xs font-bold uppercase">Sender IP</span>
                                            <span className="text-[#e6edf3] text-xs font-mono">{selectedEmail.headers.ip}</span>
                                        </div>
                                        <div className="bg-[#0d1117] px-4 py-2 rounded flex justify-between items-center border border-[#30363d]">
                                            <span className="text-[#7d8590] text-xs font-bold uppercase">Geo-Location</span>
                                            <span className="text-[#e6edf3] text-xs font-mono">{selectedEmail.headers.geo}</span>
                                        </div>
                                    </div>
                                </PanelWrapper>
                            </div>

                            {/* Panel 3: Timeline & Attack Pattern */}
                            <div className="grid grid-cols-2 gap-5 shrink-0">
                                <PanelWrapper
                                    id="timeline"
                                    title="Analysis Timeline"
                                    icon={Activity}
                                    className="h-[320px]"
                                >
                                    {renderTimeline()}
                                </PanelWrapper>

                                <div className="flex flex-col gap-5 h-[320px]">
                                    <PanelWrapper
                                        id="attack"
                                        title="Attack Pattern Detection"
                                        icon={Crosshair}
                                        className="h-1/2"
                                    >
                                        <div className="grid grid-cols-2 gap-4 h-full items-center">
                                            <div>
                                                <div className="text-[#7d8590] text-[10px] uppercase font-bold mb-1">MITRE ATT&CK ID</div>
                                                <div className="text-[#58a6ff] font-mono text-sm bg-[#58a6ff10] px-3 py-1 rounded inline-block border border-[#58a6ff30]">
                                                    {selectedEmail.attackPattern.mitreId}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[#7d8590] text-[10px] uppercase font-bold mb-1">Category</div>
                                                <div className="text-[#e6edf3] text-sm">{selectedEmail.attackPattern.category}</div>
                                            </div>
                                            <div className="col-span-2 mt-[-5px]">
                                                <div className="text-[#7d8590] text-[10px] uppercase font-bold mb-1">Technique</div>
                                                <div className="text-[#e6edf3] text-sm font-bold">{selectedEmail.attackPattern.technique}</div>
                                            </div>
                                        </div>
                                    </PanelWrapper>

                                    <PanelWrapper
                                        id="actions"
                                        title="Recommended Actions"
                                        icon={ShieldAlert}
                                        className="h-1/2"
                                    >
                                        <ul className="list-disc pl-5 m-0 text-sm text-[#e6edf3] space-y-2">
                                            {selectedEmail.recommendedActions.map((action, i) => (
                                                <li key={i}>{action}</li>
                                            ))}
                                        </ul>
                                    </PanelWrapper>
                                </div>
                            </div>

                            {/* Panel 4: Explanation Method (Footer) */}
                            <div className="shrink-0 bg-[#0d1117] border border-[#30363d] rounded-lg p-4 flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2 text-[#7d8590]">
                                    <Cpu size={16} />
                                    <span className="text-xs uppercase font-bold tracking-widest">XAI Engine Specifications</span>
                                </div>
                                <div className="flex gap-8 text-[#e6edf3] text-xs">
                                    <div><span className="text-[#7d8590]">Deployed Model:</span> {selectedEmail.xaiMethod.model}</div>
                                    <div><span className="text-[#7d8590]">Attribution Method:</span> {selectedEmail.xaiMethod.method}</div>
                                </div>
                            </div>

                            <div className="h-8 shrink-0"></div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[#30363d]">
                            <Brain size={64} strokeWidth={1} className="mb-4" />
                            <h3 className="text-[#e6edf3] text-base font-semibold mb-2 m-0">No Email Selected</h3>
                            <p className="text-[#7d8590] text-sm m-0">Select an email to generate the comprehensive XAI explanation dashboard.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default XAIAnalysis;
