import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle, Clock, Zap, AlertTriangle, Lock, Mail, Search, ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';
import CustomTooltip from './CustomTooltip';

const PLAYBOOKS = {
    PHISHING: {
        name: 'Phishing Response Playbook',
        type: 'PB-001',
        description: 'Standard response for credential phishing targeting corporate accounts',
        severity: 'HIGH',
        estimatedTime: '25 min',
        steps: [
            { id: 1, title: 'Quarantine Malicious Email', detail: 'Remove email from all inboxes across organization. Block sender domain in email gateway.', icon: Mail, color: '#ff3333', automated: true },
            { id: 2, title: 'Reset Compromised Credentials', detail: 'Initiate forced password reset for all targeted accounts. Trigger MFA re-enrollment.', icon: Lock, color: '#ff6b6b', automated: false },
            { id: 3, title: 'Search Similar Patterns', detail: 'Sweep inbox logs for same sender pattern, subject line similarity, and URL structure across org.', icon: Search, color: '#ffd700', automated: true },
            { id: 4, title: 'Disable Mailbox Forwarding Rules', detail: 'Check and remove any auto-forwarding rules created after the alert timestamp in affected accounts.', icon: Mail, color: '#ffa94d', automated: false },
            { id: 5, title: 'Block C2 Infrastructure', detail: 'Add IOCs (domains, IPs, hashes) to firewall blocklist and DNS sinkhole.', icon: ShieldAlert, color: '#c084fc', automated: true },
            { id: 6, title: 'Notify Security Team & Management', detail: 'Send incident brief to CISO and affected department heads. Include risk assessment.', icon: AlertTriangle, color: '#00f3ff', automated: false },
        ]
    },
    BEC: {
        name: 'BEC Response Playbook',
        type: 'PB-003',
        description: 'Business Email Compromise targeting finance/executive wire fraud',
        severity: 'CRITICAL',
        estimatedTime: '40 min',
        steps: [
            { id: 1, title: 'Freeze Financial Transactions', detail: 'Contact finance team to hold all pending wire transfers pending investigation.', icon: Lock, color: '#ff3333', automated: false },
            { id: 2, title: 'Notify Finance Director & CFO', detail: 'Immediate escalation to finance leadership and legal. Preserve all communications.', icon: AlertTriangle, color: '#ff6b6b', automated: false },
            { id: 3, title: 'Reset Spoofed Account', detail: 'If internal account was compromised, force password change and audit sent emails.', icon: Mail, color: '#ffd700', automated: false },
            { id: 4, title: 'Search Reply Chain Spread', detail: 'Check if other employees received the same thread. Map the spread.', icon: Search, color: '#ffa94d', automated: true },
            { id: 5, title: 'Block Lookalike Domains', detail: 'Add all identified lookalike domains to DNS sinkhole and email gateway blocklist.', icon: ShieldAlert, color: '#00ff9d', automated: true },
        ]
    },
    MALWARE: {
        name: 'Malware Delivery Playbook',
        type: 'PB-002',
        description: 'Response for malicious attachment or drive-by download attempt',
        severity: 'CRITICAL',
        estimatedTime: '35 min',
        steps: [
            { id: 1, title: 'Isolate Affected Endpoint', detail: 'Network-segment or quarantine the endpoint that opened the document.', icon: ShieldAlert, color: '#ff3333', automated: true },
            { id: 2, title: 'Hash & Quarantine Attachment', detail: 'Extract and sandbox the attachment for dynamic analysis. Submit to VirusTotal.', icon: Search, color: '#ff6b6b', automated: true },
            { id: 3, title: 'Check for Lateral Movement', detail: 'Audit network logs for lateral movement attempts from affected endpoint IP.', icon: AlertTriangle, color: '#ffd700', automated: false },
            { id: 4, title: 'Reset Endpoint Credentials', detail: 'Force credential reset for all accounts that logged into the affected machine.', icon: Lock, color: '#ffa94d', automated: false },
            { id: 5, title: 'Block C2 Beaconing', detail: 'Add malware C2 domains and IPs to firewall. Monitor for continued beaconing.', icon: ShieldAlert, color: '#c084fc', automated: true },
        ]
    },
    SPAM: {
        name: 'Spam Handling Playbook',
        type: 'PB-005',
        description: 'Standard response for high-volume commercial spam or bulk email',
        severity: 'LOW',
        estimatedTime: '10 min',
        steps: [
            { id: 1, title: 'Add Sender to Blocklist', detail: 'Add sender domain and IP to email gateway blocklist. Prevent future delivery.', icon: Mail, color: '#ffd700', automated: true },
            { id: 2, title: 'Mark as Spam in Filter', detail: 'Update bayesian spam filter with message fingerprint for improved future detection.', icon: Search, color: '#00ff9d', automated: true },
            { id: 3, title: 'User Awareness Reminder', detail: 'Send gentle reminder to affected user about spam reporting best practices.', icon: AlertTriangle, color: '#00f3ff', automated: false },
        ]
    }
};

const PlaybookEngine = ({ alert }) => {
    const [stepStatus, setStepStatus] = useState({});
    const [isRunning, setIsRunning] = useState(false);
    const [expanded, setExpanded] = useState(null);

    if (!alert) return null;

    const playbook = PLAYBOOKS[alert.type] || PLAYBOOKS.SPAM;

    const runAutomated = async () => {
        setIsRunning(true);
        const automated = playbook.steps.filter(s => s.automated);
        for (let i = 0; i < automated.length; i++) {
            await new Promise(r => setTimeout(r, 800));
            setStepStatus(prev => ({ ...prev, [automated[i].id]: 'running' }));
            await new Promise(r => setTimeout(r, 1200));
            setStepStatus(prev => ({ ...prev, [automated[i].id]: 'done' }));
        }
        setIsRunning(false);
    };

    const toggleStep = (id) => {
        setStepStatus(prev => ({
            ...prev,
            [id]: prev[id] === 'done' ? 'pending' : 'done'
        }));
    };

    const completedCount = Object.values(stepStatus).filter(s => s === 'done').length;

    return (
        <div className="bg-[rgba(20,30,40,0.6)] rounded-xl border border-[rgba(0,255,157,0.2)] hover:z-50 backdrop-blur-[10px] flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-center rounded-t-xl">
                <div className="flex items-center gap-2.5">
                    <Zap size={16} color="#00ff9d" />
                    <div>
                        <h3 className="m-0 text-[13px] font-bold uppercase tracking-[1px] text-[var(--text-primary)] flex items-center gap-2">
                            <span>{playbook.name}</span>
                            <CustomTooltip
                                title="Playbook Engine"
                                usedFor="Provides standardized, step-by-step incident response procedures tailored to the specific alert type."
                                interpret="Follow the steps sequentially. Use 'Run Automated' for instant execution of API-driven mitigation steps."
                            />
                        </h3>
                        <div className="text-[10px] text-[#4a5568] mt-[2px]">
                            {playbook.type} · Estimated: {playbook.estimatedTime}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="text-[11px] text-[var(--text-secondary)]">
                        <strong className="text-[#00ff9d]">{completedCount}</strong>/{playbook.steps.length} completed
                    </div>
                    <button
                        onClick={runAutomated}
                        disabled={isRunning}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold transition-all ${isRunning ? 'bg-[rgba(0,255,157,0.1)] text-[#00ff9d] border border-[#00ff9d] cursor-not-allowed shadow-none' : 'bg-[#00ff9d] text-[#000] border-none cursor-pointer shadow-[0_0_15px_rgba(0,255,157,0.3)]'}`}
                    >
                        <Play size={12} />
                        {isRunning ? 'Running...' : 'Run Automated'}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-[3px] bg-[rgba(255,255,255,0.05)]">
                <motion.div
                    animate={{ width: `${(completedCount / playbook.steps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-[#00ff9d] shadow-[0_0_8px_rgba(0,255,157,0.5)]"
                />
            </div>

            {/* Steps */}
            <div className="p-5 flex flex-col gap-2">
                <div className="text-[11px] text-[var(--text-secondary)] mb-1">
                    {playbook.description}
                </div>
                {playbook.steps.map((step, i) => {
                    const status = stepStatus[step.id];
                    const isDone = status === 'done';
                    const isRunning2 = status === 'running';
                    const Icon = step.icon;
                    const isExpanded = expanded === step.id;

                    return (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <div className={`flex items-center gap-3 px-[14px] py-2.5 rounded-lg border cursor-pointer transition-all duration-200 ${isDone ? 'bg-[rgba(0,255,157,0.05)] border-[rgba(0,255,157,0.2)]' : isRunning2 ? 'bg-[rgba(0,243,255,0.05)] border-[rgba(0,243,255,0.2)]' : 'bg-[rgba(0,0,0,0.2)] border-[rgba(255,255,255,0.05)]'}`}>
                                {/* Step icon */}
                                <div className="w-7 h-7 rounded-md shrink-0 flex items-center justify-center"
                                    style={{ backgroundColor: isDone ? 'rgba(0,255,157,0.15)' : step.color + '15' }}>
                                    {isDone ? <CheckCircle size={14} color="#00ff9d" /> :
                                        isRunning2 ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Clock size={14} color="#00f3ff" /></motion.div> :
                                            <Icon size={14} color={step.color} />}
                                </div>

                                <div className="flex-1" onClick={() => setExpanded(isExpanded ? null : step.id)}>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold ${isDone ? 'text-[#00ff9d] line-through opacity-70' : 'text-[var(--text-primary)] no-underline opacity-100'}`}>
                                            {step.title}
                                        </span>
                                        {step.automated && (
                                            <span className="px-1.5 py-[1px] rounded-[3px] text-[9px] font-bold bg-[rgba(0,243,255,0.1)] text-[#00f3ff]">
                                                AUTO
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {isExpanded ? <ChevronDown size={12} color="#4a5568" onClick={() => setExpanded(null)} /> : <ChevronRight size={12} color="#4a5568" onClick={() => setExpanded(step.id)} />}

                                {/* Manual toggle */}
                                {!step.automated && (
                                    <button
                                        onClick={() => toggleStep(step.id)}
                                        className={`px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer ${isDone ? 'bg-[rgba(255,255,255,0.05)] text-[#4a5568] border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(0,255,157,0.1)] text-[#00ff9d] border-[rgba(0,255,157,0.3)]'}`}
                                    >{isDone ? 'Undo' : 'Mark Done'}</button>
                                )}
                            </div>

                            {isExpanded && (
                                <div className="mt-1 px-[14px] py-2.5 bg-[rgba(0,0,0,0.2)] rounded-md text-xs text-[var(--text-secondary)] leading-[1.6]" style={{ borderLeft: `3px solid ${step.color}` }}>
                                    {step.detail}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default PlaybookEngine;
