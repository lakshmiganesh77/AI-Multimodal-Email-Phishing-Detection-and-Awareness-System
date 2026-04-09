import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle, AlertTriangle, Clock, Zap, Shield, Target, Activity, FileText, XCircle, Search, Server } from 'lucide-react';
import SharedTooltip from './CustomTooltip';

// --- DATA ---
const SIMULATIONS = [
    {
        id: 'sim_phishing',
        name: 'Credential Phishing',
        desc: 'Spear-phishing email targeting finance team with lookalike domain',
        type: 'T1566.001',
        icon: MailIcon,
        color: '#00f3ff',
        expectedResult: true,
        latencyTarget: 2, // seconds
        rule: 'PHISH-URL-MISMATCH-01'
    },
    {
        id: 'sim_bec',
        name: 'BEC Wire Fraud',
        desc: 'CEO impersonation targeting CFO for urgent wire transfer',
        type: 'T1566.002',
        icon: UserIcon,
        color: '#ff6b6b',
        expectedResult: true,
        latencyTarget: 5,
        rule: 'BEC-EXEC-SPOOF-03'
    },
    {
        id: 'sim_malware',
        name: 'Malware Delivery',
        desc: 'PDF attachment with embedded macro dropper',
        type: 'T1566.001',
        icon: FileIcon,
        color: '#c084fc',
        expectedResult: false, // Designed to fail to show FN
        latencyTarget: null,
        rule: 'NONE'
    },
    {
        id: 'sim_invoice',
        name: 'Invoice Fraud',
        desc: 'Fake invoice from lookalike vendor domain targeting AP team',
        type: 'T1566.002',
        icon: FileTextIcon,
        color: '#ffd700',
        expectedResult: true,
        latencyTarget: 3,
        rule: 'FRAUD-INVOICE-KEYWORD-02'
    },
];

const MITRE_COVERAGE = [
    { tactic: 'Phishing (T1566)', status: 'Covered' },
    { tactic: 'Credential Harvesting', status: 'Covered' },
    { tactic: 'Malware Delivery', status: 'Covered' },
    { tactic: 'Command & Control', status: 'Missing' },
    { tactic: 'Lateral Movement', status: 'Partial' },
    { tactic: 'Exfiltration', status: 'Missing' }
];

const PHASES = [
    { label: 'Attack Execution', icon: Zap, color: '#ff3333' },
    { label: 'Detection Engine', icon: Server, color: '#c084fc' },
    { label: 'Alert Generated', icon: AlertTriangle, color: '#ffd700' },
    { label: 'Case Opened', icon: Shield, color: '#00ff9d' }
];

// Custom local icons for layout
function MailIcon(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>; }
function UserIcon(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>; }
function FileIcon(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>; }
function FileTextIcon(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>; }

const RedTeamSimulator = () => {
    const [runningSim, setRunningSim] = useState(null); // ID of running sim
    const [activePhase, setActivePhase] = useState(-1);
    const [results, setResults] = useState({}); // Stores historical runs
    const [currentResult, setCurrentResult] = useState(null); // The one actively being viewed

    // Mock initial stats
    const totalSims = 48 + Object.keys(results).length;
    const detected = 41 + Object.values(results).filter(r => r.detected).length;
    const missed = totalSims - detected;
    const successRate = Math.round((detected / totalSims) * 100) || 0;

    const runSimulation = async (sim) => {
        if (runningSim) return;
        setRunningSim(sim.id);
        setCurrentResult(null);
        setActivePhase(0);

        // Step through pipeline visually
        for (let i = 0; i < PHASES.length; i++) {
            setActivePhase(i);
            // If it's expected to fail, stop at Detection Engine
            if (!sim.expectedResult && i === 1) {
                await new Promise(r => setTimeout(r, 1500));
                break;
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        // Generate result
        const now = new Date();
        const execTimeStr = now.toLocaleTimeString('en-US', { hour12: false });
        let detectTimeStr = '--:--:--';
        let latencyCalc = null;

        if (sim.expectedResult) {
            const later = new Date(now.getTime() + (sim.latencyTarget * 1000));
            detectTimeStr = later.toLocaleTimeString('en-US', { hour12: false });
            latencyCalc = sim.latencyTarget;
            setActivePhase(4); // Fully complete
        } else {
            setActivePhase(-1); // Stop pipeline glow
        }

        const newResult = {
            id: sim.id,
            name: sim.name,
            detected: sim.expectedResult,
            execTime: execTimeStr,
            detectTime: detectTimeStr,
            latency: latencyCalc,
            rule: sim.rule,
            caseId: sim.expectedResult ? `INV-${Math.floor(Math.random() * 9000) + 1000}` : 'NONE'
        };

        setResults(prev => ({ ...prev, [sim.id]: newResult }));
        setCurrentResult(newResult);
        setRunningSim(null);
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="mb-2 relative px-2 flex justify-between items-end">
                <div>
                    <div className="absolute left-[-5px] top-0 bottom-0 w-[3px] bg-red-500 shadow-[0_0_10px_rgba(255,51,51,0.8)] rounded-r-md"></div>
                    <h3 className="text-[15px] font-bold text-white tracking-[0.1em] uppercase mb-0.5">Red Team Simulator</h3>
                    <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Adversary Emulation & Detection Validation</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <div className="text-2xl font-black text-[#00ff9d] drop-shadow-[0_0_8px_rgba(0,255,157,0.4)]">{successRate}%</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Success Rate</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Left Column: Attack Library & Alert Pipeline */}
                <div className="xl:col-span-2 space-y-4 flex flex-col">

                    {/* Attack Library */}
                    <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-5 flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Target size={14} className="text-[#ff3333]" />
                                Attack Library
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {SIMULATIONS.map(sim => {
                                const Icon = sim.icon;
                                const isRunning = runningSim === sim.id;

                                return (
                                    <div key={sim.id} className="bg-black/20 border border-white/5 rounded-lg p-4 relative overflow-hidden group hover:bg-black/40 transition-all">
                                        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10 blur-xl transition-all group-hover:opacity-20" style={{ backgroundColor: sim.color }} />

                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-md bg-black/40 flex items-center justify-center border border-white/10" style={{ borderColor: `${sim.color}40`, color: sim.color }}>
                                                    <Icon size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-[12px] font-bold text-white">{sim.name}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono">{sim.type}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => runSimulation(sim)}
                                                disabled={!!runningSim}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all
                                                    ${isRunning
                                                        ? 'bg-red-500/20 text-red-500 border border-red-500/50 cursor-not-allowed'
                                                        : 'bg-[#ff3333] hover:bg-[#ff3333]/80 text-white border border-transparent shadow-[0_0_10px_rgba(255,51,51,0.3)]'}`}
                                            >
                                                {isRunning ? (
                                                    <><Activity size={12} className="animate-spin" /> Running</>
                                                ) : (
                                                    <><Play size={12} fill="currentColor" /> Launch</>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">{sim.desc}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Alert Pipeline Visualizer */}
                    <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Activity size={14} className="text-[#00f3ff]" />
                                Live Alert Pipeline
                            </h4>
                            <SharedTooltip
                                title="Alert Pipeline Flow"
                                usedFor="Visualizes the exact path a threat takes through the PhishGuard infrastructure during a Red Team simulation."
                                interpret="If the flow stops at 'Detection Engine', it denotes a False Negative (missed attack). A full flow to 'Case Opened' represents a True Positive."
                            />
                        </div>

                        <div className="flex items-center justify-between relative px-4">
                            {/* Connecting Line */}
                            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gray-800 -translate-y-1/2 z-0" />

                            {/* Active Line Progress overlay */}
                            {activePhase >= 0 && (
                                <motion.div
                                    className="absolute top-1/2 left-8 h-0.5 bg-cyan-400 -translate-y-1/2 z-0 shadow-[0_0_8px_var(--cyan)]"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${Math.min((activePhase / (PHASES.length - 1)) * 100, 100)}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            )}

                            {/* Nodes */}
                            {PHASES.map((phase, idx) => {
                                const isActive = idx === activePhase;
                                const isPassed = idx < activePhase || activePhase === 4; // 4 means all done
                                const pColor = isPassed || isActive ? phase.color : '#374151'; // gray-700
                                const Icon = phase.icon;

                                return (
                                    <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                                        <motion.div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                                ${isActive ? 'bg-[#0a0e17] scale-110' : 'bg-[#121926]'}
                                            `}
                                            style={{
                                                borderColor: pColor,
                                                boxShadow: isActive || isPassed ? `0 0 15px ${pColor}40` : 'none',
                                                color: pColor
                                            }}
                                            animate={isActive ? { y: [0, -5, 0] } : {}}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        >
                                            <Icon size={18} />
                                        </motion.div>
                                        <div className={`text-[10px] font-bold uppercase tracking-wider text-center w-24
                                            ${isActive || isPassed ? 'text-white' : 'text-gray-600'}
                                        `}>
                                            {phase.label}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Outcomes & Metrics */}
                <div className="space-y-4 flex flex-col">

                    {/* Detailed Simulation Results */}
                    <div className="bg-[#121926]/80 backdrop-blur-md border border-[rgba(0,243,255,0.2)] shadow-[0_0_20px_rgba(0,243,255,0.05)] rounded-xl p-5 flex-1 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent opacity-50" />

                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Search size={14} className="text-[#00f3ff]" />
                                Simulation Output
                            </h4>
                        </div>

                        <div className="flex-1 bg-black/40 rounded-lg border border-white/5 p-4 font-mono text-[11px] overflow-y-auto">
                            {!currentResult ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 opacity-50">
                                    <TerminalIcon size={24} />
                                    <span>Awaiting Simulation Payload...</span>
                                </div>
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                    <div className="text-gray-400">{'>>'} INITIALIZING VALIDATION...</div>
                                    <div className="text-white">Attack Vector: <span className="text-cyan-300">{currentResult.name}</span></div>

                                    <div className="h-px bg-white/10 w-full my-2" />

                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Detection Result:</span>
                                        <span className={`font-bold ${currentResult.detected ? 'text-[#00ff9d]' : 'text-[#ff3333]'}`}>
                                            {currentResult.detected ? 'TRUE POSITIVE' : 'FALSE NEGATIVE'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Alert Triggered:</span>
                                        <span className={currentResult.detected ? 'text-white' : 'text-gray-600'}>
                                            {currentResult.detected ? 'YES' : 'NO'}
                                        </span>
                                    </div>

                                    <div className="h-px bg-white/10 w-full my-2" />

                                    <div className="text-gray-400">{'>>'} TRACE LATENCY</div>
                                    <div className="flex justify-between text-gray-300">
                                        <span>Exec: <span className="text-white">{currentResult.execTime}</span></span>
                                        <span>Detect: <span className="text-white">{currentResult.detectTime}</span></span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Calc Latency:</span>
                                        <span className={currentResult.latency ? 'text-[#ffd700]' : 'text-gray-500'}>
                                            {currentResult.latency ? `${currentResult.latency} seconds` : 'Timeout (N/A)'}
                                        </span>
                                    </div>

                                    <div className="h-px bg-white/10 w-full my-2" />

                                    <div className="text-gray-400">{'>>'} RULE MAPPING</div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Triggered Rule:</span>
                                        <span className={currentResult.rule !== 'NONE' ? 'text-[#c084fc]' : 'text-red-500'}>
                                            {currentResult.rule}
                                        </span>
                                    </div>
                                    {currentResult.detected && (
                                        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded text-center text-green-400 font-sans tracking-wide">
                                            Case {currentResult.caseId} Opened
                                        </div>
                                    )}
                                    {!currentResult.detected && (
                                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-center text-red-500 font-sans tracking-wide">
                                            Bypass Successful - Defense Failed
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* MITRE Coverage Map */}
                    <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Shield size={14} className="text-[#c084fc]" />
                                MITRE ATT&CK Map
                            </h4>
                            <div className="text-[10px] text-[#c084fc] font-bold font-mono bg-[#c084fc]/10 px-2 py-0.5 rounded">
                                62% COVERED
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            {MITRE_COVERAGE.map((item, idx) => {
                                const isCovered = item.status === 'Covered';
                                const isPartial = item.status === 'Partial';

                                return (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-black/20 rounded border border-white/5 text-[11px]">
                                        <span className="text-gray-300 font-medium">{item.tactic}</span>
                                        <div className="flex items-center gap-1.5 font-bold tracking-wider" style={{
                                            color: isCovered ? '#00ff9d' : isPartial ? '#ffd700' : '#ff3333'
                                        }}>
                                            {isCovered ? <CheckCircle size={12} /> : isPartial ? <AlertTriangle size={12} /> : <XCircle size={12} />}
                                            {isCovered ? '✓ Covered' : isPartial ? '! Partial' : '✗ Missing'}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>

            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-4 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Simulations Run</div>
                        <div className="text-2xl font-black text-white">{totalSims}</div>
                    </div>
                    <Target size={24} className="text-gray-600 opacity-50" />
                </div>
                <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-4 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Detected (True Positives)</div>
                        <div className="text-2xl font-black text-[#00ff9d]">{detected}</div>
                    </div>
                    <CheckCircle size={24} className="text-[#00ff9d] opacity-50" />
                </div>
                <div className="bg-[#121926]/80 backdrop-blur-md border border-white/5 rounded-xl p-4 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Missed (False Negatives)</div>
                        <div className="text-2xl font-black text-[#ff3333]">{missed}</div>
                    </div>
                    <AlertTriangle size={24} className="text-[#ff3333] opacity-50" />
                </div>
            </div>
        </div>
    );
};

// Quick helper terminal icon
function TerminalIcon(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" x2="20" y1="19" y2="19" /></svg>
}

export default RedTeamSimulator;
