import React, { useState } from 'react';
import axios from 'axios';
import {
    Bell, Shield, CheckCircle, Eye, Trash2, RefreshCw,
    AlertOctagon, AlertTriangle, Check, Clock, ChevronRight,
    Filter, XCircle, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import IncidentsTable from './IncidentsTable';
import IncidentDrillDown from './IncidentDrillDown';

const AlertsAndQuarantine = ({ onCorrelate }) => {
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);

    const handleAction = async (actionType) => {
        try {
            const rawId = selectedAlert.rawId;
            const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

            if (actionType === 'Assigned') {
                await axios.put(`${API_BASE}/soc/alerts/${rawId}/assign`, { analyst: 'Current User' });
            } else if (actionType === 'Quarantine') {
                // Using the specific quarantine action or state mutation here
                await axios.put(`${API_BASE}/soc/alerts/${rawId}/status`, { status: 'Quarantined', resolution_reason: 'Asset Isolated' });
            } else if (actionType === 'Marked False Positive') {
                await axios.put(`${API_BASE}/soc/alerts/${rawId}/status`, { status: 'False Positive', resolution_reason: 'Analyst reviewed and cleared' });
            } else if (actionType === 'Closed Incident') {
                await axios.put(`${API_BASE}/soc/alerts/${rawId}/status`, { status: 'Closed', resolution_reason: 'Standard mitigation applied' });
            }

            setActionMessage(`${actionType} applied to ${selectedAlert.id}`);
            setTimeout(() => {
                setActionMessage(null);
                if (actionType !== 'Assigned') {
                    setSelectedAlert(null); // Return to queue unless just assigning
                }
            }, 2000);
        } catch (error) {
            console.error("Action Failed:", error);
            setActionMessage("Action failed. Check console.");
        }
    };

    // --- Render Investigation View ---
    if (selectedAlert) {
        return (
            <div className="flex flex-col gap-5 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header Actions - Compact SOC Panel */}
                <div className="flex justify-between items-center glass-card px-5 py-3 rounded-2xl border border-white/5 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedAlert(null)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all group"
                        >
                            <ChevronRight size={15} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="h-6 w-px bg-white/5" />
                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                                <span className="font-mono text-[10px] text-cyan-neon bg-cyan-neon/5 px-1.5 py-0.5 rounded border border-cyan-neon/10">{selectedAlert.id}</span>
                                {selectedAlert.title}
                            </h2>
                            <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Incident Profile Investigation</div>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        {actionMessage && (
                            <span className="text-green-neon text-[10px] font-bold uppercase tracking-widest bg-green-neon/5 px-3 py-1 rounded-lg border border-green-neon/10 animate-pulse mr-2">
                                {actionMessage}
                            </span>
                        )}
                        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                            <button
                                onClick={() => handleAction('Assigned')}
                                className="px-3 py-1.5 bg-transparent hover:bg-white/5 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
                            >
                                Assign
                            </button>
                            <button
                                onClick={() => handleAction('Quarantine')}
                                className="px-3 py-1.5 bg-red-neon/10 hover:bg-red-neon/20 text-red-neon text-[10px] font-bold uppercase tracking-wider rounded-lg border border-red-neon/20 transition-all"
                            >
                                Quarantine
                            </button>
                            <button
                                onClick={() => handleAction('Marked False Positive')}
                                className="px-3 py-1.5 bg-yellow-neon/10 hover:bg-yellow-neon/20 text-yellow-neon text-[10px] font-bold uppercase tracking-wider rounded-lg border border-yellow-neon/20 transition-all"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => handleAction('Closed Incident')}
                                className="px-4 py-1.5 bg-cyan-neon text-bg-primary text-[10px] font-black uppercase tracking-widest rounded-lg glow-cyan hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Resolve
                            </button>
                        </div>
                    </div>
                </div>

                {/* Investigation Workspace */}
                <div className="flex-1 overflow-y-auto">
                    <IncidentDrillDown alert={selectedAlert} onCorrelate={onCorrelate} />
                </div>
            </div>
        );
    }

    // --- Render Alert Queue ---
    return (
        <div className="h-[calc(100vh-60px)] md:h-[calc(100vh-80px)] flex flex-col gap-6">
            <IncidentsTable onSelectAlert={setSelectedAlert} />
        </div>
    );
};

export default AlertsAndQuarantine;
