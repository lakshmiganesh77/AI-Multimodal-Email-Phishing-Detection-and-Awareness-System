import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, AlertTriangle, Shield, Lock, TrendingUp, ChevronDown, ChevronRight, Download } from 'lucide-react';

const POST_INCIDENT_TEMPLATE = {
    PHISHING: {
        root_cause: 'Email gateway failed to detect lookalike domain registered 3 days prior. SPF policy for the impersonated brand was not enforced strictly.',
        attack_vector: 'Spearphishing via email (T1566.001) — targeted credential harvesting page with SSL certificate.',
        control_gap: 'Missing DMARC enforcement on third-party SaaS email relay. MFA was not enforced for VPN login.',
        lessons_learned: [
            'Enable DMARC reject policy for all outbound email domains.',
            'Add domain-age threshold check to pre-delivery email scanning.',
            'Require phishing-resistant MFA (FIDO2) for high-value accounts.',
            'Conduct monthly phishing simulation for finance/HR teams.',
        ],
        detection_time: '14 min',
        containment_time: '42 min',
        total_impact: 'Low — credentials submitted but account not accessed. Rapid SOC response prevented data exfiltration.',
        severity_final: 'HIGH',
        improvements: ['Domain Age Filter', 'DMARC Strictness', 'MFA Hardening'],
    },
    BEC: {
        root_cause: 'Attacker registered lookalike domain 5 days prior. Display name spoofing bypassed simple string match filter.',
        attack_vector: 'Business Email Compromise (T1566.002) — CEO impersonation targeting CFO for wire transfer.',
        control_gap: 'No wire transfer validation SOP requiring out-of-band CFO confirmation. Display name filter had exceptions.',
        lessons_learned: [
            'Implement mandatory callback verification for all wire transfers > $10K.',
            'Add external email banners for all emails claiming to be internal executives.',
            'Tighten display name spoofing rules in email gateway.',
            'Update finance SOP to include two-person authorization rule.',
        ],
        detection_time: '8 min',
        containment_time: '22 min',
        total_impact: 'Medium — wire transfer paused. $0 financial loss. Finance responded correctly.',
        severity_final: 'CRITICAL',
        improvements: ['Display Name Filter', 'Wire Transfer SOP', 'External Email Banner'],
    },
    SPAM: {
        root_cause: 'Bulk spam campaign from shared IP infrastructure — likely botnet or compromised marketing platform.',
        attack_vector: 'Mass commercial spam (no malicious payload detected). Unsubscribe compliance violation.',
        control_gap: 'Spam filter blocking threshold was set too high. Shared IP reputation list was outdated.',
        lessons_learned: [
            'Lower spam confidence threshold from 0.7 to 0.65.',
            'Update IP reputation blocklist from external feed.',
            'Enable bulk mail headers detection.',
        ],
        detection_time: '32 min',
        containment_time: '5 min',
        total_impact: 'Negligible — no malicious payload. Routine spam handled.',
        severity_final: 'LOW',
        improvements: ['Spam Threshold', 'IP Reputation', 'Bulk Mail Detection'],
    }
};

const PostIncidentReview = ({ alert }) => {
    const [expandedSection, setExpandedSection] = useState('root_cause');

    if (!alert) return null;

    const review = POST_INCIDENT_TEMPLATE[alert.type] || POST_INCIDENT_TEMPLATE.SPAM;

    const sections = [
        {
            id: 'root_cause', label: 'Root Cause Analysis', icon: AlertTriangle, color: '#ff3333',
            content: review.root_cause,
        },
        {
            id: 'attack_vector', label: 'Attack Vector', icon: Shield, color: '#ffa94d',
            content: review.attack_vector,
        },
        {
            id: 'control_gap', label: 'Control Gap Identified', icon: Lock, color: '#ffd700',
            content: review.control_gap,
        },
        {
            id: 'lessons', label: 'Lessons Learned', icon: BookOpen, color: '#00ff9d',
            isList: true, content: review.lessons_learned,
        },
        {
            id: 'improvements', label: 'Recommended Improvements', icon: TrendingUp, color: '#00f3ff',
            isTags: true, content: review.improvements,
        },
    ];

    const exportReport = () => {
        const report = {
            incident_id: alert.id,
            type: alert.type,
            severity_final: review.severity_final,
            review,
            exported_at: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PIR-${alert.id}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-[rgba(20,30,40,0.6)] rounded-xl border border-[rgba(0,255,157,0.15)] overflow-hidden backdrop-blur-[10px]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-center"
                style={{ background: 'linear-gradient(135deg, rgba(0,255,157,0.04), transparent)' }}>
                <div className="flex items-center gap-2.5">
                    <BookOpen size={16} color="#00ff9d" />
                    <div>
                        <h3 className="m-0 text-[13px] font-bold uppercase tracking-[1px] text-[var(--text-primary)]">
                            Post-Incident Review
                        </h3>
                        <div className="text-[10px] text-[#4a5568] mt-0.5">
                            MTTD: {review.detection_time} · MTTC: {review.containment_time}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-[3px] rounded-[4px] text-[10px] font-bold bg-[rgba(255,255,255,0.05)] text-[#4a5568]">
                        Final Severity: <span style={{ color: review.severity_final === 'CRITICAL' ? '#ff3333' : review.severity_final === 'HIGH' ? '#ff6b6b' : review.severity_final === 'MEDIUM' ? '#ffd700' : '#00ff9d' }}>
                            {review.severity_final}
                        </span>
                    </span>
                    <button
                        onClick={exportReport}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[rgba(0,255,157,0.1)] border border-[rgba(0,255,157,0.3)] text-[#00ff9d] text-[11px] font-bold cursor-pointer hover:bg-[rgba(0,255,157,0.15)] transition-colors"
                    >
                        <Download size={12} /> Export PIR
                    </button>
                </div>
            </div>

            <div className="p-5">
                {/* Impact Summary */}
                {/* Impact Summary */}
                <div className="px-4 py-3.5 rounded-lg mb-4 bg-[rgba(0,255,157,0.04)] border border-[rgba(0,255,157,0.15)]">
                    <div className="text-[10px] text-[#4a5568] uppercase tracking-[1px] mb-1.5">
                        Overall Incident Impact
                    </div>
                    <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                        {review.total_impact}
                    </div>
                </div>

                {/* Collapsible Sections */}
                {/* Collapsible Sections */}
                <div className="flex flex-col gap-2">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        const isOpen = expandedSection === section.id;

                        return (
                            <div key={section.id} className="rounded-lg overflow-hidden bg-[rgba(0,0,0,0.2)]"
                                style={{ border: `1px solid ${isOpen ? section.color + '30' : 'rgba(255,255,255,0.05)'}` }}>
                                <div
                                    onClick={() => setExpandedSection(isOpen ? null : section.id)}
                                    className={`flex items-center gap-2.5 px-3.5 py-3 cursor-pointer transition-all duration-200 ${isOpen ? 'bg-[rgba(0,0,0,0.2)]' : 'bg-transparent'}`}
                                >
                                    <Icon size={14} color={section.color} />
                                    <span className="flex-1 text-xs font-bold text-[var(--text-primary)]">
                                        {section.label}
                                    </span>
                                    {isOpen ? <ChevronDown size={13} color="#4a5568" /> : <ChevronRight size={13} color="#4a5568" />}
                                </div>

                                {isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="px-3.5 pb-3.5 pt-0"
                                        style={{ borderTop: `1px solid ${section.color}20` }}
                                    >
                                        {section.isList ? (
                                            <div className="flex flex-col gap-2 pt-3">
                                                {section.content.map((item, i) => (
                                                    <div key={i} className="flex items-start gap-2">
                                                        <CheckCircle size={13} color={section.color} className="shrink-0 mt-0.5" />
                                                        <span className="text-xs text-[var(--text-secondary)] leading-relaxed">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : section.isTags ? (
                                            <div className="flex flex-wrap gap-2 pt-3">
                                                {section.content.map((tag, i) => (
                                                    <span key={i} className="px-3 py-1 rounded-md text-xs font-semibold"
                                                        style={{ backgroundColor: section.color + '15', color: section.color, border: `1px solid ${section.color}30` }}
                                                    >{tag}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-3 mb-0">
                                                {section.content}
                                            </p>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PostIncidentReview;
