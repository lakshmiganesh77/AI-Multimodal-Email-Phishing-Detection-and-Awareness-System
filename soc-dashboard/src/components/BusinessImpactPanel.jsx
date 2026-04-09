import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Building2, Users, CreditCard, AlertCircle, Shield, BarChart2 } from 'lucide-react';

const DEPT_RISKS = [
    { dept: 'Finance', risk: 'CRITICAL', score: 94, targeted: 12, icon: '💰', color: '#ff3333' },
    { dept: 'Executive', risk: 'HIGH', score: 78, targeted: 4, icon: '👔', color: '#ff6b6b' },
    { dept: 'HR', risk: 'HIGH', score: 71, targeted: 7, icon: '👥', color: '#ffa94d' },
    { dept: 'IT', risk: 'MEDIUM', score: 52, targeted: 3, icon: '💻', color: '#ffd700' },
    { dept: 'Legal', risk: 'MEDIUM', score: 48, targeted: 2, icon: '⚖️', color: '#ffd700' },
    { dept: 'Marketing', risk: 'LOW', score: 23, targeted: 1, icon: '📢', color: '#00ff9d' },
];

const getRiskColor = (risk) => {
    if (risk === 'CRITICAL') return '#ff3333';
    if (risk === 'HIGH') return '#ff6b6b';
    if (risk === 'MEDIUM') return '#ffd700';
    return '#00ff9d';
};

const BusinessImpactPanel = ({ stats }) => {
    const [activeView, setActiveView] = useState('summary');

    const financials = {
        prevented: 420000,
        exposure: 85000,
        trend: +12,
    };

    const formatMoney = (n) => {
        if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
        return `$${(n / 1000).toFixed(0)}K`;
    };

    return (
        <div className="bg-[rgba(20,30,40,0.6)] rounded-xl border border-[rgba(0,243,255,0.1)] overflow-hidden backdrop-blur-[10px]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                    <Building2 size={16} color="#00f3ff" />
                    <h3 className="m-0 text-[13px] font-bold uppercase tracking-[1px] text-[var(--text-primary)]">
                        Business Impact Layer
                    </h3>
                </div>
                <div className="flex gap-1 bg-[rgba(0,0,0,0.3)] rounded-md p-0.5">
                    {['summary', 'departments'].map(v => (
                        <button
                            key={v} onClick={() => setActiveView(v)}
                            className={`px-3 py-1 rounded-[4px] text-[11px] font-semibold border-none cursor-pointer capitalize transition-colors ${activeView === v ? 'bg-[rgba(0,243,255,0.15)] text-[#00f3ff]' : 'bg-transparent text-[#4a5568]'}`}
                        >{v}</button>
                    ))}
                </div>
            </div>

            <div className="p-5">
                {activeView === 'summary' && (
                    <div className="flex flex-col gap-4">
                        {/* Financial Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Prevented Loss */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 rounded-[10px] border border-[rgba(0,255,136,0.2)]"
                                style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,255,136,0.02))' }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield size={14} color="#00ff9d" />
                                    <span className="text-[10px] text-[#4a5568] uppercase tracking-[0.5px]">
                                        Estimated Prevented Loss
                                    </span>
                                </div>
                                <div className="text-[28px] font-black font-mono text-[#00ff9d]">
                                    {formatMoney(financials.prevented)}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp size={11} color="#00ff9d" />
                                    <span className="text-[10px] text-[#00ff9d]">Last 30 days · 48 incidents blocked</span>
                                </div>
                            </motion.div>

                            {/* Potential Exposure */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="p-4 rounded-[10px] border border-[rgba(255,51,51,0.2)]"
                                style={{ background: 'linear-gradient(135deg, rgba(255,51,51,0.08), rgba(255,51,51,0.02))' }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle size={14} color="#ff3333" />
                                    <span className="text-[10px] text-[#4a5568] uppercase tracking-[0.5px]">
                                        Potential Exposure
                                    </span>
                                </div>
                                <div className="text-[28px] font-black font-mono text-[#ff3333]">
                                    {formatMoney(financials.exposure)}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp size={11} color="#ff3333" />
                                    <span className="text-[10px] text-[#ff6b6b]">3 active critical incidents</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* 24h Executive Summary */}
                        <div className="p-4 bg-[rgba(0,0,0,0.3)] rounded-[10px] border border-[rgba(255,255,255,0.05)]">
                            <div className="text-[10px] text-[#4a5568] uppercase tracking-[1px] mb-3">
                                Last 24h Executive Summary
                            </div>
                            {[
                                { icon: '🎯', text: '2 BEC attempts targeting Finance department', severity: 'CRITICAL', color: '#ff3333' },
                                { icon: '🦠', text: '1 Malware delivery attempt blocked at perimeter', severity: 'HIGH', color: '#ff6b6b' },
                                { icon: '✅', text: '0 confirmed account takeovers', severity: 'CLEAR', color: '#00ff9d' },
                                { icon: '💰', text: `Estimated prevented loss: ${formatMoney(210000)}`, severity: 'SAVED', color: '#00f3ff' },
                            ].map((item, i) => (
                                <div key={i} className={`flex items-center gap-2.5 py-2 ${i < 3 ? 'border-b border-[rgba(255,255,255,0.04)]' : ''}`}>
                                    <span className="text-sm min-w-[20px]">{item.icon}</span>
                                    <span className="flex-1 text-xs text-[var(--text-secondary)]">{item.text}</span>
                                    <span className="px-2 py-0.5 rounded-[3px] text-[9px] font-bold tracking-[0.5px] shrink-0"
                                        style={{ backgroundColor: item.color + '15', color: item.color }}
                                    >{item.severity}</span>
                                </div>
                            ))}
                        </div>

                        {/* Month Trends */}
                        <div className="grid grid-cols-3 gap-2.5">
                            {[
                                { label: 'Phishing', trend: +12, suffix: '%', color: '#ff3333', icon: TrendingUp },
                                { label: 'Malware', trend: -5, suffix: '%', color: '#00ff9d', icon: TrendingDown },
                                { label: 'BEC', trend: +8, suffix: '%', color: '#ffd700', icon: TrendingUp },
                            ].map((t, i) => {
                                const Icon = t.icon;
                                return (
                                    <div key={i} className="p-3 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)] text-center">
                                        <div className="text-[10px] text-[#4a5568] mb-1">{t.label}</div>
                                        <div className="flex items-center justify-center gap-1">
                                            <Icon size={13} color={t.color} />
                                            <span className="text-base font-extrabold font-mono" style={{ color: t.color }}>
                                                {t.trend > 0 ? '+' : ''}{t.trend}{t.suffix}
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-[#4a5568] mt-0.5">vs last month</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeView === 'departments' && (
                    <div className="flex flex-col gap-2.5">
                        <div className="text-xs text-[var(--text-secondary)] mb-1">
                            Department risk ranking based on targeting frequency and threat severity
                        </div>
                        {DEPT_RISKS.map((d, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="flex items-center gap-3.5 px-3.5 py-3 rounded-lg bg-[rgba(0,0,0,0.3)]"
                                style={{ border: `1px solid ${d.color}20` }}
                            >
                                <span className="text-lg">{d.icon}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs font-bold text-[var(--text-primary)]">{d.dept}</span>
                                        <span className="text-[11px] text-[#4a5568]">{d.targeted} attempts</span>
                                    </div>
                                    <div className="h-1 bg-[rgba(255,255,255,0.05)] rounded-[2px] overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${d.score}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.06 }}
                                            className="h-full rounded-[2px]"
                                            style={{ backgroundColor: d.color, boxShadow: `0 0 6px ${d.color}60` }}
                                        />
                                    </div>
                                </div>
                                <span className="px-2.5 py-[3px] rounded-[4px] text-[10px] font-bold tracking-[0.5px] min-w-[72px] text-center"
                                    style={{ backgroundColor: d.color + '15', color: d.color }}
                                >{d.risk}</span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusinessImpactPanel;
