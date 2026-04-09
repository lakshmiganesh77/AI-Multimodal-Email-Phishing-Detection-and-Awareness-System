import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Database, Activity, AlertTriangle, Globe, Shield, Clock, TrendingUp,
  Search, User, X, Server, Radio, Zap, AlertCircle, ShieldAlert, Cpu,
  Hash, Link, Network, Target, Info
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

const IOC_DATABASE = {
  totals: { domains: 142, ips: 76, hashes: 31, emails: 58 },
  recent: [
    { value: 'fake-login-page.com', type: 'Domain', severity: 'critical', added: '8m ago' },
    { value: '185.220.101.47', type: 'IP', severity: 'critical', added: '22m ago' },
    { value: 'd41d8cd98f00b204e980', type: 'Hash', severity: 'high', added: '1h ago' },
    { value: 'invoice@lucky-winner.ru', type: 'Email', severity: 'high', added: '2h ago' },
    { value: 'microsoft-login.xyz', type: 'Domain', severity: 'high', added: '3h ago' },
  ]
};

const MITRE_TECHNIQUES = [
  { id: 'T1566.001', name: 'Spearphishing Attachment', tactic: 'Initial Access', count: 18, color: '#ff3333', description: 'Attacker sends phishing emails with malicious attachments to target users.' },
  { id: 'T1566.002', name: 'Spearphishing Link', tactic: 'Initial Access', count: 29, color: '#ff6b6b', description: 'Phishing emails with malicious URLs designed to steal credentials.' },
  { id: 'T1078', name: 'Valid Accounts', tactic: 'Persistence', count: 11, color: '#ffa94d', description: 'Adversary uses stolen or default credentials to maintain access.' },
  { id: 'T1056', name: 'Input Capture', tactic: 'Collection', count: 7, color: '#ffd700', description: 'Keyloggers and form-grabbers used to capture user credentials.' },
  { id: 'T1071', name: 'Application Layer Protocol', tactic: 'C2', count: 5, color: '#00f3ff', description: 'Command-and-control communication using common protocols like HTTPS.' },
  { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', count: 3, color: '#cc45ff', description: 'Ransomware encrypts files to make them inaccessible for extortion.' },
];

const GRAPH_NODES = [
  { id: 'fake-login-page.com', label: 'fake-login-page.com', group: 'domain', color: '#ff3333' },
  { id: '185.220.101.47', label: '185.220.101.47', group: 'ip', color: '#ffa94d' },
  { id: 'APT-29 Campaign', label: 'APT-29 Campaign', group: 'campaign', color: '#cc45ff' },
  { id: 'Invoice Fraud Wave', label: 'Invoice Fraud Wave', group: 'campaign', color: '#cc45ff' },
  { id: 'microsoft-login.xyz', label: 'microsoft-login.xyz', group: 'domain', color: '#ff6b6b' },
  { id: '194.165.16.98', label: '194.165.16.98', group: 'ip', color: '#ffd700' },
];

const GRAPH_LINKS = [
  { source: 'fake-login-page.com', target: '185.220.101.47', label: 'hosted on' },
  { source: '185.220.101.47', target: 'APT-29 Campaign', label: 'used in' },
  { source: 'microsoft-login.xyz', target: '194.165.16.98', label: 'hosted on' },
  { source: '194.165.16.98', target: 'Invoice Fraud Wave', label: 'used in' },
  { source: 'APT-29 Campaign', target: 'Invoice Fraud Wave', label: 'overlaps' },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// --- Simulated static data (mirrors what backend would serve for attacker infra and anomalies) ---
const ATTACKER_INFRA = [
  { ip: '185.220.101.47', country: 'RU', asn: 'AS60117', campaigns: 3, attacks: 12, lastSeen: '2m ago' },
  { ip: '194.165.16.98', country: 'CN', asn: 'AS4134', campaigns: 2, attacks: 8, lastSeen: '14m ago' },
  { ip: '91.108.4.209', country: 'IR', asn: 'AS62282', campaigns: 1, attacks: 5, lastSeen: '1h ago' },
  { ip: '104.21.73.99', country: 'US', asn: 'AS13335', campaigns: 1, attacks: 3, lastSeen: '3h ago' },
];

const DOMAIN_ANOMALIES = [
  { domain: 'secure-paypa1.com', age: '2 days', score: 91, severity: 'critical', registered: 'Namecheap' },
  { domain: 'microsoft-login.xyz', age: '5 days', score: 87, severity: 'critical', registered: 'GoDaddy' },
  { domain: 'update-amazon-acc.net', age: '11 days', score: 72, severity: 'high', registered: 'Registrar.eu' },
  { domain: 'notifica-intesa.it', age: '3 days', score: 68, severity: 'high', registered: 'NameSilo' },
];

const CAMPAIGNS = [
  {
    id: 'APT-29-001', name: 'APT-29 Phishing Campaign', severity: 'critical',
    description: 'Targeted spear-phishing of accounting departments via invoice lures.',
    alerts: 12, users: 8, growthRate: '+3/hr', iocs: 7,
    urgency: 'SLA Breach in 14m', urgencyColor: '#ff3333',
    firstSeen: '2026-02-20', mitreId: 'T1566.001',
    peakActivity: '2026-02-23', containmentStatus: 'Partial', estimatedNextStage: 'Lateral Movement',
    lifecycle: [
      { day: 'Day 1', event: 'Phishing email delivered to 8 targets', color: '#ff3333' },
      { day: 'Day 3', event: 'Credential submission from 3 users detected', color: '#ff6b6b' },
      { day: 'Day 5', event: 'Login from Tor exit node — account takeover attempt', color: '#ffa94d' },
      { day: 'Day 6', event: 'Mailbox forwarding rules created — BEC prep', color: '#ffd700' },
    ],
    affected_depts: ['Finance', 'Executive', 'HR'],
    exec_targeted: 2, finance_targeted_pct: 62, credential_reuse: 3,
  },
  {
    id: 'WAVE-2026', name: 'Invoice Fraud Wave 2026', severity: 'high',
    description: 'Mass-scattered PDF malware delivery targeting SMB clients.',
    alerts: 35, users: 102, growthRate: '+14/day', iocs: 23,
    urgency: '2h 44m remaining', urgencyColor: '#ffd700',
    firstSeen: '2026-02-18', mitreId: 'T1566.002',
    peakActivity: '2026-02-24', containmentStatus: 'Uncontained', estimatedNextStage: 'Data Exfiltration',
    lifecycle: [
      { day: 'Day 1', event: 'Mass email campaign launched — 102 targets', color: '#ffd700' },
      { day: 'Day 4', event: 'PDF malware opened by 14 users', color: '#ffa94d' },
      { day: 'Day 6', event: 'Reverse shell activity detected on 2 endpoints', color: '#ff6b6b' },
    ],
    affected_depts: ['Finance', 'IT', 'Procurement'],
    exec_targeted: 0, finance_targeted_pct: 48, credential_reuse: 7,
  },
  {
    id: 'BEC-EXEC', name: 'BEC Executive Impersonation', severity: 'high',
    description: 'CEO/CFO Wire-fraud impersonation hitting finance teams.',
    alerts: 6, users: 14, growthRate: '+1/hr', iocs: 4,
    urgency: '22h 10m remaining', urgencyColor: '#00ff9d',
    firstSeen: '2026-02-23', mitreId: 'T1566.002',
    peakActivity: '2026-02-25', containmentStatus: 'Detected', estimatedNextStage: 'Financial Fraud',
    lifecycle: [
      { day: 'Day 1', event: 'Lookalike domain registered — targeting CFO', color: '#ffd700' },
      { day: 'Day 2', event: 'First BEC email delivered — urgent wire transfer request', color: '#ff3333' },
      { day: 'Day 3', event: 'Finance analyst replied — reply-chain active', color: '#ff6b6b' },
    ],
    affected_depts: ['Finance', 'Executive'],
    exec_targeted: 3, finance_targeted_pct: 85, credential_reuse: 0,
  },
];

const IOC_REUSE = [
  { ioc: '185.220.101.47', type: 'IP', campaigns: 3, alerts: 18, depts: 3, firstSeen: '2026-01-12', color: '#ff3333' },
  { ioc: 'secure-paypa1.com', type: 'Domain', campaigns: 2, alerts: 11, depts: 2, firstSeen: '2026-02-18', color: '#ff6b6b' },
  { ioc: 'invoice-update@gmail.com', type: 'Email', campaigns: 2, alerts: 7, depts: 2, firstSeen: '2026-02-20', color: '#ffa94d' },
  { ioc: 'd41d8cd98f00b204e980', type: 'Hash', campaigns: 1, alerts: 5, depts: 1, firstSeen: '2026-02-22', color: '#ffd700' },
];

const THREAT_ACTORS_INTEL = [
  { name: 'APT29 (Cozy Bear)', country: 'Russia 🇷🇺', confidence: 74, ttps: 4, campaigns: 6, color: '#ff3333' },
  { name: 'TA505', country: 'Unknown (CIS) 🌍', confidence: 58, ttps: 3, campaigns: 3, color: '#ff6b6b' },
  { name: 'SCATTERED SPIDER', country: 'Nigeria/UK 🌐', confidence: 51, ttps: 2, campaigns: 2, color: '#ffa94d' },
];

const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return '#ff3333';
    case 'high': return '#ff6b6b';
    case 'medium': return '#ffd700';
    case 'low': return '#00ff9d';
    default: return '#8b949e';
  }
};

const getNodeColor = (node) => {
  if (node.group === 'ioc') return '#ff3333';
  if (node.group === 'alert') return '#ffd700';
  if (node.group === 'user') return '#00f3ff';
  return '#8b949e';
};

const SeverityBadge = ({ severity }) => (
  <span className="px-2.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase tracking-[0.5px]"
    style={{
      backgroundColor: getSeverityColor(severity) + '20',
      color: getSeverityColor(severity),
      border: `1px solid ${getSeverityColor(severity)}40`,
    }}>{severity}</span>
);

// Custom Tooltip Helper
const Tooltip = ({ text, children }) => {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 min-w-[180px] max-w-[260px] bg-[#0a0e1a] border border-[rgba(0,243,255,0.2)] rounded-lg p-3 shadow-[0_4px_24px_rgba(0,0,0,0.6)] pointer-events-none">
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed m-0">{text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[rgba(0,243,255,0.2)]" />
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
const ThreatIntelFusion = () => {
  const [healthData, setHealthData] = useState(null);
  const [liveStream, setLiveStream] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [iocData, setIocData] = useState(null);
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [graphExpanded, setGraphExpanded] = useState(false);

  const graphContainerRef = useRef(null);
  const graphRef = useRef(null);
  const [graphSize, setGraphSize] = useState({ w: 600, h: 400 });

  // --- Responsive graph sizing ---
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setGraphSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    if (graphContainerRef.current) observer.observe(graphContainerRef.current);
    return () => observer.disconnect();
  }, [iocData]);

  // --- Data fetching ---
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await axios.get(`${API_BASE}/soc/intel/health`);
        setHealthData(res.data);
      } catch { /* backend offline */ }
    };

    const fetchStream = async () => {
      try {
        const res = await axios.get(`${API_BASE}/soc/intel/stream`);
        setLiveStream(prev => {
          const newEvents = res.data.filter(e => !prev.find(p => p.id === e.id));
          return [...newEvents, ...prev].slice(0, 25);
        });
      } catch { /* backend offline */ }
    };

    fetchHealth();
    fetchStream();

    const hInterval = setInterval(fetchHealth, 12000);
    const sInterval = setInterval(fetchStream, 5000);
    return () => { clearInterval(hInterval); clearInterval(sInterval); };
  }, []);

  // --- IOC Correlation ---
  const executeSearch = useCallback(async (query) => {
    if (!query) return;
    setIsSearching(true);
    try {
      const res = await axios.get(
        `${API_BASE}/soc/intel/correlate?value=${encodeURIComponent(query)}&type=url`
      );
      setIocData(res.data);
      setTimeout(() => { if (graphRef.current) graphRef.current.zoomToFit(400, 40); }, 600);
    } catch {
      setIocData({ error: true });
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Check for cross-tab deep-link (from AlertTriage "Correlate" button)
  useEffect(() => {
    const pending = localStorage.getItem('pending_correlation_ioc');
    if (pending) {
      setSearchQuery(pending);
      localStorage.removeItem('pending_correlation_ioc');
      executeSearch(pending);
    }
  }, [executeSearch]);

  const handleSearch = (e) => { e.preventDefault(); executeSearch(searchQuery.trim()); };

  // --- Styles ---


  const streamTypeIcon = (type) => {
    if (type === 'campaign') return <Shield size={12} color="#ff3333" />;
    if (type === 'hit') return <AlertTriangle size={12} color="#ff6b6b" />;
    if (type === 'feed_alert') return <Server size={12} color="#ffd700" />;
    return <Globe size={12} color="#00f3ff" />;
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── HEADER ── */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-[var(--text-primary)] text-[22px] font-bold m-0 tracking-[2px] uppercase drop-shadow-[0_0_20px_rgba(0,243,255,0.25)]">
            Threat Intelligence Fusion
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#00ff9d] shadow-[0_0_8px_#00ff9d] inline-block animate-[pulse-dot_2s_infinite]" />
            <span className="text-[var(--cyan)] text-[11px] tracking-[1.5px] uppercase">
              Live Correlation Engine Active
            </span>
          </div>
        </div>

        {/* IOC Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Correlate IOC → Domain, Email, Hash..."
              className="py-2.5 pr-3.5 pl-9 w-[340px] bg-[rgba(0,0,0,0.4)] border border-[rgba(0,243,255,0.25)] rounded-md text-[var(--text-primary)] text-[13px] font-mono outline-none"
            />
          </div>
          <button type="submit" disabled={isSearching} className={`px-5 py-2.5 border-none rounded-md text-[#000] font-bold text-[13px] tracking-[0.5px] transition-all duration-200 ${isSearching ? 'bg-[rgba(0,243,255,0.3)] cursor-not-allowed' : 'bg-[var(--cyan)] cursor-pointer'}`}>
            {isSearching ? '⟳ Correlating...' : 'Correlate'}
          </button>
        </form>
      </div>

      {/* ── IOC CORRELATION PANEL ── */}
      {iocData && !iocData.error && (
        <div className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl border border-[rgba(0,243,255,0.4)] shadow-[0_0_40px_rgba(0,243,255,0.1)] p-6">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <Cpu size={22} className="text-[var(--cyan)]" />
              <div>
                <h3 className="text-[var(--text-primary)] text-base font-bold m-0">
                  Correlation Analysis
                </h3>
                <span className="text-[var(--red)] font-mono text-[13px]">{iocData.ioc_value}</span>
              </div>
            </div>
            <button onClick={() => setIocData(null)} className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer p-1">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-[320px_1fr] gap-5 min-h-[420px]">
            {/* Left: Stats */}
            <div className="flex flex-col gap-[14px]">
              {/* Threat Intel Card */}
              <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4 border border-[rgba(255,255,255,0.06)]">
                <div className="text-[var(--text-secondary)] text-[10px] uppercase tracking-[1px] mb-3">
                  🌐 Global Threat Intel
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'First Seen', val: new Date(iocData.threat_intel.first_seen).toLocaleDateString(), color: 'text-[var(--text-primary)]' },
                    { label: 'Domain Age', val: `${iocData.threat_intel.domain_age_days}d`, color: 'text-[#ff3333]' },
                    { label: 'VT Score', val: iocData.threat_intel.virustotal_score, color: 'text-[#ff3333]' },
                    { label: 'Risk Trend', val: iocData.threat_intel.risk_trend, color: 'text-[#ffa94d]' },
                  ].map(({ label, val, color }) => (
                    <div key={label}>
                      <div className="text-[var(--text-secondary)] text-[10px] mb-[2px]">{label}</div>
                      <div className={`${color} font-bold text-[13px] font-mono`}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal Impact Card */}
              <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4 border border-[rgba(255,255,255,0.06)] flex-1">
                <div className="text-[var(--text-secondary)] text-[10px] uppercase tracking-[1px] mb-3">
                  🔴 Internal Impact
                </div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[var(--text-secondary)] text-[13px]">Linked Alerts</span>
                  <span className="text-[var(--text-primary)] text-[18px] font-mono font-bold">
                    {iocData.related_alerts_count}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[var(--text-secondary)] text-[13px]">Affected Users</span>
                  <span className="text-[#ff3333] text-[18px] font-mono font-bold">
                    {iocData.affected_users.length}
                  </span>
                </div>
                {iocData.affected_users.length === 0 ? (
                  <div className="text-[var(--green)] text-xs flex items-center gap-1.5">
                    ✓ No internal users linked to this IOC
                  </div>
                ) : (
                  <div className="max-h-[130px] overflow-y-auto">
                    {iocData.affected_users.map(u => (
                      <div key={u} className="flex items-center gap-2 py-1 border-b border-[rgba(255,255,255,0.04)]">
                        <User size={11} className="text-[var(--cyan)]" />
                        <span className="text-[var(--text-primary)] text-[11px] font-mono overflow-hidden text-ellipsis whitespace-nowrap">{u}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Force Graph Fullscreen Modal ── */}
            {graphExpanded && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}
                onClick={() => setGraphExpanded(false)}
              >
                <div
                  className="relative rounded-2xl border border-[rgba(0,243,255,0.15)] flex flex-col p-4"
                  style={{ width: '96vw', height: '90vh', background: '#050a0f', boxShadow: '0 0 60px rgba(0,243,255,0.1)' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-[#00f3ff]" />
                      <h2 className="text-[13px] font-bold text-white tracking-widest uppercase">IOC Correlation Graph</h2>
                      <div className="flex gap-3 ml-4">
                        {[['IOC', '#ff3333'], ['Alert', '#ffd700'], ['User', '#00f3ff']].map(([label, col]) => (
                          <div key={label} className="flex items-center gap-[5px]">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col, boxShadow: `0 0 6px ${col}` }} />
                            <span className="text-[10px] text-[#8b949e]">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => setGraphExpanded(false)}>✕</button>
                  </div>
                  <div className="flex-1 min-h-0 rounded-xl overflow-hidden">
                    <ForceGraph2D
                      width={window.innerWidth * 0.96 - 32}
                      height={window.innerHeight * 0.9 - 80}
                      graphData={iocData?.graph_data || { nodes: GRAPH_NODES.filter(n => n.id), links: GRAPH_NODES.filter(n => n.source) }}
                      nodeColor={getNodeColor}
                      nodeLabel="label"
                      nodeRelSize={8}
                      linkColor={() => 'rgba(0, 243, 255, 0.25)'}
                      linkWidth={1.5}
                      backgroundColor="#050a0f"
                      onNodeClick={node => { if (node.group === 'ioc') { setGraphExpanded(false); } }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Right: Force Graph */}
            <div
              ref={graphContainerRef}
              className="bg-[#050a0f] rounded-lg border border-[rgba(0,243,255,0.15)] relative overflow-hidden min-h-[420px] group/graph"
            >
              {/* Legend + Expand */}
              <div className="absolute top-2.5 left-2.5 z-10 flex gap-3 bg-[rgba(0,0,0,0.5)] px-2.5 py-1.5 rounded">
                {[['IOC', '#ff3333'], ['Alert', '#ffd700'], ['User', '#00f3ff']].map(([label, col]) => (
                  <div key={label} className="flex items-center gap-[5px]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col, boxShadow: `0 0 6px ${col}` }} />
                    <span className="text-[10px] text-[#8b949e]">{label}</span>
                  </div>
                ))}
              </div>
              {/* Expand button */}
              <div className="absolute top-2.5 right-2.5 z-10">
                <button
                  onClick={() => setGraphExpanded(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-black/70 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/60 hover:text-white uppercase tracking-wider transition-all"
                >⤢ Expand</button>
              </div>

              {iocData.graph_data?.nodes?.length > 0 ? (
                <ForceGraph2D
                  ref={graphRef}
                  width={graphSize.w || 600}
                  height={graphSize.h || 420}
                  graphData={iocData.graph_data}
                  nodeColor={getNodeColor}
                  nodeLabel="label"
                  nodeRelSize={7}
                  linkColor={() => 'rgba(0, 243, 255, 0.18)'}
                  linkWidth={1.5}
                  backgroundColor="#050a0f"
                  onNodeClick={node => { if (node.group === 'ioc') executeSearch(node.id); }}
                />
              ) : (
                <div className="h-full flex flex-col justify-center items-center gap-3 text-[var(--text-secondary)]">
                  <Database size={36} />
                  <span className="text-[13px]">No internal alerts linked to this IOC</span>
                  <span className="text-[11px] text-[#4a5568]">Search a sender domain to see connected users and alerts</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {iocData?.error && (
        <div className="bg-[rgba(255,51,51,0.08)] border border-[rgba(255,51,51,0.3)] rounded-lg p-4 flex items-center gap-3 text-[var(--red)]">
          <AlertCircle size={18} />
          <span className="text-[13px]">Correlation failed — backend unreachable. Ensure the Python server is running.</span>
        </div>
      )}

      {/* ── ROW 1: Live Stream + Feed Health ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Live Activity Stream */}
        <div className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl border border-[rgba(0,243,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col max-h-[380px]">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2.5 shrink-0">
            <Radio size={15} color="#ff3333" />
            <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[1px] text-[var(--text-primary)]">
              Live Activity Stream
            </h3>
            <span className="ml-auto text-[10px] text-[#4a5568] font-mono">
              {liveStream.length} events
            </span>
          </div>
          <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-2.5">
            {liveStream.length === 0 && (
              <div className="text-[#4a5568] text-xs text-center pt-5">
                Waiting for SOC events...
              </div>
            )}
            {liveStream.map(event => (
              <div key={event.id} className="py-[9px] px-3 bg-[rgba(0,0,0,0.25)] rounded-r-md flex flex-col gap-1 border-l-2"
                style={{ borderLeftColor: getSeverityColor(event.severity) }}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    {streamTypeIcon(event.type)}
                    <span className="text-[9px] font-bold uppercase tracking-[0.5px]" style={{ color: getSeverityColor(event.severity) }}>
                      {event.type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[#4a5568] text-[9px] font-mono">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[var(--text-primary)] text-xs leading-[1.4]">{event.message}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feed Health */}
        <div className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl border border-[rgba(0,243,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5">
          <div className="flex items-center gap-2.5 mb-[18px]">
            <Server size={16} className="text-[var(--cyan)]" />
            <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[1px] text-[var(--text-primary)]">
              Feed Health & Latency
            </h3>
            {healthData && (
              <span className="ml-auto text-[10px] text-[#4a5568]">
                Uptime: <span className="text-[var(--green)] font-semibold">{healthData.system_uptime}</span>
              </span>
            )}
          </div>

          {!healthData ? (
            <div className="text-[#4a5568] text-[13px]">Pinging providers...</div>
          ) : (
            <div className="flex flex-col gap-[14px]">
              {healthData.feeds.map(feed => {
                const isDegraded = feed.status === 'degraded';
                const latencyPct = Math.min(100, (feed.latency_ms / 2000) * 100);
                const latencyColor = feed.latency_ms > 1000 ? '#ff3333' : feed.latency_ms > 400 ? '#ffd700' : '#00f3ff';
                return (
                  <div key={feed.name} className="grid grid-cols-[110px_1fr_55px] gap-3 items-center">
                    <div>
                      <div className={`text-xs font-semibold ${isDegraded ? 'text-[#ff3333]' : 'text-[var(--text-primary)]'}`}>{feed.name}</div>
                      <div className="flex items-center gap-1">
                        <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: isDegraded ? '#ff3333' : '#00ff9d', boxShadow: isDegraded ? '0 0 5px #ff3333' : '0 0 5px #00ff9d' }} />
                        <span className={`text-[9px] uppercase tracking-[0.5px] ${isDegraded ? 'text-[#ff6b6b]' : 'text-[var(--green)]'}`}>{feed.status}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[#4a5568] text-[10px]">latency</span>
                        <span className="text-[10px] font-mono" style={{ color: latencyColor }}>{feed.latency_ms}ms</span>
                      </div>
                      <div className="h-[5px] bg-[rgba(255,255,255,0.07)] rounded-[3px] overflow-hidden">
                        <div className="h-full rounded-[3px] transition-[width] duration-400 ease-in-out" style={{ width: `${latencyPct}%`, backgroundColor: latencyColor, boxShadow: `0 0 6px ${latencyColor}60` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] ${parseFloat(feed.error_rate) > 5 ? 'text-[#ff3333]' : 'text-[#4a5568]'}`}>{feed.error_rate} err</div>
                      <div className="text-[9px] text-[#4a5568]">{feed.rate_limit_usage} rl</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ──ROW 2: Campaign Cluster Tracker ── */}
      <div className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl border border-[rgba(0,243,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="px-5 py-[18px] border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2.5">
          <Zap size={16} className="text-[var(--yellow)]" />
          <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[1px] text-[var(--text-primary)]">
            Active Campaign Clusters
          </h3>
          <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(255,51,51,0.15)] text-[#ff6b6b]">
            {CAMPAIGNS.filter(c => c.severity === 'critical').length} CRITICAL
          </span>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          {CAMPAIGNS.map(c => {
            const isExpanded = expandedCampaign === c.id;
            return (
              <div key={c.id} className="bg-[rgba(0,0,0,0.3)] rounded-lg overflow-hidden transition-all duration-300 border" style={{ borderColor: `${getSeverityColor(c.severity)}30` }}>
                <div
                  onClick={() => setExpandedCampaign(isExpanded ? null : c.id)}
                  className="px-[18px] py-[14px] cursor-pointer flex justify-between items-center gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-[3px] h-10 rounded-sm shrink-0" style={{ backgroundColor: getSeverityColor(c.severity) }} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-[3px]">
                        <span className="text-[var(--text-primary)] text-[13px] font-bold tracking-[0.3px]">{c.name}</span>
                        <SeverityBadge severity={c.severity} />
                      </div>
                      <div className="text-[#4a5568] text-[11px]">{c.mitreId} · First seen {c.firstSeen}</div>
                    </div>
                  </div>

                  <div className="flex gap-6 items-center shrink-0">
                    <div className="text-center">
                      <div className="text-[var(--text-primary)] text-base font-mono font-bold">{c.alerts}</div>
                      <div className="text-[#4a5568] text-[9px] uppercase">Alerts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[var(--text-primary)] text-base font-mono font-bold">{c.users}</div>
                      <div className="text-[#4a5568] text-[9px] uppercase">Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[14px] font-mono font-bold" style={{ color: getSeverityColor(c.severity) }}>{c.growthRate}</div>
                      <div className="text-[#4a5568] text-[9px] uppercase">Growth</div>
                    </div>
                    <div className="text-right min-w-[110px]">
                      <div className="text-[11px] font-semibold flex items-center gap-1 justify-end" style={{ color: c.urgencyColor }}>
                        <Clock size={11} color={c.urgencyColor} /> {c.urgency}
                      </div>
                    </div>
                    <div className={`text-[14px] transition-transform duration-300 ${isExpanded ? 'text-[var(--cyan)] rotate-90' : 'text-[#4a5568] rotate-0'}`}>▶</div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[rgba(255,255,255,0.05)] px-[18px] py-4 bg-[rgba(0,0,0,0.2)] flex flex-col gap-[14px]">
                    <div className="flex gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="text-[#4a5568] text-[10px] uppercase mb-1.5">Campaign Summary</div>
                        <p className="text-[var(--text-secondary)] text-xs leading-[1.6] m-0">{c.description}</p>
                      </div>
                      <div className="flex gap-5 items-start flex-wrap">
                        <div>
                          <div className="text-[#4a5568] text-[10px] uppercase mb-1.5">Containment</div>
                          <div className={`text-[13px] font-bold ${c.containmentStatus === 'Detected' ? 'text-[#00ff9d]' : c.containmentStatus === 'Partial' ? 'text-[#ffd700]' : 'text-[#ff3333]'}`}>{c.containmentStatus}</div>
                        </div>
                        <div>
                          <div className="text-[#4a5568] text-[10px] uppercase mb-1.5">Next Stage</div>
                          <div className="text-[#ffa94d] text-xs font-semibold">{c.estimatedNextStage}</div>
                        </div>
                        <div>
                          <div className="text-[#4a5568] text-[10px] uppercase mb-1.5">IOC Count</div>
                          <div className="text-[var(--red)] text-xl font-mono font-bold">{c.iocs}</div>
                        </div>
                        <button
                          onClick={() => { setSearchQuery(c.name); executeSearch(c.name); }}
                          className="self-end px-3.5 py-2 bg-transparent border border-[var(--cyan)] text-[var(--cyan)] rounded-[5px] text-[11px] font-semibold cursor-pointer"
                        >
                          Correlate Cluster →
                        </button>
                      </div>
                    </div>

                    {/* Internal Impact */}
                    <div className="p-3 bg-[rgba(255,51,51,0.04)] rounded-lg border border-[rgba(255,51,51,0.15)]">
                      <div className="text-[#4a5568] text-[10px] uppercase tracking-[1px] mb-2.5">🔴 Internal Impact</div>
                      <div className="grid grid-cols-4 gap-2.5">
                        {[
                          { label: 'Affected Depts', value: c.affected_depts?.join(', '), color: 'text-[#ff6b6b]' },
                          { label: 'Execs Targeted', value: c.exec_targeted, color: 'text-[#ffd700]' },
                          { label: 'Finance Targeted', value: `${c.finance_targeted_pct}%`, color: 'text-[#ff3333]' },
                          { label: 'Credential Reuse', value: c.credential_reuse, color: 'text-[#c084fc]' },
                        ].map((stat, i) => (
                          <div key={i}>
                            <div className="text-[9px] text-[#4a5568] mb-[3px] uppercase">{stat.label}</div>
                            <div className={`text-[13px] font-bold ${stat.color}`}>{stat.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Threat Evolution Timeline */}
                    <div>
                      <div className="text-[#4a5568] text-[10px] uppercase tracking-[1px] mb-2.5">📅 Threat Evolution Timeline</div>
                      <div className="flex flex-col gap-1.5">
                        {c.lifecycle?.map((step, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <span className="text-[10px] font-mono font-bold min-w-[40px] shrink-0" style={{ color: step.color }}>{step.day}</span>
                            <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: step.color }} />
                            <span className="text-[11px] text-[var(--text-secondary)] leading-[1.5]">{step.event}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ROW 3: Domain Anomalies + Attacker Infra ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Domain Age Anomalies */}
        <div className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl border border-[rgba(0,243,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Globe size={15} className="text-[var(--yellow)]" />
            <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[1px] text-[var(--text-primary)]">
              Domain Age Anomalies
            </h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {DOMAIN_ANOMALIES.map((d, i) => (
              <div key={i} className="flex justify-between items-center py-[11px] px-[14px] bg-[rgba(0,0,0,0.3)] rounded-md cursor-pointer border"
                style={{ borderColor: `${getSeverityColor(d.severity)}20` }}
                onClick={() => { setSearchQuery(d.domain); executeSearch(d.domain); }}>
                <div className="flex items-center gap-2.5">
                  <Globe size={12} color={getSeverityColor(d.severity)} />
                  <div>
                    <div className="text-[var(--text-primary)] font-mono text-xs">{d.domain}</div>
                    <div className="text-[#4a5568] text-[10px]">Reg: {d.registered}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#4a5568] text-[11px]">{d.age}</span>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold" style={{ color: getSeverityColor(d.severity) }}>{d.score}</div>
                    <div className="text-[#4a5568] text-[9px]">risk</div>
                  </div>
                  <SeverityBadge severity={d.severity} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attacker Infrastructure */}
        <div className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl border border-[rgba(0,243,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <ShieldAlert size={15} className="text-[var(--red)]" />
            <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[1px] text-[var(--text-primary)]">
              Repeated Attacker Infrastructure
            </h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {ATTACKER_INFRA.map((inf, i) => (
              <div key={i} className="flex justify-between items-center py-[11px] px-[14px] bg-[rgba(0,0,0,0.3)] rounded-md border border-[rgba(255,51,51,0.1)]">
                <div className="flex items-center gap-2.5">
                  <TrendingUp size={12} className="text-[var(--red)]" />
                  <div>
                    <div className="text-[var(--red)] font-mono text-xs drop-shadow-[0_0_5px_rgba(255,51,51,0.3)]">{inf.ip}</div>
                    <div className="text-[#4a5568] text-[10px]">{inf.asn} · {inf.country}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-[var(--text-primary)] text-[15px] font-mono font-bold">{inf.attacks}</div>
                    <div className="text-[#4a5568] text-[9px] uppercase">attacks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[var(--text-primary)] text-[15px] font-mono font-bold">{inf.campaigns}</div>
                    <div className="text-[#4a5568] text-[9px] uppercase">campaigns</div>
                  </div>
                  <div className="text-[#4a5568] text-[10px]">last: {inf.lastSeen}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── ROW 4: Threat Actor Attribution + IOC Reuse Frequency ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Threat Actor Attribution */}
        <div className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl border border-[rgba(0,243,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5">
          <div className="flex items-center gap-2.5 mb-[18px]">
            <TrendingUp size={15} color="#ff3333" />
            <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[1px] text-[var(--text-primary)]">
              Threat Actor Attribution
            </h3>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-[3px] bg-[rgba(255,215,0,0.1)] text-[#ffd700]">SIMULATED CTI</span>
          </div>
          <div className="flex flex-col gap-3">
            {THREAT_ACTORS_INTEL.map((actor, i) => (
              <div key={i} className="py-3 px-3.5 rounded-lg bg-[rgba(0,0,0,0.3)] border" style={{ borderColor: `${actor.color}20` }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[13px] font-bold mb-[2px]" style={{ color: actor.color }}>{actor.name}</div>
                    <div className="text-[10px] text-[#4a5568]">{actor.country} · {actor.ttps} TTPs · {actor.campaigns} campaigns</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-black font-mono" style={{ color: actor.color }}>{actor.confidence}%</div>
                    <div className="text-[9px] text-[#4a5568]">confidence</div>
                  </div>
                </div>
                <div className="h-1 bg-[rgba(255,255,255,0.05)] rounded-sm overflow-hidden">
                  <div className="h-full rounded-sm transition-[width] duration-800 ease-in-out" style={{ width: `${actor.confidence}%`, backgroundColor: actor.color, boxShadow: `0 0 6px ${actor.color}60` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* IOC Reuse Frequency */}
        <div className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl border border-[rgba(0,243,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5">
          <div className="flex items-center gap-2.5 mb-[18px]">
            <Radio size={15} className="text-[var(--yellow)]" />
            <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[1px] text-[var(--text-primary)]">
              IOC Reuse Frequency
            </h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {IOC_REUSE.map((ioc, i) => (
              <div key={i}
                onClick={() => { setSearchQuery(ioc.ioc); executeSearch(ioc.ioc); }}
                className="flex items-center gap-3 py-[11px] px-[14px] bg-[rgba(0,0,0,0.3)] rounded-md cursor-pointer border" style={{ borderColor: `${ioc.color}20` }}
              >
                <div className="min-w-[44px] text-center">
                  <span className="px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold" style={{ backgroundColor: `${ioc.color}15`, color: ioc.color }}>{ioc.type}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: ioc.color }}>{ioc.ioc}</div>
                  <div className="text-[#4a5568] text-[10px] mt-[2px]">First seen: {ioc.firstSeen}</div>
                </div>
                <div className="flex gap-3.5 items-center">
                  <div className="text-center">
                    <div className="text-[var(--text-primary)] text-[14px] font-mono font-bold">{ioc.campaigns}</div>
                    <div className="text-[#4a5568] text-[9px]">campaigns</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#ff3333] text-[14px] font-mono font-bold">{ioc.alerts}</div>
                    <div className="text-[#4a5568] text-[9px]">alerts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#ffd700] text-[14px] font-mono font-bold">{ioc.depts}</div>
                    <div className="text-[#4a5568] text-[9px]">depts</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── IOC DATABASE PANEL ── */}
      <div className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl border border-[rgba(0,243,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Database size={15} className="text-[var(--cyan)]" />
          <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[1px] text-[var(--text-primary)]">IOC Database</h3>
          <Tooltip text="Central repository of all Indicators of Compromise tracked by the threat intelligence engine.">
            <Info size={12} className="text-[var(--text-secondary)] cursor-help" />
          </Tooltip>
        </div>
        {/* Counts */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Domains', count: IOC_DATABASE.totals.domains, color: '#ff6b6b', icon: Globe },
            { label: 'IPs', count: IOC_DATABASE.totals.ips, color: '#ffa94d', icon: Server },
            { label: 'Hashes', count: IOC_DATABASE.totals.hashes, color: '#ffd700', icon: Hash },
            { label: 'Emails', count: IOC_DATABASE.totals.emails, color: '#00f3ff', icon: User },
          ].map((item, i) => (
            <Tooltip key={i} text={`${item.count} ${item.label.toLowerCase()} flagged as malicious/suspicious across all threat feeds.`}>
              <div className="p-3 bg-[rgba(0,0,0,0.3)] rounded-lg border border-[rgba(255,255,255,0.05)] text-center cursor-default w-full">
                <item.icon size={14} style={{ color: item.color }} className="mx-auto mb-1" />
                <div className="text-[20px] font-mono font-black" style={{ color: item.color }}>{item.count}</div>
                <div className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">{item.label}</div>
              </div>
            </Tooltip>
          ))}
        </div>
        {/* Recent IOCs */}
        <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">Recent IOCs</div>
        <div className="flex flex-col gap-1.5">
          {IOC_DATABASE.recent.map((ioc, i) => (
            <Tooltip key={i} text={`${ioc.type}: ${ioc.value} — classified as ${ioc.severity.toUpperCase()} risk. Added ${ioc.added}.`}>
              <div className="flex items-center gap-3 p-2.5 bg-[rgba(0,0,0,0.25)] rounded-md border border-[rgba(255,255,255,0.04)] cursor-default w-full">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: getSeverityColor(ioc.severity) + '20', color: getSeverityColor(ioc.severity) }}>{ioc.type}</span>
                <span className="flex-1 font-mono text-[11px]" style={{ color: getSeverityColor(ioc.severity) }}>{ioc.value}</span>
                <span className="text-[9px] text-[var(--text-secondary)]">{ioc.added}</span>
                <SeverityBadge severity={ioc.severity} />
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ── THREAT ACTOR PROFILES ── */}
      <div className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl border border-[rgba(0,243,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <User size={15} className="text-[#cc45ff]" />
          <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[1px] text-[var(--text-primary)]">Threat Actor Profiles</h3>
          <Tooltip text="Identified threat actor groups linked to active campaigns based on TTPs and IOC overlap.">
            <Info size={12} className="text-[var(--text-secondary)] cursor-help" />
          </Tooltip>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { name: 'APT-29 (Cozy Bear)', country: 'Russia 🇷🇺', confidence: 74, campaigns: 6, ttps: 4, color: '#ff3333', techniques: ['Spearphishing Link', 'Credential Harvesting', 'BEC', 'Lateral Movement'], desc: 'Nation-state actor linked to SVR intelligence service. Known for long-dwell espionage operations.' },
            { name: 'FIN7', country: 'Ukraine 🇺🇦', confidence: 68, campaigns: 4, ttps: 5, color: '#ffa94d', techniques: ['BEC Campaigns', 'Point-of-Sale Malware', 'Social Engineering'], desc: 'Financially-motivated group; known for large-scale BEC fraud and payment card theft.' },
            { name: 'TA505', country: 'Unknown (CIS) 🌍', confidence: 58, campaigns: 3, ttps: 3, color: '#ff6b6b', techniques: ['PDF Malware', 'Ransomware', 'Mass Phishing'], desc: 'Prolific cybercriminal actor responsible for distributing Clop ransomware and Dridex at scale.' },
            { name: 'SCATTERED SPIDER', country: 'Nigeria/UK 🌐', confidence: 51, campaigns: 2, ttps: 2, color: '#ffd700', techniques: ['SMS Phishing', 'SIM-Swapping'], desc: 'Threat actor targeting telecom/tech firms via social engineering and SIM-swap attacks.' },
          ].map((actor, i) => (
            <Tooltip key={i} text={actor.desc}>
              <div className="p-4 rounded-lg border cursor-default w-full" style={{ backgroundColor: `${actor.color}08`, borderColor: `${actor.color}25` }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: actor.color }}>{actor.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">{actor.country}</div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: `${actor.color}15`, border: `1px solid ${actor.color}30` }}>
                    <span className="text-[10px] font-bold" style={{ color: actor.color }}>Confidence</span>
                    <span className="text-[13px] font-mono font-black" style={{ color: actor.color }}>{actor.confidence}%</span>
                  </div>
                </div>
                {/* Confidence Bar */}
                <div className="h-1 bg-white/5 rounded-full mb-3">
                  <div className="h-full rounded-full" style={{ width: `${actor.confidence}%`, backgroundColor: actor.color, boxShadow: `0 0 8px ${actor.color}` }} />
                </div>
                {/* Stats */}
                <div className="flex gap-5 mb-2.5">
                  <div className="text-[10px] text-[var(--text-secondary)]">Campaigns: <strong className="text-white/80">{actor.campaigns}</strong></div>
                  <div className="text-[10px] text-[var(--text-secondary)]">TTPs: <strong className="text-white/80">{actor.ttps}</strong></div>
                </div>
                {/* Techniques */}
                <div className="flex flex-wrap gap-1.5">
                  {actor.techniques.map((t, j) => (
                    <span key={j} className="px-2 py-0.5 text-[9px] font-bold rounded border" style={{ backgroundColor: `${actor.color}10`, borderColor: `${actor.color}20`, color: actor.color }}>{t}</span>
                  ))}
                </div>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ── MITRE ATT&CK TECHNIQUE MAPPING ── */}
      <div className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl border border-[rgba(0,243,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Target size={15} className="text-[var(--red)]" />
          <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[1px] text-[var(--text-primary)]">MITRE ATT&amp;CK Technique Mapping</h3>
          <Tooltip text="Maps active campaign behaviors to the MITRE ATT&CK framework to identify attack stages and coverage gaps.">
            <Info size={12} className="text-[var(--text-secondary)] cursor-help" />
          </Tooltip>
        </div>
        <div className="flex flex-col gap-2.5">
          {MITRE_TECHNIQUES.map((tech, i) => (
            <Tooltip key={i} text={tech.description}>
              <div className="flex items-center gap-4 p-3 bg-[rgba(0,0,0,0.3)] rounded-lg border border-[rgba(255,255,255,0.04)] cursor-default w-full group hover:border-[rgba(0,243,255,0.15)] transition-all">
                <div className="shrink-0 px-2.5 py-1.5 text-center rounded-md" style={{ backgroundColor: `${tech.color}15`, border: `1px solid ${tech.color}30` }}>
                  <div className="text-[10px] font-mono font-black" style={{ color: tech.color }}>{tech.id}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[var(--text-primary)]">{tech.name}</div>
                  <div className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">{tech.tactic}</div>
                </div>
                {/* Occurrence bar */}
                <div className="flex items-center gap-2 w-32">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (tech.count / 30) * 100)}%`, backgroundColor: tech.color, boxShadow: `0 0 6px ${tech.color}` }} />
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: tech.color }}>{tech.count}</span>
                </div>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ── IOC CORRELATION VISUAL GRAPH ── */}
      <div className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl border border-[rgba(0,243,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Network size={15} className="text-[var(--cyan)]" />
          <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[1px] text-[var(--text-primary)]">IOC Correlation Graph</h3>
          <Tooltip text="Visual relationship graph showing how malicious domains, IPs, and campaigns are linked to each other.">
            <Info size={12} className="text-[var(--text-secondary)] cursor-help" />
          </Tooltip>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-5 mb-4">
          {[{ label: 'Malicious Domain', color: '#ff3333' }, { label: 'Malicious IP', color: '#ffa94d' }, { label: 'Campaign', color: '#cc45ff' }].map((l, i) => (
            <Tooltip key={i} text={`${l.label} — node type in the IOC correlation graph.`}>
              <div className="flex items-center gap-1.5 cursor-default">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color, boxShadow: `0 0 6px ${l.color}` }} />
                <span className="text-[10px] text-[var(--text-secondary)]">{l.label}</span>
              </div>
            </Tooltip>
          ))}
        </div>
        {/* Static visual correlation map (SVG replacement for D3) */}
        <div className="relative rounded-lg overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', minHeight: 240 }}>
          <svg viewBox="0 0 700 240" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
            {/* Links */}
            <line x1="200" y1="120" x2="350" y2="60" stroke="#ff3333" strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="350" y1="60" x2="500" y2="120" stroke="#ffa94d" strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="200" y1="120" x2="350" y2="180" stroke="#ff6b6b" strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="350" y1="180" x2="500" y2="120" stroke="#cc45ff" strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="500" y1="120" x2="600" y2="80" stroke="#ffd700" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="350" y1="60" x2="350" y2="180" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />
            {/* Labels on links */}
            <text x="268" y="78" fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="monospace">hosted on</text>
            <text x="406" y="78" fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="monospace">used in</text>
            <text x="260" y="162" fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="monospace">hosted on</text>
            <text x="408" y="165" fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="monospace">used in</text>
            <text x="344" y="120" fontSize="8" fill="rgba(255,255,255,0.2)" fontFamily="monospace">overlaps</text>
            {/* Nodes */}
            {/* Domain 1 */}
            <circle cx="200" cy="120" r="24" fill="#ff333315" stroke="#ff3333" strokeWidth="1.5" />
            <text x="200" y="116" textAnchor="middle" fontSize="7" fill="#ff3333" fontFamily="monospace">fake-login</text>
            <text x="200" y="126" textAnchor="middle" fontSize="7" fill="#ff3333" fontFamily="monospace">-page.com</text>
            <text x="200" y="152" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="monospace">Domain</text>
            {/* IP 1 */}
            <circle cx="350" cy="60" r="22" fill="#ffa94d15" stroke="#ffa94d" strokeWidth="1.5" />
            <text x="350" y="55" textAnchor="middle" fontSize="7" fill="#ffa94d" fontFamily="monospace">185.220</text>
            <text x="350" y="65" textAnchor="middle" fontSize="7" fill="#ffa94d" fontFamily="monospace">.101.47</text>
            <text x="350" y="90" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="monospace">IP</text>
            {/* Campaign 1 */}
            <circle cx="500" cy="120" r="28" fill="#cc45ff18" stroke="#cc45ff" strokeWidth="1.5" />
            <text x="500" y="115" textAnchor="middle" fontSize="7" fill="#cc45ff" fontFamily="monospace">APT-29</text>
            <text x="500" y="125" textAnchor="middle" fontSize="7" fill="#cc45ff" fontFamily="monospace">Campaign</text>
            <text x="500" y="155" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="monospace">Campaign</text>
            {/* Domain 2 */}
            <circle cx="200" cy="180" r="28" fill={"#ff6b6b15"} stroke="#ff6b6b" strokeWidth="1.5" />
            <text x="200" y="175" textAnchor="middle" fontSize="7" fill="#ff6b6b" fontFamily="monospace">microsoft</text>
            <text x="200" y="185" textAnchor="middle" fontSize="7" fill="#ff6b6b" fontFamily="monospace">-login.xyz</text>
            <text x="200" y="215" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="monospace">Domain</text>
            {/* IP 2 */}
            <circle cx="350" cy="180" r="22" fill="#ffd70015" stroke="#ffd700" strokeWidth="1.5" />
            <text x="350" y="175" textAnchor="middle" fontSize="7" fill="#ffd700" fontFamily="monospace">194.165</text>
            <text x="350" y="185" textAnchor="middle" fontSize="7" fill="#ffd700" fontFamily="monospace">.16.98</text>
            <text x="350" y="210" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="monospace">IP</text>
          </svg>
        </div>
        {/* Summary row */}
        <div className="flex gap-6 mt-4">
          {[
            { label: 'Nodes', value: GRAPH_NODES.length, tip: 'Total IOC and Campaign nodes visible in the correlation graph.' },
            { label: 'Relationships', value: GRAPH_LINKS.length, tip: 'Total relationships (edges) between IOC and Campaign nodes.' },
            { label: 'Campaigns Linked', value: 2, tip: 'Active threat campaigns connected to at least one IOC node.' },
          ].map((s, i) => (
            <Tooltip key={i} text={s.tip}>
              <div className="flex flex-col cursor-default">
                <span className="text-[18px] font-mono font-black text-[var(--cyan)]">{s.value}</span>
                <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">{s.label}</span>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* CSS animations for the pulse indicator */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #00ff9d; }
          50% { opacity: 0.5; box-shadow: 0 0 2px #00ff9d; }
        }
      `}</style>

    </div>
  );
};

export default ThreatIntelFusion;
