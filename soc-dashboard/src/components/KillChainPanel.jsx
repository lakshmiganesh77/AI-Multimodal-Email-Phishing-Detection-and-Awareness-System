import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, HelpCircle, XCircle, ChevronDown, ChevronRight, Zap } from 'lucide-react';
import CustomTooltip from './CustomTooltip';

const KILL_CHAIN_STAGES = [
  {
    id: 'initial_access',
    label: 'Initial Access',
    mitre: 'TA0001',
    techniques: ['T1566.001 – Spearphishing Link', 'T1566.002 – Spearphishing Attachment'],
    icon: '📧',
  },
  {
    id: 'execution',
    label: 'Execution',
    mitre: 'TA0002',
    techniques: ['T1059 – Command & Scripting', 'T1204 – User Execution'],
    icon: '⚙️',
  },
  {
    id: 'persistence',
    label: 'Persistence',
    mitre: 'TA0003',
    techniques: ['T1098 – Account Manipulation', 'T1137 – Office Application Startup'],
    icon: '🔒',
  },
  {
    id: 'privilege_escalation',
    label: 'Privilege Escalation',
    mitre: 'TA0004',
    techniques: ['T1078 – Valid Accounts', 'T1548 – Abuse Elevation Control'],
    icon: '⬆️',
  },
  {
    id: 'lateral_movement',
    label: 'Lateral Movement',
    mitre: 'TA0008',
    techniques: ['T1534 – Internal Spearphishing', 'T1021 – Remote Services'],
    icon: '↔️',
  },
  {
    id: 'data_exfiltration',
    label: 'Data Exfiltration',
    mitre: 'TA0010',
    techniques: ['T1048 – Exfiltration over Alt Protocol', 'T1041 – Exfil over C2'],
    icon: '📤',
  },
];

const getStageStatus = (stageId, alertType, score) => {
  const isPhishing = alertType === 'PHISHING';
  const isCritical = score > 85;
  const isHigh = score > 65;

  // Simulate which stages are confirmed/suspected/unknown based on alert type and score
  const statusMap = {
    initial_access: isPhishing ? 'confirmed' : 'none',
    execution: isPhishing && (isCritical || isHigh) ? 'confirmed' : isPhishing ? 'suspected' : 'none',
    persistence: isCritical ? 'suspected' : 'unknown',
    privilege_escalation: isCritical ? 'unknown' : 'none',
    lateral_movement: isCritical ? 'unknown' : 'none',
    data_exfiltration: isCritical ? 'unknown' : 'none',
  };
  return statusMap[stageId] || 'none';
};

const StatusIcon = ({ status }) => {
  if (status === 'confirmed') return <CheckCircle size={16} color="#ff3333" />;
  if (status === 'suspected') return <AlertTriangle size={16} color="#ffd700" />;
  if (status === 'unknown') return <HelpCircle size={16} color="#8b949e" />;
  return <XCircle size={16} color="rgba(255,255,255,0.1)" />;
};

const statusLabel = (s) => {
  if (s === 'confirmed') return { text: 'CONFIRMED', color: '#ff3333', bg: 'rgba(255,51,51,0.1)' };
  if (s === 'suspected') return { text: 'SUSPECTED', color: '#ffd700', bg: 'rgba(255,215,0,0.1)' };
  if (s === 'unknown') return { text: 'UNKNOWN', color: '#8b949e', bg: 'rgba(139,148,158,0.1)' };
  return { text: 'NOT DETECTED', color: 'rgba(255,255,255,0.2)', bg: 'rgba(0,0,0,0.2)' };
};

const KillChainPanel = ({ alert }) => {
  const [expandedStage, setExpandedStage] = useState(null);

  if (!alert) return null;

  const confirmedCount = KILL_CHAIN_STAGES.filter(s => getStageStatus(s.id, alert.type, alert.score) === 'confirmed').length;
  const suspectedCount = KILL_CHAIN_STAGES.filter(s => getStageStatus(s.id, alert.type, alert.score) === 'suspected').length;

  return (
    <div className="bg-[rgba(20,30,40,0.6)] rounded-xl border border-[rgba(255,51,51,0.2)] hover:z-50 backdrop-blur-[10px] flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-center rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <Zap size={16} color="#ff3333" />
          <h3 className="m-0 text-[13px] font-bold uppercase tracking-[1px] text-[var(--text-primary)] flex items-center gap-2">
            <span>Attack Kill Chain Mapping</span>
            <CustomTooltip
              title="Kill Chain Mapping"
              usedFor="Maps detected alert activities against the stages of a standard cyber attack lifecycle."
              interpret="Confirmed stages show how far the attacker progressed. Prioritize investigations where later stages (like Exfiltration) are suspected."
            />
          </h3>
        </div>
        <div className="flex gap-3">
          <span className="text-[11px] text-[#ff3333] font-bold flex items-center gap-1">
            <CheckCircle size={11} /> {confirmedCount} Confirmed
          </span>
          <span className="text-[11px] text-[#ffd700] font-semibold flex items-center gap-1">
            <AlertTriangle size={11} /> {suspectedCount} Suspected
          </span>
        </div>
      </div>

      {/* Kill Chain Stages */}
      <div className="p-5 flex flex-col gap-2">
        {/* Visual Progress Bar */}
        <div className="flex gap-1 mb-3">
          {KILL_CHAIN_STAGES.map((stage, i) => {
            const status = getStageStatus(stage.id, alert.type, alert.score);
            const color = status === 'confirmed' ? '#ff3333' : status === 'suspected' ? '#ffd700' : status === 'unknown' ? '#8b949e' : 'rgba(255,255,255,0.06)';
            return (
              <div key={stage.id} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="w-full h-1.5 rounded-[3px] origin-left"
                  style={{
                    backgroundColor: color,
                    boxShadow: status !== 'none' ? `0 0 8px ${color}` : 'none',
                  }}
                />
                <span className="text-[8px] text-[rgba(255,255,255,0.3)] text-center tracking-[0.3px]">
                  {stage.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stage List */}
        {KILL_CHAIN_STAGES.map((stage, i) => {
          const status = getStageStatus(stage.id, alert.type, alert.score);
          const sl = statusLabel(status);
          const isExpanded = expandedStage === stage.id;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                onClick={() => status !== 'none' && setExpandedStage(isExpanded ? null : stage.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 ${isExpanded ? 'bg-[rgba(0,0,0,0.4)]' : 'bg-[rgba(0,0,0,0.2)]'}`}
                style={{
                  border: `1px solid ${status !== 'none' ? sl.color + '30' : 'rgba(255,255,255,0.04)'}`,
                  cursor: status !== 'none' ? 'pointer' : 'default',
                  opacity: status === 'none' ? 0.4 : 1,
                }}
              >
                <span className="text-base min-w-[20px]">{stage.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{stage.label}</span>
                    <span className="text-[9px] text-[#4a5568] font-mono">{stage.mitre}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-[3px] text-[9px] font-bold tracking-[0.5px]"
                    style={{ backgroundColor: sl.bg, color: sl.color }}
                  >{sl.text}</span>
                  <StatusIcon status={status} />
                  {status !== 'none' && (isExpanded ? <ChevronDown size={12} color="#4a5568" /> : <ChevronRight size={12} color="#4a5568" />)}
                </div>
              </div>

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1 px-3.5 py-2.5 bg-[rgba(0,0,0,0.3)] rounded-md"
                  style={{ borderLeft: `3px solid ${sl.color}` }}
                >
                  <div className="text-[10px] text-[#4a5568] uppercase tracking-[1px] mb-2">
                    Detected Techniques
                  </div>
                  {stage.techniques.map((t, j) => (
                    <div key={j} className={`flex items-center gap-2 py-1 ${j < stage.techniques.length - 1 ? 'border-b border-[rgba(255,255,255,0.04)]' : ''}`}>
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: sl.color }} />
                      <span className="text-[11px] text-[var(--text-secondary)] font-mono">{t}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default KillChainPanel;
