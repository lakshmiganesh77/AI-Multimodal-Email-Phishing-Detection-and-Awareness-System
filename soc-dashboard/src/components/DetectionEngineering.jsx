import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Brain, AlertTriangle, Crosshair, Clock, Database, BarChart3, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import SharedTooltip from './CustomTooltip';

// --- DATA MOCKS ---

const generateHealthData = () => {
    return Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
            date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            tpr: parseFloat((82 + Math.random() * 15).toFixed(1)), // True Positive Rate
            fpr: parseFloat((4 + Math.random() * 8).toFixed(1)),   // False Positive Rate
            confidence: parseFloat((85 + Math.random() * 10).toFixed(1)) // Model Confidence
        };
    });
};

const HEALTH_DATA = generateHealthData();

const COVERAGE_DATA = [
    { tactic: 'Execution', coverage: 85, color: '#00ff9d' },
    { tactic: 'Credential Access', coverage: 65, color: '#00f3ff' },
    { tactic: 'Defense Evasion', coverage: 71, color: '#c084fc' },
    { tactic: 'Exfiltration', coverage: 55, color: '#ffd700' },
    { tactic: 'Persistence', coverage: 40, color: '#ff3333' }
];

const generateLatencyData = () => {
    return Array.from({ length: 15 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (14 - i));
        return {
            date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            latency: parseFloat((1.5 + Math.random() * 3.5).toFixed(1)) // 1.5 to 5 mins
        };
    });
};

const LATENCY_DATA = generateLatencyData();

const DRIFT_DATA = [
    { feature: 'Urgency Keywords', weight: 0.23, drift: -0.02, type: 'Data Drift', color: '#ff3333' },
    { feature: 'Sender Domain Age', weight: 0.19, drift: +0.01, type: 'Feature Drift', color: '#00f3ff' },
    { feature: 'URL Form mismatch', weight: 0.17, drift: 0, type: 'Stable', color: '#00ff9d' },
    { feature: 'Auth Header Fails', weight: 0.15, drift: -0.04, type: 'Data Drift', color: '#ff6b6b' },
    { feature: 'Financial Pressure', weight: 0.14, drift: +0.02, type: 'Feature Drift', color: '#c084fc' },
];

const RULES_DATA = [
    { id: 'SIG-4012', name: 'Suspicious Inbox Forwarding', triggered: 142, status: 'Top Triggered', health: 'Healthy' },
    { id: 'SIG-3991', name: 'Mass Credential Pumping', triggered: 89, status: 'Top Triggered', health: 'Healthy' },
    { id: 'SIG-1004', name: 'Generic VPN Login Anomaly', triggered: 1205, status: 'Noisy', health: 'Needs Tuning' },
    { id: 'SIG-0821', name: 'Legacy Auth Baseline Diff', triggered: 940, status: 'Noisy', health: 'Needs Tuning' },
    { id: 'SIG-6502', name: 'Rare Executable Drop', triggered: 0, status: 'Never Triggered', health: 'Review' },
    { id: 'SIG-6599', name: 'Dormant Account Admin Push', triggered: 0, status: 'Never Triggered', health: 'Review' }
];

// --- CUSTOM RECHARTS TOOLTIPS ---

const NeonTooltip = ({ active, payload, label, unit = '%' }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0B101A]/95 border border-cyan-400/30 rounded-lg p-3 shadow-[0_0_15px_rgba(0,243,255,0.15)] flex flex-col gap-1 z-50">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</span>
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-200 text-xs font-medium">{entry.name}:</span>
                    <span className="text-white text-xs font-bold" style={{ color: entry.color }}>
                        {entry.value}{unit}
                    </span>
                </div>
            ))}
        </div>
    );
};

const DetectionEngineering = () => {
    const [expandedChart, setExpandedChart] = useState(null);

    const currentTPR = HEALTH_DATA[HEALTH_DATA.length - 1].tpr;
    const currentFPR = HEALTH_DATA[HEALTH_DATA.length - 1].fpr;
    const currentConf = HEALTH_DATA[HEALTH_DATA.length - 1].confidence;
    const currentLatency = LATENCY_DATA[LATENCY_DATA.length - 1].latency;

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-10 relative">

            {/* Modal Overlay for Expanded Chart */}
            {expandedChart && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setExpandedChart(null)}
                >
                    <div
                        className="w-[90vw] h-[90vh] glass-card rounded-2xl border border-white/10 p-8 flex flex-col relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"
                            onClick={() => setExpandedChart(null)}
                        >
                            ✕
                        </button>
                        <div className="flex-1 min-h-0 w-full h-full p-4">
                            {expandedChart.type === 'Area' && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={expandedChart.data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="colorTprExp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#00ff9d" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorFprExp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ff3333" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#ff3333" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorConfExp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2333" vertical={false} />
                                        <XAxis dataKey="date" stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} interval={2} />
                                        <YAxis stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                        <RechartsTooltip content={<NeonTooltip />} />
                                        <Area type="monotone" dataKey="tpr" name="True Positive Rate" stroke="#00ff9d" strokeWidth={3} fillOpacity={1} fill="url(#colorTprExp)" />
                                        <Area type="monotone" dataKey="fpr" name="False Positive Rate" stroke="#ff3333" strokeWidth={3} fillOpacity={1} fill="url(#colorFprExp)" />
                                        <Area type="monotone" dataKey="confidence" name="Avg Confidence" stroke="#00f3ff" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorConfExp)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                            {expandedChart.type === 'Line' && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={expandedChart.data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2333" vertical={false} />
                                        <XAxis dataKey="date" stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} interval={1} />
                                        <YAxis stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} domain={[0, 6]} />
                                        <RechartsTooltip content={<NeonTooltip unit=" Min" />} />
                                        <Line type="stepAfter" dataKey="latency" name="Latency" stroke="#c084fc" strokeWidth={3} dot={{ fill: '#c084fc', r: 5, strokeWidth: 0 }} activeDot={{ r: 8, fill: '#fff' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                            {expandedChart.type === 'Bar' && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={expandedChart.data} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2333" horizontal={true} vertical={false} />
                                        <XAxis type="number" domain={[0, 100]} stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis dataKey="tactic" type="category" stroke="#e6edf3" fontSize={14} fontStyle="bold" axisLine={false} tickLine={false} width={150} />
                                        <RechartsTooltip cursor={{ fill: '#ffffff05' }} content={<NeonTooltip />} />
                                        <Bar dataKey="coverage" name="Coverage" radius={[0, 6, 6, 0]} barSize={24}>
                                            {expandedChart.data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="mb-2 relative px-2">
                <div className="absolute left-[-5px] top-0 bottom-0 w-[3px] bg-cyan-neon shadow-[0_0_10px_rgba(0,243,255,0.8)] rounded-r-md"></div>
                <h3 className="text-[15px] font-bold text-white tracking-[0.1em] uppercase mb-0.5">Detection Engineering</h3>
                <p className="text-[10px] text-cyan-neon uppercase tracking-widest font-bold">Model Health, Rule Performance & Explainability</p>
            </div>

            {/* Top KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { title: "True Positive Rate", value: `${currentTPR}%`, desc: "Real attacks detected / total attacks", color: "#00ff9d" },
                    { title: "False Positive Rate", value: `${currentFPR}%`, desc: "Benign events flagged incorrectly", color: "#ff3333" },
                    { title: "Model Confidence", value: `${currentConf}%`, desc: "Average prediction certainty", color: "#00f3ff" },
                    { title: "Detection Latency", value: `${currentLatency} Min`, desc: "Avg. time from occurrence to alert", color: "#c084fc" }
                ].map((kpi, i) => (
                    <div key={i} className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-all">
                        <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 blur-xl" style={{ backgroundColor: kpi.color }} />
                        <div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{kpi.title}</div>
                            <div className="text-2xl font-black tracking-tight" style={{ color: kpi.color, textShadow: `0 0 10px ${kpi.color}40` }}>{kpi.value}</div>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-2">{kpi.desc}</div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Left Column: Flow Charts (Model Health + Latency) */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Model Health Trends */}
                    <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Activity size={15} className="text-[#00ff9d]" />
                                <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">Model Health Trends (30D)</h4>
                            </div>
                            <SharedTooltip
                                title="Model Health"
                                usedFor="Tracks exactly how accurate the AI detection engine is over a full 30-day window."
                                interpret="TPR should consistently remain high (green area). An increasing FPR (red area) indicates the model needs tuning or retraining."
                            />
                        </div>
                        <div className="h-[200px] w-full cursor-pointer transition-transform hover:scale-[1.01]" onDoubleClick={() => setExpandedChart({ type: 'Area', data: HEALTH_DATA })}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={HEALTH_DATA} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTpr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00ff9d" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorFpr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ff3333" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ff3333" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2333" vertical={false} />
                                    <XAxis dataKey="date" stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} interval={5} />
                                    <YAxis stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                                    <RechartsTooltip content={<NeonTooltip />} />
                                    <Area type="monotone" dataKey="tpr" name="True Positive Rate" stroke="#00ff9d" strokeWidth={2} fillOpacity={1} fill="url(#colorTpr)" />
                                    <Area type="monotone" dataKey="fpr" name="False Positive Rate" stroke="#ff3333" strokeWidth={2} fillOpacity={1} fill="url(#colorFpr)" />
                                    <Area type="monotone" dataKey="confidence" name="Avg Confidence" stroke="#00f3ff" strokeWidth={1} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorConf)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bottom Split: Latency & Coverage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Detection Latency */}
                        <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Clock size={15} className="text-[#c084fc]" />
                                    <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">Detection Latency</h4>
                                </div>
                                <SharedTooltip
                                    title="Latency Tracker"
                                    usedFor="Measures the average time difference between when an attack payload enters the environment and when the SOC alert is generated."
                                    interpret="Lower is better. Sharp spikes indicate processing bottlenecks or heavy evasion techniques by attackers."
                                />
                            </div>
                            <div className="h-[150px] w-full cursor-pointer transition-transform hover:scale-[1.02]" onDoubleClick={() => setExpandedChart({ type: 'Line', data: LATENCY_DATA })}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={LATENCY_DATA} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2333" vertical={false} />
                                        <XAxis dataKey="date" stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} interval={4} />
                                        <YAxis stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} domain={[0, 6]} />
                                        <RechartsTooltip content={<NeonTooltip unit=" Min" />} />
                                        <Line type="stepAfter" dataKey="latency" name="Latency" stroke="#c084fc" strokeWidth={2} dot={{ fill: '#c084fc', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#fff' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* MITRE Coverage */}
                        <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Target size={15} className="text-[#00f3ff]" />
                                    <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">MITRE ATT&CK Coverage</h4>
                                </div>
                                <SharedTooltip
                                    title="MITRE Coverage"
                                    usedFor="Displays the percentage of MITRE ATT&CK techniques currently covered by active detection rules."
                                    interpret="Look for lower percentages (like Persistence/Exfiltration) to identify detection blind spots."
                                />
                            </div>
                            <div className="h-[150px] w-full cursor-pointer transition-transform hover:scale-[1.02]" onDoubleClick={() => setExpandedChart({ type: 'Bar', data: COVERAGE_DATA })}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={COVERAGE_DATA} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2333" horizontal={true} vertical={false} />
                                        <XAxis type="number" domain={[0, 100]} hide />
                                        <YAxis dataKey="tactic" type="category" stroke="#8b949e" fontSize={10} axisLine={false} tickLine={false} width={100} />
                                        <RechartsTooltip cursor={{ fill: '#ffffff05' }} content={<NeonTooltip />} />
                                        <Bar dataKey="coverage" name="Coverage" radius={[0, 4, 4, 0]} barSize={12}>
                                            {COVERAGE_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Rule Health & Explainability */}
                <div className="space-y-4">
                    {/* Explainability / Drift */}
                    <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Brain size={15} className="text-[#ffd700]" />
                                <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">Model Explainability & Drift</h4>
                            </div>
                            <SharedTooltip
                                title="Data & Feature Drift"
                                usedFor="Explains which signals the AI is using the most to detect threats (Feature Importance) and whether those signals are shifting (Drift)."
                                interpret="Features with high drift (red text) mean attacker behavior is changing and the model may soon start missing attacks."
                            />
                        </div>

                        <div className="space-y-3">
                            {DRIFT_DATA.map((feature, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[11px] text-gray-300 font-medium">{feature.feature}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500">{feature.type}</span>
                                            <span className="text-[11px] font-bold" style={{ color: Math.abs(feature.drift) > 0.01 ? '#ffd700' : '#4a5568' }}>
                                                {feature.drift > 0 ? '+' : ''}{(feature.drift * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#1a2333] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${feature.weight * 100 * 3}%` }}
                                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: feature.color, boxShadow: `0 0 8px ${feature.color}60` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rule Performance / Health */}
                    <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-5 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Shield size={15} className="text-[#00f3ff]" />
                                <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">Rule Health Monitoring</h4>
                            </div>
                            <SharedTooltip
                                title="Rule Health"
                                usedFor="Tracks exactly how many times each detection signature fired over the last 24h."
                                interpret="Noisy rules may cause alert fatigue and should be tuned. 'Never Triggered' rules may be broken or obsolete."
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-2 max-h-[220px]">
                            {RULES_DATA.map((rule, idx) => {
                                let statusColor = '#00ff9d';
                                if (rule.status === 'Noisy') statusColor = '#ffd700';
                                if (rule.status === 'Never Triggered') statusColor = '#ff3333';

                                return (
                                    <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-lg hover:bg-black/40 transition-colors">
                                        <div className="flex justify-between items-start mb-1.5">
                                            <div className="text-[11px] font-bold text-white tracking-wide">{rule.name}</div>
                                            <div className="text-[10px] font-mono text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">{rule.id}</div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                                                <span className="text-[10px] uppercase font-bold" style={{ color: statusColor }}>
                                                    {rule.health}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                <span className="text-gray-200 font-bold mr-1">{rule.triggered.toLocaleString()}</span> fires / 24h
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetectionEngineering;
