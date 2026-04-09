import React, { useState } from 'react';
import {
    Shield, AlertTriangle, Target, DollarSign,
    TrendingDown, ChevronUp, ChevronDown, Activity, Users, Crosshair,
    Clock, Zap, MapPin, UserX
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import MitreMatrix from './MitreMatrix';
import CustomTooltip from './CustomTooltip';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const ExecutiveAnalytics = ({ stats, onExplain }) => {
    const [expanded, setExpanded] = useState(null); // { title, component }
    // ----------------------
    // Risk Trend Data
    // ----------------------
    const riskTrendData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Risk Score',
            data: [65, 70, 67, 62, 58, 60, 56],
            borderColor: '#00f3ff',
            backgroundColor: 'rgba(0, 243, 255, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#00f3ff',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };

    const riskTrendOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(13, 20, 30, 0.95)',
                titleColor: '#00f3ff',
                bodyColor: '#fff',
                borderColor: 'rgba(0, 243, 255, 0.3)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: (ctx) => `Risk Score: ${ctx.raw}`
                }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#8b949e', font: { family: 'Inter', size: 10 } } },
            y: { grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#8b949e', font: { family: 'Inter', size: 10 }, stepSize: 10 } }
        }
    };

    // ----------------------
    // Helper Components
    // ----------------------
    const StatCard = ({ title, value, subtext, icon: Icon, color, trend, trendUp, tooltipTitle, tooltipDesc }) => (
        <div className="glass-card p-5 md:p-6 flex flex-col justify-between h-[138px] rounded-2xl border border-white/5 relative hover:z-50 group">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg border" style={{
                        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                    }}>
                        <Icon size={18} color={color} />
                    </div>
                    {tooltipTitle && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <CustomTooltip title={tooltipTitle} usedFor={tooltipDesc} interpret="Monitored closely by analysts. Significant spikes indicate active campaigns or new attack variants." />
                        </div>
                    )}
                </div>
                {trend && (
                    <span className={`badge ${trendUp ? 'badge-safe text-green-400 border-green-400/30 bg-green-400/10' : 'badge-critical'}`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </span>
                )}
            </div>

            <div>
                <p className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                    {title}
                </p>
                <div className="flex items-center gap-2">
                    <h3 className="text-xl md:text-2xl font-bold text-white m-0 tracking-tight glow-text-cyan">
                        {value}
                    </h3>
                    {subtext && (
                        <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                            {subtext}
                        </span>
                    )}
                </div>
            </div>
            {/* Glow Effect */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <div className="absolute -bottom-5 -right-5 w-20 h-20 rounded-full blur-[40px] opacity-10" style={{ background: color }} />
            </div>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-500">

            {/* ── Fullscreen Chart Modal ── */}
            {expanded && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
                    onClick={() => setExpanded(null)}
                >
                    <div
                        className="relative rounded-2xl border border-white/10 p-6 flex flex-col"
                        style={{ width: '90vw', maxWidth: 1200, height: '80vh', background: '#0d1117', boxShadow: '0 0 80px rgba(0,243,255,0.1)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-[14px] font-bold text-white tracking-widest uppercase">{expanded.title}</h2>
                            <button className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => setExpanded(null)}>✕</button>
                        </div>
                        <div className="flex-1 min-h-0">
                            {expanded.component}
                        </div>
                    </div>
                </div>
            )}
            {/* 1. Security KPIs */}
            <div>
                <div className="mb-3 relative">
                    <div className="absolute -left-6 md:-left-8 top-0 bottom-0 w-[4px] bg-cyan-neon shadow-[0_0_15px_rgba(0,243,255,0.8)] rounded-r-md"></div>
                    <h3 className="text-[14px] md:text-[16px] font-bold text-white tracking-[0.1em] uppercase mb-0.5">Security KPIs</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    <StatCard
                        title="Threats Detected (24h)"
                        value={stats.threats_detected || 156}
                        subtext="total incidents"
                        icon={AlertTriangle}
                        color="var(--color-red-neon)"
                        trend="12% vs yesterday"
                        trendUp={false}
                        tooltipTitle="Threats Detected"
                        tooltipDesc="Total number of unique phishing, BEC, and malware events flagged by the AI engine in the past 24 hours."
                    />
                    <StatCard
                        title="Block Rate"
                        value="99.7%"
                        icon={Shield}
                        color="var(--color-green-neon)"
                        trend="0.3% improvement"
                        trendUp={true}
                        tooltipTitle="Block Rate"
                        tooltipDesc="Percentage of all inbound malicious emails and payloads successfully blocked before reaching user inboxes."
                    />
                    <StatCard
                        title="AI Confidence"
                        value="94.2%"
                        icon={Target}
                        color="var(--color-cyan-neon)"
                        trend="Stable (7 days)"
                        trendUp={true}
                        tooltipTitle="AI Confidence"
                        tooltipDesc="Average model certainty score across all classifications in the last 7 days. Above 90% indicates high-reliability detections."
                    />
                    <StatCard
                        title="Critical Threats"
                        value="7"
                        subtext="detected today"
                        icon={Zap}
                        color="#ff6b00"
                        trend="Finance + CEO targeted"
                        trendUp={false}
                        tooltipTitle="Critical Threats"
                        tooltipDesc="High-severity alerts requiring immediate analyst response, including BEC, targeted spearphishing, and advanced persistent threats."
                    />
                    <StatCard
                        title="Response Speed (MTTR)"
                        value="34m"
                        subtext="avg response"
                        icon={Clock}
                        color="#a78bfa"
                        trend="12% improvement"
                        trendUp={true}
                        tooltipTitle="Mean Time To Respond"
                        tooltipDesc="Average time from alert detection to analyst acknowledgment and initial containment action."
                    />
                </div>
            </div>

            {/* 2. Business Impact */}
            <div>
                <div className="mb-4 relative mt-2">
                    <div className="absolute -left-6 md:-left-8 top-0 bottom-0 w-[4px] bg-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.8)] rounded-r-md"></div>
                    <h3 className="text-[14px] md:text-[16px] font-bold text-white tracking-[0.1em] uppercase mb-0.5">Business Impact</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Estimated Fraud Prevented"
                        value="$85,000"
                        subtext="this week"
                        icon={DollarSign}
                        color="#00ff9d"
                        trend="BEC & Wire Fraud Blocked"
                        trendUp={true}
                        tooltipTitle="Fraud Prevented"
                        tooltipDesc="Calculated sum of intercepted Business Email Compromise and Invoice Fraud attempts."
                    />
                    <StatCard
                        title="Potential Loss Avoided"
                        value="$45,000"
                        subtext="prevented today"
                        icon={TrendingDown}
                        color="#00f3ff"
                        trend="Large BEC transfer thwarted"
                        trendUp={true}
                        tooltipTitle="Loss Avoided"
                        tooltipDesc="The maximum potential financial damage of the most severe attacks stopped in the last 24h."
                    />
                    <StatCard
                        title="High Risk Users"
                        value="4"
                        subtext="employees flagged"
                        icon={UserX}
                        color="#f97316"
                        trend="Finance & HR most at risk"
                        trendUp={false}
                        tooltipTitle="High Risk Users"
                        tooltipDesc="Employees who clicked phishing links, opened malicious attachments, or had credentials harvested in the last 30 days."
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                {/* 3. Security Posture */}
                <div>
                    <div className="mb-3 relative">
                        <div className="absolute -left-6 md:-left-8 top-0 bottom-0 w-[4px] bg-[#c084fc] shadow-[0_0_15px_rgba(192,132,252,0.8)] rounded-r-md"></div>
                        <h3 className="text-[14px] md:text-[16px] font-bold text-white tracking-[0.1em] uppercase mb-0.5">Security Posture</h3>
                    </div>
                    <div className="glass-card p-6 rounded-2xl border border-white/5 h-[260px] flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl font-black text-[#c084fc] drop-shadow-[0_0_15px_rgba(192,132,252,0.5)]">82<span className="text-xl text-gray-500">/100</span></div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#c084fc]">Overall Score</span>
                                    <span className="text-[10px] text-green-400 mt-1 font-mono">↑ +7 pts this month</span>
                                </div>
                            </div>
                            <CustomTooltip title="Security Posture Score" usedFor="Composite security health score across phishing defense, malware protection, and user awareness. 100 = fully hardened." interpret="A score below 80 indicates significant vulnerabilities. Prioritize addressing the lowest-scoring domain (e.g., User Awareness)." />
                        </div>

                        <div className="space-y-4 mt-4">
                            {[
                                { label: 'Phishing Defense', score: 90, width: '90%', color: '#00ff9d', tip: 'Effectiveness of email filtering, DMARC/SPF policies, and sandbox detonation against phishing vectors.' },
                                { label: 'Malware Protection', score: 81, width: '81%', color: '#c084fc', tip: 'Endpoint AV, attachment sandboxing, and hash-blocking coverage against known malware families.' },
                                { label: 'User Awareness', score: 74, width: '74%', color: '#ff3333', tip: 'Simulated phishing click-through rate and security training completion metrics across all departments.' },
                            ].map((item, i) => (
                                <div key={i} className="group/bar relative">
                                    <div className="flex justify-between items-center text-[11px] uppercase tracking-widest font-bold mb-1.5">
                                        <span className="text-gray-400 flex items-center gap-1.5">
                                            {item.label}
                                            <span className="inline-flex relative cursor-help">
                                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="4.5" stroke="#4a5568" /><text x="5" y="7.5" textAnchor="middle" fontSize="6" fill="#4a5568">i</text></svg>
                                                <div className="absolute bottom-full left-0 mb-1.5 z-50 min-w-[200px] bg-[#0a0e1a] border border-[rgba(0,243,255,0.2)] rounded-lg p-2.5 shadow-xl hidden group-hover/bar:block">
                                                    <p className="text-[10px] text-gray-300 leading-relaxed m-0">{item.tip}</p>
                                                </div>
                                            </span>
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: item.width, backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                                            </div>
                                            <span className="text-white w-6 text-right" style={{ color: item.color }}>{item.score}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. Risk Trend */}
                <div>
                    <div className="mb-3 relative">
                        <div className="absolute -left-6 md:-left-8 top-0 bottom-0 w-[4px] bg-[#eab308] shadow-[0_0_15px_rgba(234,179,8,0.8)] rounded-r-md"></div>
                        <h3 className="text-[14px] md:text-[16px] font-bold text-white tracking-[0.1em] uppercase mb-0.5">Risk Trend (7 Days)</h3>
                    </div>
                    <div className="glass-card p-6 rounded-2xl border border-white/5 h-[260px] flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Global Organizational Risk</span>
                                <p className="text-[9px] text-gray-600 mt-0.5">Composite risk index scored 0–100 across all active threats</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-green-400 font-mono bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">↓ 8% this week</span>
                                <CustomTooltip title="Risk Trend" usedFor="7-day rolling organizational risk score, weighted by alert severity, uncontained threats, and exposure surface." interpret="A rising trend requires immediate investigation into new attack vectors or delayed response times." />
                                <button
                                    onClick={() => setExpanded({ title: 'Risk Trend (7 Days)', component: <div className="w-full h-full"><Line data={riskTrendData} options={{ ...riskTrendOptions, maintainAspectRatio: false }} /></div> })}
                                    className="text-[9px] px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/50 hover:text-white uppercase tracking-wider transition-all font-bold"
                                >⤢ Expand</button>
                            </div>
                        </div>
                        <div
                            className="flex-1 min-h-0 w-full cursor-pointer"
                            onDoubleClick={() => setExpanded({ title: 'Risk Trend (7 Days)', component: <div className="w-full h-full"><Line data={riskTrendData} options={{ ...riskTrendOptions, maintainAspectRatio: false }} /></div> })}
                        >
                            <Line data={riskTrendData} options={riskTrendOptions} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* 5. Top Threats Summary */}
                <div>
                    <div className="mb-3 relative">
                        <div className="absolute -left-6 md:-left-8 top-0 bottom-0 w-[4px] bg-[#ff3333] shadow-[0_0_15px_rgba(255,51,51,0.8)] rounded-r-md"></div>
                        <h3 className="text-[14px] md:text-[16px] font-bold text-white tracking-[0.1em] uppercase mb-0.5">Top Threats Summary</h3>
                    </div>
                    <div className="glass-card p-6 rounded-2xl border border-white/5 h-[280px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Most Attempted Attacks</span>
                            <CustomTooltip title="Top Threats" usedFor="Ranked list of the most frequently observed attack patterns across all monitored email channels in the last 24h." interpret="Use this to prioritize defense controls. E.g., a spike in BEC means stricter DMARC or CEO impersonation checks are needed." />
                        </div>
                        <div className="space-y-2.5 flex-1">
                            {[
                                { rank: '1', label: 'Phishing (T1566)', color: '#ff3333', pct: 58, tip: 'MITRE T1566 — Phishing via malicious links and credential-harvesting pages.' },
                                { rank: '2', label: 'Business Email Compromise', color: '#ffd700', pct: 34, tip: 'CEO/CFO impersonation used to redirect wire transfers to attacker-controlled accounts.' },
                                { rank: '3', label: 'Malware Attachments', color: '#c084fc', pct: 21, tip: 'Malicious PDF and Office documents used to deliver staged payloads.' },
                            ].map((t, i) => (
                                <div key={i} className="flex items-center gap-3 group/threat">
                                    <span className="font-mono font-black text-xs w-3" style={{ color: t.color }}>{t.rank}</span>
                                    <div className="flex-1 bg-black/20 px-3 py-2 rounded-lg border border-white/5 hover:border-white/10 transition-all">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-white text-[11px] font-bold">{t.label}</span>
                                            <span className="text-[9px] font-mono" style={{ color: t.color }}>{t.pct}%</span>
                                        </div>
                                        <div className="h-0.5 bg-white/5 rounded-full">
                                            <div className="h-full rounded-full" style={{ width: `${t.pct}%`, backgroundColor: t.color }} />
                                        </div>
                                    </div>
                                    <div className="relative opacity-0 group-hover/threat:opacity-100 transition-opacity">
                                        <CustomTooltip title={t.label} usedFor={t.tip} interpret="Compare relative percentages consistently to allocate security resources effectively." />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-white/10 pt-4 mt-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest flex items-center gap-1.5">
                                    <Users size={12} className="text-[#00f3ff]" />
                                    Top Target Departments
                                </span>
                                <CustomTooltip title="Target Departments" usedFor="Departments most frequently targeted based on email recipient distribution analysis across all active campaigns." interpret="High targeting of specific departments indicates a strong need for tailored security awareness training and stricter access controls." />
                            </div>
                            <div className="flex items-center gap-6 mt-1">
                                <div>
                                    <span className="text-lg font-black text-white glow-text-cyan mr-1">38%</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Finance</span>
                                </div>
                                <div>
                                    <span className="text-lg font-black text-white glow-text-cyan mr-1">21%</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">HR</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. MITRE Overview */}
                <div>
                    {/* Header already partially generated by the MitreMatrix, but let's align it with the layout */}
                    <div className="mb-3 relative">
                        <div className="absolute -left-6 md:-left-8 top-0 bottom-0 w-[4px] bg-[#0ea5e9] shadow-[0_0_15px_rgba(14,165,233,0.8)] rounded-r-md"></div>
                        <h3 className="text-[14px] md:text-[16px] font-bold text-white tracking-[0.1em] uppercase mb-0.5">MITRE Overview</h3>
                    </div>
                    <div className="h-[280px] relative">
                        <MitreMatrix onExplain={onExplain} />
                    </div>
                </div>
            </div>


        </div>
    );
};

export default ExecutiveAnalytics;
