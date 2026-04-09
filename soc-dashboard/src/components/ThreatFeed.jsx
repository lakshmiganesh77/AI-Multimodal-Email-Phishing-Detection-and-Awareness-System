import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronUp, AlertCircle, CheckCircle, AlertTriangle, Globe, Shield, RefreshCw, ExternalLink } from 'lucide-react';

const ThreatFeed = () => {
    const [activeFilter, setActiveFilter] = useState('All');
    const [expandedId, setExpandedId] = useState(1); // Default expand first one for demo

    // Mock data matching the screenshot
    const threats = [
        {
            id: 1,
            type: 'Phishing',
            subtype: 'Clone Phishing',
            subject: 'Security Alert: Unusual login detected',
            sender: 'admin@google-verify.com',
            timestamp: 'about 1 hour ago',
            confidence: 94,
            riskScore: 98,
            status: 'Blocked',
            details: {
                aiAnalysis: [
                    'Sender domain registered 3 days ago',
                    'URL redirects to known phishing infrastructure'
                ],
                urlAnalysis: {
                    virusTotal: '12/70 engines flagged',
                    domainAge: '2 days'
                },
                threatIntel: [
                    'APT-29 infrastructure match',
                    'Known C2 domain'
                ]
            }
        },
        {
            id: 2,
            type: 'Suspicious',
            subtype: 'Spear Phishing',
            subject: 'CEO Request: Wire transfer needed today',
            sender: 'hr@internal-updates.org',
            timestamp: 'about 6 hours ago',
            confidence: 72,
            riskScore: 62,
            status: 'Quarantined',
            details: {
                aiAnalysis: [
                    'Urgency detected in email body',
                    'Sender name matches executive but email is external'
                ],
                urlAnalysis: {
                    virusTotal: '0/70 engines flagged',
                    domainAge: '5 years'
                },
                threatIntel: []
            }
        },
        {
            id: 3,
            type: 'Legitimate',
            subtype: 'Invoice Fraud', // Maybe mislabeled in mock or just showing example
            subject: 'Password reset required - Action needed',
            sender: 'support@slack.com',
            timestamp: 'about 3 hours ago',
            confidence: 89,
            riskScore: 8,
            status: 'Delivered',
            details: {
                aiAnalysis: [
                    'DKIM and SPF checks passed',
                    'Sender domain is highly reputable'
                ],
                attachmentAnalysis: 'No malicious macros detected'
            }
        },
        {
            id: 4,
            type: 'Phishing',
            subtype: 'Credential Theft',
            subject: 'URGENT: Your account has been compromised',
            sender: 'support@amaz0n-orders.net',
            timestamp: 'about 12 hours ago',
            confidence: 86,
            riskScore: 92,
            status: 'Blocked',
            details: {
                aiAnalysis: [
                    'Typosquatting detected in sender domain',
                    'Credential harvesting form detected'
                ],
                urlAnalysis: {
                    virusTotal: '8/70 engines flagged',
                    domainAge: '1 week'
                },
                threatIntel: ['PhishTank match']
            }
        }
    ];

    const getTheme = (type) => {
        switch (type) {
            case 'Phishing': return { color: '#f85149', icon: AlertCircle, bg: 'rgba(248, 81, 73, 0.1)', border: '#f85149' };
            case 'Suspicious': return { color: '#d29922', icon: AlertTriangle, bg: 'rgba(210, 153, 34, 0.1)', border: '#d29922' };
            case 'Legitimate': return { color: '#3fb950', icon: CheckCircle, bg: 'rgba(63, 185, 80, 0.1)', border: '#3fb950' };
            default: return { color: '#7d8590', icon: AlertCircle, bg: 'rgba(125, 133, 144, 0.1)', border: '#7d8590' };
        }
    };

    const filters = [
        { label: 'All', count: threats.length, icon: Shield },
        { label: 'Phishing', count: threats.filter(t => t.type === 'Phishing').length, icon: AlertCircle },
        { label: 'Suspicious', count: threats.filter(t => t.type === 'Suspicious').length, icon: AlertTriangle },
        { label: 'Legitimate', count: threats.filter(t => t.type === 'Legitimate').length, icon: CheckCircle },
    ];

    return (
        <div className="mt-0">

            {/* Controls */}
            <div className="mb-6">
                <div className="flex gap-3 mb-5">
                    <div className="flex-1 relative">
                        <Search size={16} color="#7d8590" className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by subject or sender..."
                            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md py-2.5 pr-2.5 pl-9 text-[#e6edf3] outline-none text-[13px]"
                        />
                    </div>
                    <button className="bg-[#0d1117] border border-[#30363d] rounded-md w-10 flex items-center justify-center text-[#7d8590] cursor-pointer hover:bg-[#161b22] transition-colors">
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="flex gap-3 flex-wrap">
                    {filters.map(filter => {
                        const active = activeFilter === filter.label;
                        const colors = filter.label === 'Phishing' ? '#f85149' : filter.label === 'Suspicious' ? '#d29922' : filter.label === 'Legitimate' ? '#3fb950' : '#58a6ff';
                        const Icon = filter.icon;

                        return (
                            <button
                                key={filter.label}
                                onClick={() => setActiveFilter(filter.label)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-all duration-200 ${active ? 'text-[#e6edf3]' : 'bg-transparent border border-[#30363d] text-[#7d8590] hover:bg-[#161b22]'
                                    }`}
                                style={active ? {
                                    backgroundColor: filter.label === 'Phishing' ? 'rgba(248, 81, 73, 0.1)' : filter.label === 'Suspicious' ? 'rgba(210, 153, 34, 0.1)' : filter.label === 'Legitimate' ? 'rgba(63, 185, 80, 0.1)' : 'rgba(88, 166, 255, 0.1)',
                                    border: `1px solid ${colors}`
                                } : {}}
                            >
                                <Icon size={14} color={active ? colors : '#7d8590'} />
                                {filter.label}
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{
                                    backgroundColor: active ? colors + '20' : '#21262d',
                                    color: active ? colors : '#7d8590'
                                }}>{filter.count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-4">
                <AnimatePresence>
                    {threats.filter(t => activeFilter === 'All' || t.type === activeFilter).map(threat => {
                        const theme = getTheme(threat.type);
                        const isExpanded = expandedId === threat.id;
                        const Icon = theme.icon;

                        return (
                            <motion.div
                                key={threat.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-[#161b22] rounded-lg overflow-hidden relative"
                                style={{
                                    border: '1px solid #30363d',
                                    borderLeft: `3px solid ${theme.border}`,
                                    boxShadow: threat.type === 'Phishing' && isExpanded ? '0 0 20px rgba(248, 81, 73, 0.1)' : 'none'
                                }}
                            >
                                {/* Card Header */}
                                <div
                                    onClick={() => setExpandedId(isExpanded ? null : threat.id)}
                                    className="p-5 cursor-pointer flex items-start gap-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                                >
                                    {/* Icon */}
                                    <div className="mt-1 w-8 h-8 rounded-full bg-transparent flex items-center justify-center shrink-0"
                                        style={{ border: `1px solid ${theme.color}40` }}>
                                        <Icon size={16} color={theme.color} />
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-1">
                                        <div className="flex gap-2 mb-1.5 items-center">
                                            <span className="font-bold text-[11px] uppercase tracking-[0.5px] px-2 py-0.5 rounded"
                                                style={{ color: theme.color, backgroundColor: theme.color + '15' }}>
                                                {threat.type}
                                            </span>
                                            <span className="text-[#7d8590] text-[11px] bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d]">
                                                {threat.subtype}
                                            </span>
                                        </div>
                                        <h3 className="text-[#e6edf3] text-[15px] font-semibold mb-1 m-0">
                                            {threat.subject}
                                        </h3>
                                        <p className="text-[#7d8590] text-[13px] m-0">
                                            From: <span className="text-[#e6edf3]">{threat.sender}</span>
                                        </p>
                                    </div>

                                    {/* Right Side */}
                                    <div className="text-right shrink-0">
                                        <div className="flex items-center gap-2 justify-end mb-2">
                                            <div className="text-right">
                                                <div className="text-base font-bold text-[#e6edf3]">
                                                    {threat.confidence}%
                                                </div>
                                                <div className="text-[10px] text-[#7d8590] uppercase leading-none">
                                                    Confidence
                                                </div>
                                            </div>
                                            <div className="relative w-8 h-8">
                                                <svg width="32" height="32" viewBox="0 0 32 32">
                                                    <circle cx="16" cy="16" r="14" fill="none" stroke="#30363d" strokeWidth="3" />
                                                    <circle
                                                        cx="16" cy="16" r="14"
                                                        fill="none"
                                                        stroke={theme.color}
                                                        strokeWidth="3"
                                                        strokeDasharray={`${2 * Math.PI * 14}`}
                                                        strokeDashoffset={`${2 * Math.PI * 14 * (1 - threat.confidence / 100)}`}
                                                        transform="rotate(-90 16 16)"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-xs text-[#7d8590]">
                                            {threat.timestamp}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-[#30363d] bg-[#0d1117] overflow-hidden"
                                    >
                                        <div className="p-5 grid grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-[#e6edf3] text-[13px] mb-3 flex items-center gap-2 m-0">
                                                    <Shield size={14} color="var(--cyan)" />
                                                    AI Analysis
                                                </h4>
                                                <ul className="m-0 pl-5 text-[#7d8590] text-[13px] leading-[1.6]">
                                                    {threat.details.aiAnalysis?.map((item, i) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-[#e6edf3] text-[13px] mb-3 flex items-center gap-2 m-0">
                                                    <Globe size={14} color="var(--cyan)" />
                                                    Threat Intelligence
                                                </h4>
                                                <div className="flex gap-2 flex-wrap">
                                                    {threat.details.threatIntel?.map((tag, i) => (
                                                        <span key={i} className="text-[11px] text-[var(--cyan)] bg-[rgba(0,243,255,0.1)] border border-[rgba(0,243,255,0.2)] px-2 py-1 rounded">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="py-4 px-5 bg-[#161b22] border-t border-[#30363d] flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[#7d8590] text-xs">Risk Score:</span>
                                                <div className="w-[150px] h-1.5 bg-[#30363d] rounded-[3px] overflow-hidden">
                                                    <div className="h-full" style={{ width: `${threat.riskScore}%`, backgroundColor: theme.color }} />
                                                </div>
                                                <span className="font-bold text-[13px]" style={{ color: theme.color }}>{threat.riskScore}/100</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="px-3 py-1.5 rounded-md border border-[#30363d] bg-transparent text-[#e6edf3] text-xs cursor-pointer hover:bg-[#21262d] transition-colors">
                                                    View Headers
                                                </button>
                                                <button className="px-3 py-1.5 rounded-md border-none text-black text-xs font-semibold cursor-pointer" style={{ backgroundColor: theme.color }}>
                                                    {threat.status}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ThreatFeed;
