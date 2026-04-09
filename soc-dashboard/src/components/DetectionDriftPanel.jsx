import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingDown, TrendingUp, Brain, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import SharedTooltip from './CustomTooltip';

// Simulated 30-day model health data
const generateDriftData = () => {
    const data = [];
    let confidence = 91;
    let fpRate = 12;
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        confidence = Math.max(78, Math.min(97, confidence + (Math.random() - 0.52) * 2));
        fpRate = Math.max(5, Math.min(22, fpRate + (Math.random() - 0.48) * 1.5));
        data.push({
            date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            confidence: parseFloat(confidence.toFixed(1)),
            fpRate: parseFloat(fpRate.toFixed(1)),
        });
    }
    return data;
};

const DRIFT_DATA = generateDriftData();

const FEATURE_WEIGHTS = [
    { feature: 'Urgency Keywords', weight: 0.23, drift: -0.02, color: '#ff3333' },
    { feature: 'Sender Domain Age', weight: 0.19, drift: +0.01, color: '#00f3ff' },
    { feature: 'URL Mismatch', weight: 0.17, drift: 0, color: '#ffd700' },
    { feature: 'Auth Header Fails', weight: 0.15, drift: -0.03, color: '#ff6b6b' },
    { feature: 'Financial Pressure Score', weight: 0.14, drift: +0.02, color: '#00ff9d' },
    { feature: 'Brand Lookalike', weight: 0.12, drift: -0.01, color: '#c084fc' },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0d1117] border border-[rgba(0,243,255,0.2)] rounded-lg px-3.5 py-2.5 text-xs">
            <div className="text-[#4a5568] mb-1.5">{label}</div>
            {payload.map((p, i) => (
                <div key={i} className="font-semibold" style={{ color: p.color }}>{p.name}: {p.value}%</div>
            ))}
        </div>
    );
};

const DetectionDriftPanel = () => {
    const [activeMetric, setActiveMetric] = useState('confidence');
    const currentConf = DRIFT_DATA[DRIFT_DATA.length - 1].confidence;
    const prevConf = DRIFT_DATA[DRIFT_DATA.length - 8].confidence;
    const confTrend = parseFloat((currentConf - prevConf).toFixed(1));

    const currentFP = DRIFT_DATA[DRIFT_DATA.length - 1].fpRate;
    const totalDrift = FEATURE_WEIGHTS.filter(f => Math.abs(f.drift) >= 0.02).length;

    return (
        <div className="bg-[rgba(20,30,40,0.6)] rounded-xl border border-[rgba(192,132,252,0.2)] overflow-hidden backdrop-blur-[10px]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Brain size={16} color="#c084fc" />
                    <h3 className="m-0 text-[13px] font-bold uppercase tracking-[1px] text-[var(--text-primary)]">
                        Detection Drift Monitoring
                    </h3>
                    <SharedTooltip
                        title="Detection Drift Monitoring"
                        usedFor="Tracks the AI model's Confidence and False Positive (FP) rates over a 30-day period, alongside feature weight changes."
                        interpret="A declining confidence trend or rising FP rate indicates the model is degrading (drifting). The feature weight section shows exactly which signals are changing."
                    />
                </div>
                {totalDrift > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.3)]">
                        <AlertTriangle size={11} color="#ffd700" />
                        <span className="text-[11px] text-[#ffd700] font-bold">
                            {totalDrift} feature{totalDrift > 1 ? 's' : ''} drifting
                        </span>
                    </div>
                )}
            </div>

            <div className="p-5">
                {/* KPIs */}
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                    {[
                        {
                            label: 'Model Confidence', value: `${currentConf}%`,
                            trend: confTrend, color: currentConf > 88 ? '#00ff9d' : currentConf > 80 ? '#ffd700' : '#ff3333',
                        },
                        {
                            label: 'False Positive Rate', value: `${currentFP}%`,
                            color: currentFP < 10 ? '#00ff9d' : currentFP < 15 ? '#ffd700' : '#ff3333',
                        },
                        {
                            label: 'Feature Drift', value: `${totalDrift} features`,
                            color: totalDrift === 0 ? '#00ff9d' : totalDrift <= 2 ? '#ffd700' : '#ff3333',
                        },
                    ].map((kpi, i) => (
                        <div key={i} className="p-3 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)] text-center">
                            <div className="text-[9px] text-[#4a5568] uppercase tracking-[0.5px] mb-1.5">{kpi.label}</div>
                            <div className="text-xl font-extrabold font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
                            {kpi.trend !== undefined && (
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    {kpi.trend >= 0 ? <TrendingUp size={11} color="#00ff9d" /> : <TrendingDown size={11} color="#ff3333" />}
                                    <span className="text-[10px]" style={{ color: kpi.trend >= 0 ? '#00ff9d' : '#ff3333' }}>
                                        {kpi.trend > 0 ? '+' : ''}{kpi.trend}% (7d)
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Metric Selector */}
                <div className="flex gap-1 mb-3 bg-[rgba(0,0,0,0.3)] rounded-md p-0.5 w-fit">
                    {[['confidence', 'Confidence Trend'], ['fpRate', 'FP Rate Trend']].map(([key, label]) => (
                        <button key={key} onClick={() => setActiveMetric(key)}
                            className={`px-3.5 py-1.5 rounded-[4px] text-[11px] font-semibold border-none cursor-pointer transition-colors ${activeMetric === key ? 'bg-[rgba(192,132,252,0.15)] text-[#c084fc]' : 'bg-transparent text-[#4a5568]'}`}
                        >{label}</button>
                    ))}
                </div>

                {/* Line Chart */}
                <div className="h-[180px] mb-5">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={DRIFT_DATA}>
                            <defs>
                                <linearGradient id="gradConf" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradFP" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff3333" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ff3333" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" tick={{ fill: '#4a5568', fontSize: 9 }} interval={6} />
                            <YAxis tick={{ fill: '#4a5568', fontSize: 9 }} domain={activeMetric === 'confidence' ? [75, 100] : [0, 30]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey={activeMetric}
                                stroke={activeMetric === 'confidence' ? '#c084fc' : '#ff3333'}
                                fill={activeMetric === 'confidence' ? 'url(#gradConf)' : 'url(#gradFP)'}
                                strokeWidth={2}
                                name={activeMetric === 'confidence' ? 'Confidence' : 'FP Rate'}
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Feature Weights */}
                <div>
                    <div className="text-[10px] text-[#4a5568] uppercase tracking-[1px] mb-2.5">
                        Feature Weight Drift (7-day)
                    </div>
                    <div className="flex flex-col gap-2">
                        {FEATURE_WEIGHTS.map((f, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-[11px] text-[var(--text-secondary)]">{f.feature}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-mono text-[var(--text-primary)]">{(f.weight * 100).toFixed(0)}%</span>
                                            {f.drift !== 0 && (
                                                <span className="text-[10px] font-mono" style={{ color: Math.abs(f.drift) >= 0.02 ? '#ffd700' : '#4a5568' }}>
                                                    {f.drift > 0 ? '+' : ''}{(f.drift * 100).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-1 bg-[rgba(255,255,255,0.05)] rounded-[2px] overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${f.weight * 100 * 4}%` }}
                                            transition={{ duration: 0.5, delay: i * 0.06 }}
                                            className="h-full rounded-[2px]"
                                            style={{ backgroundColor: f.color }}
                                        />
                                    </div>
                                </div>
                                {Math.abs(f.drift) >= 0.02 && <AlertTriangle size={12} color="#ffd700" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetectionDriftPanel;
