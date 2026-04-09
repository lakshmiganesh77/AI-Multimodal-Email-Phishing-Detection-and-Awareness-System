import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Mail, Link, Paperclip, AlertTriangle, CheckCircle,
    XCircle, Clock, User, FileText, Send, Activity, Database,
    Globe, Lock, Zap, TrendingUp, Eye, ChevronDown, ChevronRight, Info, Download, BookOpen,
    Target, Play, GitBranch
} from 'lucide-react';
import EmailAnalyzer from './EmailAnalyzer';
import KillChainPanel from './KillChainPanel';
import AttackStoryTimeline from './AttackStoryTimeline';
import PlaybookEngine from './PlaybookEngine';
import PostIncidentReview from './PostIncidentReview';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const IncidentDrillDown = ({ alert, onCorrelate }) => {
    useEffect(() => {
        if (alert?.rawId) {
            localStorage.setItem('selectedAlertId', alert.rawId);
        }
        return () => localStorage.removeItem('selectedAlertId');
    }, [alert?.rawId]);

    const [activeTab, setActiveTab] = useState('evidence');
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [timeline, setTimeline] = useState([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [auditTrail, setAuditTrail] = useState([]);
    const [showResolutionModal, setShowResolutionModal] = useState(false);
    const [resolutionReason, setResolutionReason] = useState('');
    const [pendingStatus, setPendingStatus] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    // Action Menus State
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showSeverityMenu, setShowSeverityMenu] = useState(false);

    // Case Management Actions
    const handleAssign = async () => {
        try {
            await axios.put(`${API_BASE}/soc/alerts/${alert.rawId}/assign`, { analyst: 'admin' });
            alert.assignee = 'admin'; // local optimistic update
            console.log("Assigned to admin");
        } catch (e) { console.error(e); }
    };

    const handleStatusUpdate = async (newStatus, reason) => {
        try {
            await axios.put(`${API_BASE}/soc/alerts/${alert.rawId}/status`, { status: newStatus, resolution_reason: reason });
            alert.status = newStatus;
            setShowStatusMenu(false);
            console.log(`Status updated to ${newStatus}`);
        } catch (e) { console.error(e); }
    };

    const handleSeverityUpdate = async (newSev) => {
        try {
            await axios.put(`${API_BASE}/soc/alerts/${alert.rawId}/severity`, { severity: newSev });
            alert.severity = newSev;
            setShowSeverityMenu(false);
            console.log(`Severity updated to ${newSev}`);
        } catch (e) { console.error(e); }
    };

    // SLA Timer Logic
    const [slaText, setSlaText] = useState('No SLA');
    const [slaColor, setSlaColor] = useState('var(--text-secondary)');
    const [slaPulsing, setSlaPulsing] = useState(false);

    useEffect(() => {
        if (!alert.sla_deadline) return;

        const updateSla = () => {
            const now = new Date();
            const deadline = new Date(alert.sla_deadline);
            const diffMs = deadline - now;

            if (diffMs <= 0) {
                setSlaText('SLA Breached');
                setSlaColor('var(--red)');
                setSlaPulsing(true);
            } else {
                const mins = Math.floor(diffMs / 60000);
                const hrs = Math.floor(mins / 60);
                const remMins = mins % 60;

                if (hrs > 0) {
                    setSlaText(`${hrs}h ${remMins}m remaining`);
                    setSlaColor(hrs > 2 ? 'var(--green)' : 'var(--orange)');
                    setSlaPulsing(false);
                } else {
                    setSlaText(`${mins}m remaining`);
                    setSlaColor('var(--red)');
                    setSlaPulsing(mins < 15);
                }
            }
        };

        updateSla();
        const interval = setInterval(updateSla, 60000); // update every minute
        return () => clearInterval(interval);
    }, [alert.sla_deadline]);

    const parseSender = (senderStr) => {
        // e.g. "Amazon Support <amazon-support@gmail.com>"
        const match = senderStr?.match(/<(.+)>/);
        return match ? match[1] : senderStr;
    };

    const extractDomain = (email) => {
        return email?.split('@')[1] || 'unknown';
    };

    const senderEmail = parseSender(alert.user);
    const senderDomain = extractDomain(senderEmail);

    // -- SPF / DKIM / DMARC mock (derived from label) --
    const isPhishing = alert.type === 'PHISHING';
    const spf = isPhishing ? 'FAIL' : 'PASS';
    const dkim = isPhishing ? 'FAIL' : 'PASS';
    const dmarc = isPhishing ? 'FAIL' : 'PASS';

    const headerCheck = (result) => {
        const ok = result === 'PASS';
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${ok ? 'bg-[rgba(0,255,136,0.1)] text-[var(--green)] border-[rgba(0,255,136,0.3)]' : 'bg-[rgba(255,51,51,0.1)] text-[var(--red)] border-[rgba(255,51,51,0.3)]'}`}>
                {ok ? <CheckCircle size={12} /> : <XCircle size={12} />} {result}
            </span>
        );
    };

    // -- Simulated extracted URLs from subject --
    const extractedUrls = isPhishing ? [
        { url: `verify.${senderDomain}/secure-login`, verdict: 'Malicious', age: '2 days', vt: '34/72' },
        { url: `${senderDomain}/account/confirm`, verdict: 'Suspicious', age: '7 days', vt: '3/72' }
    ] : [];

    const fetchTimeline = () => {
        setLoadingTimeline(true);
        axios.get(`${API_BASE}/soc/alerts/${alert.rawId}/timeline`)
            .then(res => { setTimeline(res.data); setLoadingTimeline(false); })
            .catch(() => setLoadingTimeline(false));
    };

    const fetchNotes = useCallback(() => {
        axios.get(`${API_BASE}/soc/alerts/${alert.rawId}/notes`)
            .then(res => setNotes(res.data))
            .catch(() => { });
    }, [alert.rawId]);

    const fetchAudit = useCallback(() => {
        axios.get(`${API_BASE}/soc/alerts/${alert.rawId}/audit`)
            .then(res => setAuditTrail(res.data))
            .catch(() => { });
    }, [alert.rawId]);

    useEffect(() => {
        if (activeTab === 'timeline') fetchTimeline();
        if (activeTab === 'notes') fetchNotes();
        if (activeTab === 'audit') fetchAudit();
    }, [activeTab]);

    const submitNote = async () => {
        if (!newNote.trim()) return;
        await axios.post(`${API_BASE}/soc/alerts/${alert.rawId}/notes`, { note: newNote });
        setNotes(prev => [...prev, { analyst: 'admin', note: newNote, timestamp: new Date().toISOString() }]);
        setNewNote('');
    };

    const initiateClose = (status) => {
        setPendingStatus(status);
        setShowResolutionModal(true);
    };

    const confirmClose = async () => {
        if (!resolutionReason.trim()) return;
        try {
            await axios.put(`${API_BASE}/soc/alerts/${alert.rawId}/status`,
                { status: pendingStatus, resolution_reason: resolutionReason });
            setShowResolutionModal(false);
            setResolutionReason('');
        } catch (e) { console.error(e); }
    };

    const exportReport = async () => {
        setIsExporting(true);
        try {
            const res = await axios.get(`${API_BASE}/soc/alerts/${alert.rawId}/export`);
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `incident-${alert.id}-report.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) { console.error(e); }
        finally { setIsExporting(false); }
    };

    const tabs = [
        { id: 'evidence', label: 'Evidence', icon: Shield },
        { id: 'killchain', label: 'Kill Chain', icon: Target },
        { id: 'attackstory', label: 'Attack Story', icon: GitBranch },
        { id: 'timeline', label: 'Timeline', icon: Activity },
        { id: 'analysis', label: 'Deep Analysis', icon: Zap },
        { id: 'playbook', label: 'Playbook', icon: Play },
        { id: 'notes', label: 'Notes', icon: FileText },
        { id: 'audit', label: 'Audit Trail', icon: BookOpen },
        { id: 'pir', label: 'Post-Incident', icon: BookOpen },
    ];

    const verdictColor = (v) => v === 'Malicious' ? 'var(--red)' : v === 'Suspicious' ? 'var(--yellow)' : 'var(--green)';

    return (
        <div className="flex flex-col gap-0 h-full">

            {/* Tab Bar & Action Bar */}
            <div className="flex justify-between items-center border-b border-white/5 mb-4 flex-wrap gap-2 px-1">
                <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                    {tabs.map(t => {
                        const Icon = t.icon;
                        const active = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[10px] font-black uppercase tracking-wide transition-all duration-300 relative group shrink-0
                                    ${active
                                        ? 'bg-white/5 text-cyan-neon border-x border-t border-white/10'
                                        : 'text-white/30 hover:text-white/60 hover:bg-white/2'}`}
                            >
                                <Icon size={12} className={active ? 'text-cyan-neon' : 'text-white/20'} />
                                {t.label}
                                {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-neon glow-cyan" />}
                            </button>
                        );
                    })}
                </div>

                {/* Case Management Actions */}
                <div className="flex items-center gap-2 pb-2 relative">
                    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                        <button
                            onClick={handleAssign}
                            className="px-3 py-1.5 bg-transparent hover:bg-white/5 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5"
                        >
                            <User size={12} className="text-cyan-neon/40" /> Assign
                        </button>

                        <div className="w-px h-3 bg-white/10 mx-0.5" />

                        <div className="relative">
                            <button
                                onClick={() => setShowSeverityMenu(!showSeverityMenu)}
                                className="px-3 py-1.5 bg-transparent hover:bg-white/5 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5"
                            >
                                <TrendingUp size={12} className="text-yellow-neon/40" /> Escalate
                            </button>
                            {showSeverityMenu && (
                                <div className="absolute top-full left-0 glass-card border border-white/10 rounded-2xl p-2 z-50 min-w-[140px] mt-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                    {['Critical', 'High', 'Medium', 'Low'].map(s => (
                                        <button key={s} onClick={() => handleSeverityUpdate(s)} className="w-full px-4 py-2.5 text-left bg-transparent hover:bg-white/5 border-none rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all">{s}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="w-px h-3 bg-white/10 mx-0.5" />

                        <div className="relative">
                            <button
                                onClick={() => setShowStatusMenu(!showStatusMenu)}
                                className="px-4 py-1.5 bg-cyan-neon text-bg-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-lg glow-cyan hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
                            >
                                <CheckCircle size={12} /> Resolve
                            </button>
                            {showStatusMenu && (
                                <div className="absolute top-full right-0 glass-card border border-white/10 rounded-2xl p-2 z-50 min-w-[200px] mt-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                    <button onClick={() => { initiateClose('Closed'); setShowStatusMenu(false); }} className="w-full px-4 py-3 text-left bg-transparent hover:bg-red-neon/10 border-none rounded-xl text-red-neon text-[10px] font-black uppercase tracking-widest transition-all">Report True Positive</button>
                                    <button onClick={() => { initiateClose('False Positive'); setShowStatusMenu(false); }} className="w-full px-4 py-3 text-left bg-transparent hover:bg-green-neon/10 border-none rounded-xl text-green-neon text-[10px] font-black uppercase tracking-widest transition-all">Report False Positive</button>
                                    <div className="h-px bg-white/5 my-1" />
                                    <button onClick={() => { handleStatusUpdate('In Progress', ''); setShowStatusMenu(false); }} className="w-full px-4 py-3 text-left bg-transparent hover:bg-blue-neon/10 border-none rounded-xl text-blue-neon text-[10px] font-black uppercase tracking-widest transition-all">Update State</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={exportReport}
                        disabled={isExporting}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 rounded-2xl border border-white/5 transition-all"
                    >
                        <Download size={16} />
                    </button>
                </div>
            </div>

            {/* Resolution Reason Modal */}
            {showResolutionModal && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] z-[1000] flex items-center justify-center">
                    <div className="bg-[#0d1117] border border-[rgba(0,243,255,0.3)] rounded-xl p-7 w-[480px] shadow-[0_0_40px_rgba(0,243,255,0.15)]">
                        <h3 className="text-[var(--text-primary)] text-base mb-2">Close Incident — Resolution Required</h3>
                        <p className="text-[var(--text-secondary)] text-[13px] mb-5">Classify the outcome and explain the resolution before closing.</p>
                        <div className="flex gap-2.5 mb-4">
                            {['True Positive', 'False Positive', 'Escalated to Tier 2', 'Duplicate'].map(r => (
                                <button key={r} onClick={() => setResolutionReason(r)} className={`px-3 py-1.5 rounded border border-[rgba(255,255,255,0.15)] text-[11px] font-semibold cursor-pointer ${resolutionReason === r ? 'bg-[var(--cyan)] text-[#000]' : 'bg-transparent text-[var(--text-secondary)]'}`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={resolutionReason}
                            onChange={e => setResolutionReason(e.target.value)}
                            placeholder="Additional analyst notes for the resolution (e.g., 'Sender IP traced to known malicious actor, blocked at perimeter firewall...')"
                            rows={4}
                            className="w-full p-3 bg-[rgba(0,0,0,0.4)] border border-[rgba(0,243,255,0.2)] rounded-md text-[var(--text-primary)] text-[13px] outline-none resize-none font-inherit box-border"
                        />
                        <div className="flex gap-3 justify-end mt-4">
                            <button onClick={() => setShowResolutionModal(false)} className="px-5 py-2 bg-transparent border border-[rgba(255,255,255,0.2)] rounded-md text-[var(--text-secondary)] cursor-pointer text-[13px]">Cancel</button>
                            <button onClick={confirmClose} disabled={!resolutionReason.trim()} className="px-5 py-2 bg-[var(--cyan)] border-none rounded-md text-[#000] font-bold cursor-pointer text-[13px] disabled:opacity-50 disabled:cursor-not-allowed">Confirm Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-y-auto flex-1">
                <AnimatePresence mode="wait">
                    {activeTab === 'evidence' && (
                        <motion.div key="evidence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                            {/* Risk Summary Bar - Enhanced Glass Card */}
                            <div className="glass-card p-4 mb-4 rounded-2xl border border-white/5 flex gap-8 items-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-neon/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="text-center relative">
                                    <div className="text-3xl font-black font-mono leading-none tracking-tighter italic"
                                        style={{ color: alert.score > 80 ? 'var(--color-red-neon)' : 'var(--color-orange-neon)' }}>
                                        {alert.score}
                                    </div>
                                    <div className="text-[9px] text-white/30 font-bold uppercase tracking-[0.3em] mt-2">Risk Index</div>
                                </div>

                                <div className="h-12 w-px bg-white/5" />

                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="flex justify-between items-end">
                                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Prediction Confidence</div>
                                        {alert.sla_deadline && (
                                            <div className={`flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] font-black tracking-widest ${slaPulsing ? 'animate-pulse' : ''}`} style={{ color: slaColor }}>
                                                <Clock size={12} /> {slaText}
                                            </div>
                                        )}
                                    </div>

                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${alert.score}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full rounded-full glow-cyan"
                                            style={{ backgroundColor: alert.score > 80 ? 'var(--color-red-neon)' : 'var(--color-cyan-neon)' }}
                                        />
                                    </div>

                                    <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-white/30">
                                        <span>Type: <strong className="text-white/60 ml-1">{alert.type}</strong></span>
                                        <span>Cluster: <strong className="text-white/60 ml-1">#42-Alpha</strong></span>
                                        <span>Status: <strong className="text-cyan-neon ml-1">{alert.status}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                {/* Email Header Analysis */}
                                <div className="card p-5">
                                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 uppercase tracking-[0.05em]">
                                        <Mail size={16} className="text-[var(--cyan)]" /> Email Header Analysis
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] text-[var(--text-secondary)]">From</span>
                                            <span className="text-[13px] text-[var(--text-primary)] font-mono max-w-[220px] truncate">{senderEmail}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] text-[var(--text-secondary)]">Domain</span>
                                            <span className="text-[13px] text-[var(--yellow)] font-mono">{senderDomain}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] text-[var(--text-secondary)]">Subject</span>
                                            <span className="text-xs text-[var(--text-primary)] max-w-[220px] truncate">{alert.title}</span>
                                        </div>
                                        <div className="h-px bg-[rgba(255,255,255,0.05)]" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] text-[var(--text-secondary)]">SPF</span>
                                            {headerCheck(spf)}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] text-[var(--text-secondary)]">DKIM</span>
                                            {headerCheck(dkim)}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] text-[var(--text-secondary)]">DMARC</span>
                                            {headerCheck(dmarc)}
                                        </div>
                                    </div>
                                </div>

                                {/* Threat Intelligence */}
                                <div className="card p-5">
                                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 uppercase tracking-[0.05em]">
                                        <Globe size={16} className="text-[var(--red)]" /> Threat Intelligence
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] text-[var(--text-secondary)]">Domain Age</span>
                                            <span className={`text-[13px] font-semibold ${isPhishing ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>{isPhishing ? '3 days' : '>2 years'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] text-[var(--text-secondary)]">VirusTotal</span>
                                            <span className={`text-[13px] font-semibold ${isPhishing ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>{isPhishing ? '34/72 engines' : '0/72 engines'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] text-[var(--text-secondary)]">PhishTank</span>
                                            <span className={`text-[13px] font-semibold ${isPhishing ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>{isPhishing ? 'Confirmed Phishing' : 'Not Listed'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] text-[var(--text-secondary)]">NLP Urgency</span>
                                            <span className={`text-[13px] font-bold font-mono ${isPhishing ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>{isPhishing ? '0.87' : '0.12'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] text-[var(--text-secondary)]">Financial Pressure</span>
                                            <span className={`text-[13px] font-bold font-mono ${isPhishing ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>{isPhishing ? '0.91' : '0.03'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Extracted URLs */}
                            <div className="card p-5 mt-5">
                                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 uppercase tracking-[0.05em]">
                                    <Link size={16} className="text-[var(--yellow)]" /> Extracted URLs / IOCs
                                </h3>
                                {extractedUrls.length === 0 ? (
                                    <div className="text-[13px] text-[var(--text-secondary)] flex items-center gap-2">
                                        <CheckCircle size={16} className="text-[var(--green)]" /> No malicious URLs detected.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2.5">
                                        {extractedUrls.map((u, i) => (
                                            <div key={i} className="grid grid-cols-[1fr_130px_120px_100px] gap-4 items-center p-3 bg-[rgba(255,51,51,0.05)] rounded-lg border border-[rgba(255,51,51,0.15)]">
                                                <span className="font-mono text-[13px] text-[var(--red)] truncate">{u.url}</span>
                                                <span className="text-xs text-[var(--text-secondary)]">Domain Age: <strong className="text-[var(--red)]">{u.age}</strong></span>
                                                <span className="text-xs text-[var(--text-secondary)]">VT: <strong className="text-[var(--red)]">{u.vt}</strong></span>
                                                <span className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[rgba(255,51,51,0.1)] border border-[rgba(255,51,51,0.3)]" style={{ color: verdictColor(u.verdict) }}>
                                                        <AlertTriangle size={11} />{u.verdict}
                                                    </span>
                                                    <button onClick={() => { if (onCorrelate) onCorrelate(u.url); }} className="bg-transparent border-none text-[10px] text-[var(--cyan)] no-underline flex items-center justify-center gap-1 opacity-80 cursor-pointer py-1">
                                                        <Database size={10} /> Correlate
                                                    </button>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* AI Feature Breakdown */}
                            <div className="card p-5 mt-5">
                                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 uppercase tracking-[0.05em]">
                                    <Zap size={16} className="text-[var(--cyan)]" /> AI Feature Explanation
                                </h3>
                                <div className="flex flex-col gap-2.5">
                                    {[
                                        { label: 'Urgency Keywords', score: isPhishing ? 87 : 8, color: 'var(--red)' },
                                        { label: 'Credential Harvesting Pattern', score: isPhishing ? 92 : 5, color: 'var(--red)' },
                                        { label: 'Suspicious Sender Domain', score: isPhishing ? 95 : 3, color: 'var(--red)' },
                                        { label: 'Lookalike Brand Name', score: isPhishing ? 80 : 10, color: 'var(--orange)' },
                                        { label: 'URL Mismatch Detected', score: isPhishing ? 78 : 4, color: 'var(--orange)' }
                                    ].map((f, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-[13px] text-[var(--text-secondary)]">{f.label}</span>
                                                <span className="text-[13px] font-bold font-mono" style={{ color: f.color }}>{f.score}%</span>
                                            </div>
                                            <div className="h-[5px] bg-[rgba(255,255,255,0.05)] rounded-[3px] overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${f.score}%` }} transition={{ delay: i * 0.08, duration: 0.5 }}
                                                    className="h-full rounded-[3px]"
                                                    style={{ backgroundColor: f.color, boxShadow: `0 0 8px ${f.color}` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'timeline' && (
                        <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {loadingTimeline ? (
                                <div className="text-center p-[60px] text-[var(--text-secondary)]">Loading timeline...</div>
                            ) : (
                                <div className="relative pl-8">
                                    {/* Vertical line */}
                                    <div className="absolute left-3 top-4 bottom-4 w-[2px] bg-[rgba(0,243,255,0.15)]" />

                                    {timeline.length === 0 && (
                                        <div className="card p-6 text-[var(--text-secondary)] text-sm">
                                            No timeline events yet. Take an action to create entries.
                                        </div>
                                    )}

                                    {timeline.map((ev, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                                            className="flex gap-4 mb-5 relative">
                                            {/* Dot */}
                                            <div className="absolute -left-[27px] top-3 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-primary)]"
                                                style={{
                                                    backgroundColor: ev.type === 'created' ? 'var(--cyan)' : ev.type === 'note' ? 'var(--yellow)' : 'var(--green)',
                                                    boxShadow: `0 0 10px ${ev.type === 'created' ? 'var(--cyan)' : ev.type === 'note' ? 'var(--yellow)' : 'var(--green)'}`
                                                }} />

                                            <div className="card flex-1 px-[18px] py-3.5">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">{ev.action}</span>
                                                    <span className="text-[11px] text-[var(--text-secondary)] font-mono">{new Date(ev.timestamp).toLocaleString()}</span>
                                                </div>
                                                <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                                                    <User size={12} /> {ev.actor}
                                                    {ev.note && <span className="text-[var(--yellow)] ml-2">"{ev.note}"</span>}
                                                    {ev.reason && <span className="text-[var(--text-secondary)] ml-2">— {ev.reason}</span>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'killchain' && (
                        <motion.div key="killchain" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <KillChainPanel alert={alert} />
                        </motion.div>
                    )}

                    {activeTab === 'attackstory' && (
                        <motion.div key="attackstory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <AttackStoryTimeline alert={alert} />
                        </motion.div>
                    )}

                    {activeTab === 'analysis' && (
                        <motion.div key="analysis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <EmailAnalyzer isInvestigationView={true} contextData={alert} />
                        </motion.div>
                    )}

                    {activeTab === 'playbook' && (
                        <motion.div key="playbook" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <PlaybookEngine alert={alert} />
                        </motion.div>
                    )}

                    {activeTab === 'pir' && (
                        <motion.div key="pir" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <PostIncidentReview alert={alert} />
                        </motion.div>
                    )}

                    {activeTab === 'notes' && (
                        <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="flex flex-col gap-4">
                                {/* Add Note */}
                                <div className="card p-5">
                                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3.5 flex items-center gap-2 uppercase tracking-[0.05em]">
                                        <FileText size={16} className="text-[var(--cyan)]" /> Add Investigation Note
                                    </h3>
                                    <textarea
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                        placeholder="Analyst note: e.g. 'Sender domain is 3 days old, correlates with Campaign #7 targeting finance department...'"
                                        rows={4}
                                        className="w-full p-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(0,243,255,0.15)] rounded-lg text-[var(--text-primary)] text-[13px] resize-y font-inherit outline-none box-border"
                                    />
                                    <div className="flex justify-end mt-3">
                                        <button onClick={submitNote} className="flex items-center gap-2 px-6 py-2.5 bg-[var(--cyan)] border-none rounded-lg text-[#000] text-[13px] font-bold cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                                            <Send size={14} /> Submit Note
                                        </button>
                                    </div>
                                </div>

                                {/* Existing Notes */}
                                {notes.length > 0 && (
                                    <div className="flex flex-col gap-3">
                                        {notes.map((n, i) => (
                                            <div key={i} className="card py-4 px-5 border-l-4 border-l-[var(--yellow)]">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-[13px] font-semibold text-[var(--yellow)] flex items-center gap-1.5">
                                                        <User size={13} /> {n.analyst}
                                                    </span>
                                                    <span className="text-[11px] text-[var(--text-secondary)] font-mono">{new Date(n.timestamp).toLocaleString()}</span>
                                                </div>
                                                <p className="text-[13px] text-[var(--text-primary)] m-0 leading-[1.6]">{n.note}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {notes.length === 0 && (
                                    <div className="text-[var(--text-secondary)] text-[13px] text-center p-10">
                                        No investigation notes yet. Add the first note above.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'audit' && (
                        <motion.div key="audit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="flex flex-col gap-3">
                                <div className="card p-5">
                                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 uppercase tracking-[0.05em]">
                                        <BookOpen size={16} className="text-[var(--cyan)]" /> Audit Trail
                                    </h3>
                                    {auditTrail.length === 0 ? (
                                        <div className="text-[var(--text-secondary)] text-[13px] text-center p-10">
                                            No audit events yet. Take an action to see it recorded here.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2.5">
                                            {auditTrail.map((entry, i) => (
                                                <div key={i} className="flex gap-3 items-start p-3 bg-[rgba(0,0,0,0.2)] rounded-lg border-l-[3px] border-l-[var(--cyan)]">
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-[13px] font-semibold text-[var(--text-primary)]">{entry.action}</span>
                                                            <span className="text-[11px] text-[var(--text-secondary)] font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                                                        </div>
                                                        <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><User size={11} />{entry.actor}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default IncidentDrillDown;
