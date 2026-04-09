import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import CustomTooltip from './CustomTooltip';

const MitreMatrix = ({ onExplain }) => {
    const tactics = [
        { name: 'Recon', count: 12, alerts: ['Port Scan', 'Social Profile'] },
        { name: 'Resource Dev', count: 4, alerts: ['Domain Reg'] },
        { name: 'Initial Access', count: 8, alerts: ['Phishing', 'Valid Accounts'], active: true },
        { name: 'Execution', count: 5, alerts: ['PowerShell', 'User Execution'], active: true },
        { name: 'Persistence', count: 2, alerts: ['New User'] },
        { name: 'Priv Esc', count: 0, alerts: [] },
        { name: 'Defense Ev', count: 3, alerts: ['Obfuscation'] },
        { name: 'Cred Access', count: 7, alerts: ['Brute Force'], active: true },
        { name: 'Discovery', count: 1, alerts: [] },
        { name: 'Lat Movement', count: 0, alerts: [] },
        { name: 'Collection', count: 0, alerts: [] },
        { name: 'C2', count: 2, alerts: ['Web Protocols'] },
        { name: 'Exfiltration', count: 0, alerts: [] },
        { name: 'Impact', count: 0, alerts: [] },
    ];

    const getIntensity = (count) => {
        if (count >= 7) return 'rgba(239, 68, 68, 0.4)'; // High - Red
        if (count >= 3) return 'rgba(249, 115, 22, 0.4)';  // Med - Orange
        if (count > 0) return 'rgba(14, 165, 233, 0.2)';  // Low - Blue
        return 'transparent';
    };

    return (
        <div className="card h-full p-5 flex flex-col">
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)] mb-1">
                        <span>MITRE ATT&CK HEATMAP</span>
                        <CustomTooltip
                            title="MITRE ATT&CK Heatmap"
                            usedFor="Visualizes active threats mapped directly to the MITRE ATT&CK framework tactics and techniques."
                            interpret="Darker colors indicate a higher concentration of alerts for a specific tactic. Use this to understand the adversary's current progression through the kill chain."
                        />
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)] m-0">Visualizes active threats across the cyber kill chain.</p>
                </div>
                <div className="badge badge-safe" title="Real-time mapping of alerts to tactics">
                    Live Mapping
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 flex-1">
                {tactics.map((tactic, index) => (
                    <motion.div
                        key={tactic.name}
                        className="flex flex-col items-center justify-center text-center p-2 rounded cursor-help"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                            backgroundColor: getIntensity(tactic.count),
                            border: `1px solid ${tactic.count > 0 ? 'rgba(255,255,255,0.1)' : 'var(--border-subtle)'}`
                        }}
                    >
                        <span className={`text-[10px] font-mono ${tactic.count > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                            {tactic.name}
                        </span>
                        {tactic.count > 0 && (
                            <span className="text-sm font-bold mt-1">
                                {tactic.count}
                            </span>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Top Attack Techniques */}
            <div className="mt-4 border-t border-white/10 pt-3 flex-shrink-0">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Top Attack Techniques</div>
                    <div className="flex flex-col text-right">
                        <span className="text-[9px] text-blue-400 font-mono tracking-wider">LIVE</span>
                        <span className="text-[9px] text-gray-400 tracking-wider">Most Active: <strong className="text-white">Reconnaissance</strong></span>
                    </div>
                </div>
                <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between items-center text-[11px] p-1.5 bg-black/20 rounded border border-white/5">
                        <span className="text-[#ff3333] font-mono font-bold tracking-wider">T1566</span>
                        <span className="text-gray-300">Phishing</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] p-1.5 bg-black/20 rounded border border-white/5">
                        <span className="text-[#ffd700] font-mono font-bold tracking-wider">T1059</span>
                        <span className="text-gray-300">Command Execution</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] p-1.5 bg-black/20 rounded border border-white/5">
                        <span className="text-cyan-400 font-mono font-bold tracking-wider">T1078</span>
                        <span className="text-gray-300">Valid Accounts</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MitreMatrix;
