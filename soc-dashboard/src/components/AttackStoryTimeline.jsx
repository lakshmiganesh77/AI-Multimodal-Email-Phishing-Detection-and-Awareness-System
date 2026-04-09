import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MousePointer, Key, Globe, Settings, DollarSign, AlertTriangle, Shield, Eye, Clock } from 'lucide-react';

const STORY_TEMPLATES = {
    PHISHING: [
        {
            time: '09:12:04',
            title: 'Phishing Email Delivered',
            detail: 'Malicious email bypassed gateway filters and landed in inbox. SPF FAIL detected post-delivery.',
            icon: Mail, color: '#ff3333', stage: 'Initial Access',
        },
        {
            time: '09:14:18',
            title: 'User Clicked Malicious Link',
            detail: 'Recipient clicked embedded URL. Browser redirected through 2 hops to credential harvesting page.',
            icon: MousePointer, color: '#ff6b6b', stage: 'Execution',
        },
        {
            time: '09:16:52',
            title: 'Credential Submission Detected',
            detail: 'HTTP POST to spoofed login portal. Username and password fields captured by attacker infrastructure.',
            icon: Key, color: '#ffa94d', stage: 'Credential Theft',
        },
        {
            time: '09:20:31',
            title: 'Login from Anomalous IP',
            detail: 'Successful authentication from 185.220.101.47 (RU/Tor exit node). Impossible travel detected.',
            icon: Globe, color: '#ffd700', stage: 'Persistence',
        },
        {
            time: '09:22:14',
            title: 'Mailbox Rule Created',
            detail: 'Auto-forward rule created: all emails → attacker@external.com. Classic BEC persistence.',
            icon: Settings, color: '#c084fc', stage: 'Lateral Movement',
        },
        {
            time: '09:25:07',
            title: 'Finance Impersonation Attempt',
            detail: 'Reply-chain attack initiated targeting CFO. Wire transfer request for $85,000 detected.',
            icon: DollarSign, color: '#f87171', stage: 'Exfiltration',
        },
    ],
    BEC: [
        {
            time: '10:01:33',
            title: 'CEO Lookalike Email Received',
            detail: 'Display name spoofing of CEO from external domain registered 3 days ago.',
            icon: Mail, color: '#ff3333', stage: 'Initial Access',
        },
        {
            time: '10:03:41',
            title: 'Finance Team Targeted',
            detail: 'Request to process urgent wire transfer. Financial pressure keywords detected (urgency score: 0.94).',
            icon: DollarSign, color: '#ff6b6b', stage: 'Execution',
        },
        {
            time: '10:07:12',
            title: 'Reply Chain Established',
            detail: 'Finance analyst replied. Attacker deepened impersonation with additional pressure tactics.',
            icon: Settings, color: '#ffa94d', stage: 'Persistence',
        },
    ],
    SPAM: [
        {
            time: '14:30:00',
            title: 'Bulk Email Campaign Detected',
            detail: 'High-volume sending pattern from shared IP infrastructure. Marketing spam or botnet.',
            icon: Mail, color: '#ffd700', stage: 'Initial Access',
        },
        {
            time: '14:30:45',
            title: 'Unsubscribe Links Analyzed',
            detail: 'Embedded links checked — no malicious payload. Commercial solicitation confirmed.',
            icon: Eye, color: '#8b949e', stage: 'Analysis',
        },
    ],
};

const AttackStoryTimeline = ({ alert }) => {
    const [expanded, setExpanded] = useState(null);

    if (!alert) return null;

    const storyType = alert.type === 'PHISHING' ? 'PHISHING'
        : alert.title?.toLowerCase().includes('bec') || alert.title?.toLowerCase().includes('wire') ? 'BEC'
            : 'SPAM';

    const story = STORY_TEMPLATES[storyType] || STORY_TEMPLATES.SPAM;
    const baseDate = new Date();
    baseDate.setHours(parseInt(story[0].time.split(':')[0]), 0, 0, 0);

    return (
        <div className="bg-[rgba(20,30,40,0.6)] rounded-xl border border-[rgba(0,243,255,0.1)] overflow-hidden backdrop-blur-[10px]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Clock size={16} color="#00f3ff" />
                    <h3 className="m-0 text-[13px] font-bold uppercase tracking-[1px] text-[var(--text-primary)]">
                        Attack Story Reconstruction
                    </h3>
                </div>
                <div className="px-2.5 py-[3px] rounded bg-[rgba(255,51,51,0.1)] text-[#ff3333] text-[9px] font-bold tracking-[1px]">
                    {story.length} EVENTS RECONSTRUCTED
                </div>
            </div>

            {/* Timeline */}
            <div className="p-5 relative">
                {/* Vertical connector line */}
                <div className="absolute left-[36px] top-[30px] bottom-[30px] w-[2px] rounded-[2px] z-0"
                    style={{ background: 'linear-gradient(to bottom, #ff3333, rgba(255,51,51,0.1))' }}
                />

                {story.map((event, i) => {
                    const Icon = event.icon;
                    const isExpanded = expanded === i;
                    const isLast = i === story.length - 1;

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.4 }}
                            className={`flex gap-4 relative z-10 ${isLast ? 'mb-0' : 'mb-4'}`}
                        >
                            {/* Icon Circle */}
                            <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center relative shadow-[0_0_15px_var(--icon-color-40)] border-2 border-[var(--icon-color)]"
                                style={{
                                    backgroundColor: event.color + '20', borderColor: event.color,
                                    '--icon-color': event.color, '--icon-color-40': event.color + '40'
                                }}>
                                <Icon size={16} color={event.color} />
                            </div>

                            {/* Content */}
                            <div
                                onClick={() => setExpanded(isExpanded ? null : i)}
                                className={`flex-1 cursor-pointer rounded-lg px-3.5 py-2.5 transition-all duration-200 ${isExpanded ? 'bg-[rgba(0,0,0,0.4)]' : 'bg-[rgba(0,0,0,0.2)]'}`}
                                style={{ border: `1px solid ${isExpanded ? event.color + '40' : 'rgba(255,255,255,0.05)'}` }}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <span className="text-xs font-bold text-[var(--text-primary)]">{event.title}</span>
                                        <span className="ml-2.5 px-1.5 py-[1px] rounded-[3px] text-[9px] font-bold"
                                            style={{ backgroundColor: event.color + '20', color: event.color }}>
                                            {event.stage}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-[#4a5568] shrink-0 ml-2">
                                        {event.time}
                                    </span>
                                </div>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                    >
                                        <p className="text-xs text-[var(--text-secondary)] leading-[1.6] m-0 mt-1.5">
                                            {event.detail}
                                        </p>
                                    </motion.div>
                                )}
                                {!isExpanded && (
                                    <p className="text-[11px] text-[var(--text-secondary)] m-0 mt-0.5 overflow-hidden whitespace-nowrap text-ellipsis max-w-[85%]">
                                        {event.detail}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Estimated Impact Footer */}
            <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(255,51,51,0.04)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Shield size={13} color="#ff3333" />
                    <span className="text-[11px] text-[var(--text-secondary)]">
                        Attack duration: <strong className="text-[var(--text-primary)]">~13 minutes</strong>
                    </span>
                </div>
                <span className="text-[11px] text-[#ff3333] font-bold">
                    {storyType === 'PHISHING' ? '⚠ Credential Compromise Likely' : storyType === 'BEC' ? '⚠ Financial Fraud Attempt' : '✓ Low Risk Confirmed'}
                </span>
            </div>
        </div>
    );
};

export default AttackStoryTimeline;
