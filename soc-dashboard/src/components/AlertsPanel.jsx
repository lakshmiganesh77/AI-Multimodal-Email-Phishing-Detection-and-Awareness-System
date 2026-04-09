import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, ChevronRight, ChevronDown } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const AlertsPanel = ({ fullView = false }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    const fetchAlerts = async () => {
        try {
            const limit = fullView ? 50 : 5;
            const response = await axios.get(`${API_BASE}/soc/alerts?limit=${limit}`);
            setAlerts(response.data);
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 10000);
        return () => clearInterval(interval);
    }, [fullView]);

    const getStatusInfo = (alert) => {
        if (alert.quarantine_status === 'released') {
            return { label: 'Released', color: '#00ff88' };
        }
        if (alert.label === 'PHISHING') {
            return { label: 'Blocked', color: '#ff3b5c' };
        }
        return { label: 'Quarantined', color: '#ffd700' };
    };

    const CircularProgress = ({ score, size = 60 }) => {
        const radius = (size - 8) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;

        const getColor = (score) => {
            if (score >= 80) return '#ff3b5c';
            if (score >= 50) return '#ffd700';
            return '#00ff88';
        };

        return (
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#1a2332"
                    strokeWidth="4"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={getColor(score)}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dy=".3em"
                    fill="white"
                    fontSize="16"
                    fontWeight="700"
                    transform={`rotate(90 ${size / 2} ${size / 2})`}
                >
                    {score}%
                </text>
            </svg>
        );
    };

    return (
        <div className={`bg-[#151b24] rounded-2xl p-6 border border-[#1a2332] mb-6 ${fullView ? 'flex-1' : 'flex-none'}`}>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-white text-lg font-semibold m-0">
                    Recent Threats
                </h3>
                {!fullView && (
                    <button className="bg-transparent border-none text-[#00d4ff] text-[13px] cursor-pointer flex items-center gap-1 font-medium p-0">
                        View all <ChevronRight size={14} />
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <AnimatePresence>
                    {alerts.map((alert, index) => {
                        const status = getStatusInfo(alert);
                        const isExpanded = expandedId === alert.id;
                        const borderColor = alert.label === 'PHISHING' ? '#ff3b5c' : '#ffd700';

                        return (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-[#0f1419] p-4 rounded-xl cursor-pointer"
                                style={{ borderLeft: `4px solid ${borderColor}` }}
                                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Circular Progress */}
                                    <CircularProgress score={alert.risk_score} />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-[0.5px]"
                                                style={{ backgroundColor: borderColor + '20', color: borderColor }}>
                                                {alert.label}
                                            </span>
                                            <span className="text-[#64748b] text-xs">
                                                {alert.subject?.substring(0, 30) || '(No Subject)'}
                                            </span>
                                        </div>
                                        <div className="text-white text-sm font-semibold mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                            {alert.subject || '(No Subject)'}
                                        </div>
                                        <div className="text-[#64748b] text-xs flex gap-3 items-center">
                                            <span>From: {alert.sender?.substring(0, 30)}</span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={11} />
                                                {new Date(alert.created_at).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="px-3 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap"
                                        style={{ backgroundColor: status.color + '20', color: status.color }}>
                                        {status.label}
                                    </div>

                                    {/* Expand Icon */}
                                    <ChevronDown
                                        size={18}
                                        color="#64748b"
                                        style={{
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s'
                                        }}
                                    />
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-3 pt-3 border-t border-[#1a2332] text-[#94a3b8] text-xs">
                                                <div className="mb-2">
                                                    <strong className="text-[#64748b]">Risk Score:</strong> {alert.risk_score}/100
                                                </div>
                                                {alert.reasons && (
                                                    <div>
                                                        <strong className="text-[#64748b]">Reasons:</strong> {alert.reasons}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {alerts.length === 0 && !loading && (
                    <div className="text-center p-8 text-[#64748b]">
                        No recent threats detected
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertsPanel;
