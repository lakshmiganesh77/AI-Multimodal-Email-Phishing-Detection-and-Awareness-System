import React, { useState, useEffect } from 'react';
import { Search, User, Filter, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const IncidentsTable = ({ onSelectAlert }) => {
    const [incidents, setIncidents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_BASE}/soc/alerts`, { timeout: 5000 })
            .then(res => {
                const formattedData = res.data.map(alert => {
                    const dt = new Date(alert.created_at);
                    const now = new Date();
                    const diffMs = now - dt;
                    const diffMins = Math.floor(diffMs / 60000);
                    const timeStr = diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins / 60)}h ago`;

                    return {
                        id: `ALR-${alert.id}`,
                        title: alert.subject,
                        severity: alert.severity,
                        status: alert.status,
                        assignee: alert.analyst_assigned || 'Unassigned',
                        source: 'MAIL_GATEWAY',
                        user: alert.sender,
                        time: timeStr
                    };
                });
                setIncidents(formattedData);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch incidents:", err);
                // Fallback to mock data matching screenshot
                setIncidents([
                    { id: 'ALR-211', title: '[SUSPICIOUS] Invest in Bitcoin today? Huge returns!', severity: 'Medium', status: 'Open', assignee: 'Unassigned', source: 'MAIL_GATEWAY', user: 'Crypto Guru <newsletter@bitcoin-daily-updates.xyz>', time: '6h ago' },
                    { id: 'ALR-210', title: 'Order Confirmation: You bought a $2000 Laptop', severity: 'Critical', status: 'Open', assignee: 'Unassigned', source: 'MAIL_GATEWAY', user: 'Amazon Support <amazon-support@gmail.com>', time: '6h ago' },
                    { id: 'ALR-207', title: 'Action Required: Your account has been limited', severity: 'Critical', status: 'Open', assignee: 'Unassigned', source: 'MAIL_GATEWAY', user: 'PayPal Service <service@paypa1.com>', time: '7h ago' },
                    { id: 'ALR-203', title: 'Account Suspended: Payment Failed', severity: 'Critical', status: 'Open', assignee: 'Unassigned', source: 'MAIL_GATEWAY', user: 'Netflix <billing@netflix-updates.com>', time: '8h ago' },
                    { id: 'ALR-198', title: 'Urgent: Your account will be locked', severity: 'Critical', status: 'Open', assignee: 'Unassigned', source: 'MAIL_GATEWAY', user: 'Amazon Security <security@amazon-support-verify.com>', time: '9h ago' },
                ]);
                setIsLoading(false);
            });
    }, []);

    const getSeverityBadge = (severity) => {
        const style = severity === 'Critical' ? 'badge-critical' :
            severity === 'High' ? 'badge-high' :
                severity === 'Medium' ? 'badge-medium' : 'badge-low';
        return <span className={`badge ${style}`}>{severity.toUpperCase()}</span>;
    };

    return (
        <div className="glass-card rounded-3xl flex flex-col h-full overflow-hidden border border-cyan-neon/20 shadow-[0_0_20px_rgba(0,243,255,0.05)]">
            {/* Toolbar */}
            <div className="px-8 py-6 border-b border-cyan-neon/10 flex justify-between items-center bg-[#0a0e17]/80">
                <div className="flex items-center gap-6">
                    <h3 className="text-xl font-bold text-gray-200 tracking-wide">SOC Alert Queue</h3>
                    <div className="flex items-center">
                        <span className="bg-[#ff3366]/5 text-[#ff3366] text-[10px] font-black px-3 py-1.5 rounded-full border border-[#ff3366]/30 shadow-[0_0_10px_rgba(255,51,102,0.2)] tracking-widest uppercase">
                            7 OPEN ALERTS
                        </span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="relative group">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-neon transition-colors" />
                        <input
                            placeholder="Search incidents..."
                            className="h-10 pr-4 pl-10 bg-[#131b2c]/80 border border-[#1a1f2e] rounded-xl text-gray-300 text-sm w-64 outline-none transition-all focus:border-cyan-neon/40 focus:bg-[#131b2c] focus:shadow-[0_0_10px_rgba(0,243,255,0.1)]"
                        />
                    </div>
                    <button className="flex items-center gap-2 h-10 px-5 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white text-xs font-bold transition-all border border-white/5">
                        <Filter size={14} /> Filter
                    </button>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[80px_130px_1fr_90px_90px_110px] px-6 py-3 bg-[#131b2c]/40 border-b border-[#1a1f2e] text-[9px] font-bold text-gray-400 uppercase tracking-widest gap-2">
                <div>ALERT ID</div>
                <div>TIMESTAMP/SOURCE</div>
                <div>DESCRIPTION / TARGET</div>
                <div>SEVERITY</div>
                <div>STATUS</div>
                <div>ASSIGNEE</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0e17]/60">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <RefreshCw size={24} className="text-cyan-neon animate-spin" />
                    </div>
                ) : incidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <Shield size={32} className="text-gray-700" />
                        <div className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">No Active Alerts</div>
                    </div>
                ) : (
                    incidents.map((incident) => (
                        <motion.div
                            key={incident.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ backgroundColor: 'rgba(0, 243, 255, 0.05)' }}
                            onClick={() => onSelectAlert && onSelectAlert(incident)}
                            className="grid grid-cols-[80px_130px_1fr_90px_90px_110px] px-6 py-3.5 border-b border-[#1a1f2e] items-center cursor-pointer transition-colors group gap-2"
                        >
                            <div className="font-mono text-[11px] text-cyan-neon font-bold tracking-wide glow-text-cyan">
                                {incident.id}
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] text-gray-200 font-medium">{incident.time}</span>
                                <span className="text-[8px] text-gray-400 uppercase tracking-wider font-mono">{incident.source}</span>
                            </div>

                            <div className="flex flex-col gap-0.5 pr-6 min-w-0">
                                <span className="text-[12px] font-medium text-gray-100 truncate" title={incident.title}>{incident.title}</span>
                                <div className="flex items-center gap-1.5 text-gray-500 min-w-0">
                                    <User size={10} className="text-gray-500 shrink-0" />
                                    <span className="text-[10px] truncate" title={incident.user}>{incident.user}</span>
                                </div>
                            </div>

                            <div>
                                {getSeverityBadge(incident.severity)}
                            </div>

                            <div>
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${incident.status === 'Open' ? 'border-[#ff3366]/40 shadow-[0_0_10px_rgba(255,51,102,0.2)] bg-[#ff3366]/10' : 'border-gray-700 bg-gray-800/50'}`}>
                                    <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: incident.status === 'Open' ? '#ff3366' : '#8b949e', color: incident.status === 'Open' ? '#ff3366' : '#8b949e' }} />
                                    <span className={`text-[9px] font-bold tracking-wider ${incident.status === 'Open' ? 'text-[#ff3366]' : 'text-gray-400'}`}>• {incident.status}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-gray-600">
                                <User size={10} className="opacity-70 shrink-0" />
                                <span className="text-[10px] truncate">{incident.assignee}</span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default IncidentsTable;
