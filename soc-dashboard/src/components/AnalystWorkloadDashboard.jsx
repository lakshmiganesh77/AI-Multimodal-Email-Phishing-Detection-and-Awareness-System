import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertTriangle, Clock, TrendingUp, Activity, User, Target, CheckCircle, Shield, XCircle, Zap, RefreshCw } from 'lucide-react';
import CustomTooltip from './CustomTooltip';

// --- DATA ---
const INITIAL_ANALYSTS = [
    {
        id: 'a1', name: 'Sarah K.', role: 'Senior Analyst', avatar: 'SK',
        activeCases: 6, criticalCases: 2, avgMTTR: 28,
        tp: 42, fp: 3, accuracy: 93, burnout: 'HIGH',
        capacity: 88, color: '#ff3333'
    },
    {
        id: 'a2', name: 'James R.', role: 'Analyst L2', avatar: 'JR',
        activeCases: 4, criticalCases: 1, avgMTTR: 42,
        tp: 28, fp: 12, accuracy: 70, burnout: 'MODERATE',
        capacity: 55, color: '#ffd700'
    },
    {
        id: 'a3', name: 'Priya M.', role: 'Analyst L1', avatar: 'PM',
        activeCases: 8, criticalCases: 3, avgMTTR: 61,
        tp: 14, fp: 6, accuracy: 70, burnout: 'HIGH',
        capacity: 95, color: '#ff3333'
    },
    {
        id: 'a4', name: 'Carlos D.', role: 'Analyst L1', avatar: 'CD',
        activeCases: 2, criticalCases: 0, avgMTTR: 19,
        tp: 31, fp: 2, accuracy: 94, burnout: 'LOW',
        capacity: 30, color: '#00ff9d'
    },
    {
        id: 'a5', name: 'Emma W.', role: 'Senior Analyst', avatar: 'EW',
        activeCases: 5, criticalCases: 2, avgMTTR: 35,
        tp: 55, fp: 4, accuracy: 93, burnout: 'MODERATE',
        capacity: 65, color: '#ffd700'
    },
];

const WAIT_QUEUE = [
    { id: 'q1', type: 'Phishing Attempt', count: 3, oldest: '18m', color: '#00f3ff' },
    { id: 'q2', type: 'Malware Delivery', count: 2, oldest: '12m', color: '#c084fc' },
    { id: 'q3', type: 'Suspicious Login', count: 1, oldest: '4m', color: '#ffd700' },
];

const getCapacityColor = (capacity) => {
    if (capacity >= 85) return '#ff3333';
    if (capacity >= 65) return '#ffd700';
    return '#00ff9d';
};

const getBurnoutColor = (burnout) => {
    if (burnout === 'HIGH') return '#ff3333';
    if (burnout === 'MODERATE') return '#ffd700';
    return '#00ff9d';
};

const AnalystWorkloadDashboard = () => {
    const [analysts, setAnalysts] = useState(INITIAL_ANALYSTS);
    const [selectedAnalyst, setSelectedAnalyst] = useState(null);
    const [sorted, setSorted] = useState('capacity');
    const [autoBalancingLog, setAutoBalancingLog] = useState([
        { id: 1, msg: "System initializing auto-balance routing...", time: "Just now", type: "info" }
    ]);

    // Simulated Auto-Balancing
    useEffect(() => {
        const interval = setInterval(() => {
            const types = ['Phishing Alert', 'Fraud Attempt', 'Ransomware Indicator'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            const isCritical = randomType === 'Ransomware Indicator';

            setAnalysts(currentAnalysts => {
                let targetAnalyst = null;

                if (isCritical) {
                    // Assign to Senior with lowest capacity
                    const seniors = currentAnalysts.filter(a => a.role.includes('Senior'));
                    targetAnalyst = seniors.reduce((prev, curr) => (prev.capacity < curr.capacity) ? prev : curr);
                } else {
                    // Assign to lowest workload
                    targetAnalyst = currentAnalysts.reduce((prev, curr) => (prev.capacity < curr.capacity) ? prev : curr);
                }

                const msg = isCritical
                    ? `Critical ${randomType} arrival. Auto-assigning to Senior: ${targetAnalyst.name}`
                    : `New ${randomType} arrival. Routing to lowest workload: ${targetAnalyst.name}`;

                setAutoBalancingLog(prev => [{ id: Date.now(), msg, time: "Just now", type: isCritical ? "critical" : "normal" }, ...prev].slice(0, 4));

                return currentAnalysts.map(a => {
                    if (a.id === targetAnalyst.id) {
                        return {
                            ...a,
                            activeCases: a.activeCases + 1,
                            capacity: Math.min(a.capacity + 8, 100),
                            criticalCases: isCritical ? a.criticalCases + 1 : a.criticalCases
                        };
                    }
                    return a;
                });
            });

        }, 8000); // Route a new alert every 8 seconds

        return () => clearInterval(interval);
    }, []);

    const totalAlerts = analysts.reduce((s, a) => s + a.activeCases, 0);
    const totalQueue = WAIT_QUEUE.reduce((s, q) => s + q.count, 0);
    const teamAvgMTTR = Math.round(analysts.reduce((s, a) => s + a.avgMTTR, 0) / analysts.length);
    const overloaded = analysts.filter(a => a.capacity >= 85).length;

    const sortedAnalysts = [...analysts].sort((a, b) => {
        if (sorted === 'capacity') return b.capacity - a.capacity;
        if (sorted === 'accuracy') return b.accuracy - a.accuracy;
        if (sorted === 'mttr') return b.avgMTTR - a.avgMTTR;
        return 0;
    });

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="mb-2 relative px-2 flex justify-between items-end">
                <div>
                    <div className="absolute left-[-5px] top-0 bottom-0 w-[3px] bg-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.8)] rounded-r-md"></div>
                    <h3 className="text-[15px] font-bold text-white tracking-[0.1em] uppercase mb-0.5 flex items-center gap-2">
                        Analyst Operations
                        <CustomTooltip
                            title="Analyst Ops & Efficiency"
                            usedFor="Monitor live SOC workload, case aging, queue sizes, and analyst burnout."
                            interpret="Watch the Workload Auto-Balancing log to see how the platform automatically routes alerts based on current capacity and severity."
                        />
                    </h3>
                    <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">Workload, Efficiency & Auto-Balancing</p>
                </div>
            </div>

            {/* Top Global Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-4 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Cases</div>
                        <div className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{totalAlerts}</div>
                    </div>
                    <Activity size={24} className="text-gray-600 opacity-50" />
                </div>
                <div className="bg-[#121926]/80 backdrop-blur-md border border-[rgba(255,51,51,0.2)] rounded-xl p-4 flex justify-between items-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#ff3333] shadow-[0_0_10px_rgba(255,51,51,0.8)]" />
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Oldest Open Case</div>
                        <div className="text-2xl font-black text-[#ff3333] drop-shadow-[0_0_8px_rgba(255,51,51,0.4)]">2 hours</div>
                        <div className="text-[10px] text-gray-500 mt-1">4 Cases {'>'} 1 hour</div>
                    </div>
                    <Clock size={24} className="text-[#ff3333] opacity-30 group-hover:opacity-70 transition-all" />
                </div>
                <div className="bg-[#121926]/80 backdrop-blur-md border border-[rgba(255,215,0,0.2)] rounded-xl p-4 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Team Avg MTTR</div>
                        <div className="text-2xl font-black text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]">{teamAvgMTTR}m</div>
                    </div>
                    <Target size={24} className="text-[#ffd700] opacity-30" />
                </div>
                <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-4 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Burnout Risk</div>
                        <div className="text-2xl font-black text-white">
                            <span className={overloaded > 0 ? "text-[#ff3333]" : "text-[#00ff9d]"}>{overloaded} High</span>
                        </div>
                    </div>
                    <TrendingUp size={24} className="text-gray-600 opacity-50" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Left Column: Queue & Auto-Balancing */}
                <div className="xl:col-span-1 flex flex-col gap-4">

                    {/* Alert Queue */}
                    <div className="bg-[#121926]/80 backdrop-blur-md border border-[rgba(0,243,255,0.2)] rounded-xl p-5 shadow-[0_0_15px_rgba(0,243,255,0.05)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <RefreshCw size={64} className="animate-spin-slow" />
                        </div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h4 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Users size={14} className="text-[#00f3ff]" />
                                Triage Wait Queue
                            </h4>
                            <div className="text-xs font-black font-mono text-[#00f3ff] bg-[#00f3ff]/10 px-2 py-0.5 rounded border border-[#00f3ff]/30">
                                {totalQueue} WAITING
                            </div>
                        </div>

                        <div className="space-y-2 relative z-10">
                            {WAIT_QUEUE.map(q => (
                                <div key={q.id} className="bg-black/40 border border-white/5 rounded p-2 flex justify-between items-center">
                                    <div>
                                        <div className="text-[11px] font-bold text-gray-200">{q.type}</div>
                                        <div className="text-[9px] text-gray-500 font-mono">Oldest: {q.oldest}</div>
                                    </div>
                                    <div className="text-[13px] font-black font-mono" style={{ color: q.color }}>
                                        {q.count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Auto Balancing Log */}
                    <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-5 flex-1 flex flex-col outline outline-1 outline-[#00ff9d]/20 shadow-[0_0_20px_rgba(0,255,157,0.05)]">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Zap size={14} className="text-[#00ff9d]" />
                                Workload Auto-Balancing
                            </h4>
                        </div>

                        <div className="flex-1 bg-black/50 border border-white/5 rounded-lg p-3 overflow-hidden">
                            <AnimatePresence>
                                {autoBalancingLog.map(log => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -10, height: 0 }}
                                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="mb-2 last:mb-0"
                                    >
                                        <div className="text-[9px] text-gray-500 font-mono mb-0.5">{log.time}</div>
                                        <div className={`text-[11px] p-2 rounded border leading-snug 
                                            ${log.type === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-200' :
                                                log.type === 'info' ? 'bg-gray-800 border-gray-700 text-gray-400' :
                                                    'bg-[#00ff9d]/5 border-[#00ff9d]/20 text-[#00ff9d]'}`}
                                        >
                                            {log.msg}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right Column: Analyst Roster & Efficiency */}
                <div className="xl:col-span-2 flex flex-col gap-3">
                    {/* Sort Controls */}
                    <div className="flex justify-between items-center px-1">
                        <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">Live Analyst Activity</h4>
                        <div className="flex gap-1.5 items-center">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sort:</span>
                            {[['capacity', 'Workload'], ['accuracy', 'Accuracy'], ['mttr', 'MTTR']].map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => setSorted(key)}
                                    className={`px-3 py-1 rounded border text-[9px] font-bold tracking-wider uppercase transition-all
                                        ${sorted === key
                                            ? 'bg-[#00f3ff]/20 text-[#00f3ff] border-[#00f3ff]/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]'
                                            : 'bg-black/30 text-gray-500 border-white/5 hover:bg-white/5 hover:text-gray-300'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Analyst Cards */}
                    <div className="space-y-3">
                        {sortedAnalysts.map((analyst, i) => {
                            const capColor = getCapacityColor(analyst.capacity);
                            const burnColor = getBurnoutColor(analyst.burnout);
                            const isSelected = selectedAnalyst === analyst.id;

                            return (
                                <motion.div
                                    key={analyst.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    onClick={() => setSelectedAnalyst(isSelected ? null : analyst.id)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border relative overflow-hidden group
                                        ${isSelected ? 'bg-black/60 shadow-xl' : 'bg-[#121926]/80 hover:bg-[#1a2332]/80'}
                                    `}
                                    style={{ borderColor: isSelected ? `${capColor}60` : 'rgba(255,255,255,0.05)' }}
                                >
                                    {/* Workload background hint */}
                                    <div className="absolute right-0 top-0 bottom-0 w-32 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10"
                                        style={{ background: `linear-gradient(to right, transparent, ${capColor})` }}
                                    />

                                    <div className="flex items-center justify-between relative z-10">

                                        {/* Left: Avatar & Identity */}
                                        <div className="flex items-center gap-4 w-1/4">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold font-mono shadow-lg relative"
                                                style={{ backgroundColor: capColor + '20', border: `2px solid ${capColor}50`, color: capColor }}>
                                                {analyst.avatar}
                                                {analyst.burnout === 'HIGH' && (
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#121926] animate-pulse" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-bold text-white">{analyst.name}</div>
                                                <div className="text-[10px] text-gray-500">{analyst.role}</div>
                                            </div>
                                        </div>

                                        {/* Middle: Capacity Bar */}
                                        <div className="flex-1 px-4 max-w-[200px]">
                                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                                <span>Workload</span>
                                                <span style={{ color: capColor }}>{analyst.capacity}%</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${analyst.capacity}%` }}
                                                    transition={{ type: "spring", stiffness: 50 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: capColor, boxShadow: `0 0 10px ${capColor}80` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Right: Primary Stats (Cases / Accuracy) */}
                                        <div className="flex items-center gap-6 w-1/3 justify-end text-center">
                                            <div>
                                                <div className="text-[14px] font-black font-mono text-white">{analyst.activeCases}</div>
                                                <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Cases</div>
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-black font-mono" style={{ color: analyst.accuracy >= 90 ? '#00ff9d' : '#ffd700' }}>
                                                    {analyst.accuracy}%
                                                </div>
                                                <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Accuracy</div>
                                            </div>
                                            <div className="min-w-[60px]">
                                                <span className="px-2 py-1 rounded text-[9px] font-bold tracking-wider border"
                                                    style={{ backgroundColor: burnColor + '10', color: burnColor, borderColor: burnColor + '30' }}>
                                                    {analyst.burnout} RISK
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                className="pt-4 border-t border-white/5 grid grid-cols-4 gap-4 relative z-10"
                                            >
                                                {/* Efficiency Deep Dive */}
                                                <div className="col-span-2 bg-black/40 rounded border border-white/5 p-3 flex justify-around">
                                                    <div className="text-center">
                                                        <div className="text-[16px] font-bold text-[#00ff9d]">{analyst.tp}</div>
                                                        <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">True Pos</div>
                                                    </div>
                                                    <div className="w-px bg-white/10" />
                                                    <div className="text-center">
                                                        <div className="text-[16px] font-bold text-[#ff3333]">{analyst.fp}</div>
                                                        <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">False Pos</div>
                                                    </div>
                                                    <div className="w-px bg-white/10" />
                                                    <div className="text-center">
                                                        <div className="text-[16px] font-bold text-[#ffd700]">{analyst.avgMTTR}m</div>
                                                        <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Avg MTTR</div>
                                                    </div>
                                                </div>

                                                {/* Alerts assigned */}
                                                <div className="col-span-2 flex flex-col justify-center">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Burnout Context</div>
                                                    <p className="text-[11px] text-gray-400">
                                                        {analyst.burnout === 'HIGH'
                                                            ? `Analyst has sustained >85% capacity for over 6 hours. Auto-balancing is throttling assignments.`
                                                            : `Analyst is within normal operational parameters. Efficiency remains high.`}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalystWorkloadDashboard;
