import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatsCards from './components/StatsCards';
import SOCMetrics from './components/SOCMetrics';
import MitreMatrix from './components/MitreMatrix';
import IncidentsTable from './components/IncidentsTable';
import AlertPanel from './components/AlertsPanel';
import ThreatFeed from './components/ThreatFeed';
import XAIAnalysis from './components/XAIAnalysis';
import ThreatIntelFusion from './components/ThreatIntelFusion';
import BottomStats from './components/BottomStats';
import RiskAnalytics from './components/RiskAnalytics';
import ExecutiveAnalytics from './components/ExecutiveAnalytics';
import AlertsAndQuarantine from './components/AlertsAndQuarantine';
import Chatbot from './components/Chatbot';
import TrafficAnalysis from './components/TrafficAnalysis';
import Login from './components/Login';
import LoadingScreen from './components/LoadingScreen';
import EmailAnalyzer from './components/EmailAnalyzer';
import BusinessImpactPanel from './components/BusinessImpactPanel';
import AnalystWorkloadDashboard from './components/AnalystWorkloadDashboard';
import RedTeamSimulator from './components/RedTeamSimulator';
import DetectionEngineering from './components/DetectionEngineering';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Shield, AlertTriangle, Brain, Database, BarChart3,
  Target, MessageSquare, Activity, Settings, Mail, Users, Cpu, Crosshair, Clock
} from 'lucide-react';

const getBaseURL = () => {
  const host = window.location.hostname;
  return `http://${host}:8000`;
};
const API_BASE = import.meta.env.VITE_API_BASE_URL || getBaseURL();

// Axios Interceptor for injecting JWT
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('soc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.withCredentials = true;
  return config;
}, (error) => Promise.reject(error));

// Axios Interceptor for catching 401 Unauthorized (expired token)
axios.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    // Token invalid or expired
    sessionStorage.removeItem('soc_authenticated');
    sessionStorage.removeItem('soc_token');
    window.location.reload();
  }
  return Promise.reject(error);
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Both flags must exist for valid session
    return sessionStorage.getItem('soc_authenticated') === 'true' && sessionStorage.getItem('soc_token') !== null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('triage');
  const [stats, setStats] = useState({});
  const [timeRange, setTimeRange] = useState('24H');
  const [chatbotQuestion, setChatbotQuestion] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const [systemHealth, setSystemHealth] = useState({ api: 'checking', db: 'checking' });

  // Map time range label to days for the API
  const timeRangeToDays = { '1H': 1, '24H': 1, '7D': 7, 'Custom': 30 };

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const days = timeRangeToDays[timeRange] || 7;
      axios.get(`${API_BASE}/soc/stats?days=${days}`)
        .then(res => setStats(res.data))
        .catch(err => console.error('Failed to fetch stats:', err));
    }
  }, [isAuthenticated, isLoading, timeRange]);

  // Poll /health every 30 seconds
  useEffect(() => {
    const checkHealth = () => {
      axios.get(`${API_BASE}/health`, { timeout: 5000 })
        .then(res => setSystemHealth({
          api: res.data.status === 'ok' ? 'Operational' : 'Degraded',
          db: res.data.db === 'ok' ? 'Connected' : 'Error'
        }))
        .catch(() => setSystemHealth({ api: 'Offline', db: 'Unknown' }));
    };
    if (isAuthenticated) {
      checkHealth();
      const interval = setInterval(checkHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Handle successful login (called by Login.jsx after it sets localStorage)
  const handleLogin = () => {
    setIsAuthenticated(true);
    navigate('/triage', { replace: true });
  };

  // Function to handle "Explain" button clicks
  const handleExplainClick = (question) => {
    setChatbotQuestion(question);
    setActiveTab('chatbot');
  };

  // Show Login Screen
  if (!isAuthenticated && !isLoading) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Show Loading Screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  const tabs = [
    { id: 'triage', label: 'Alert Triage', icon: AlertTriangle },
    { id: 'investigations', label: 'Investigations', icon: Target },
    { id: 'threat_intel', label: 'Threat Intel', icon: Database },
    { id: 'xai_analysis', label: 'Explainable AI', icon: Brain },
    { id: 'analytics', label: 'Executive Analytics', icon: BarChart3 },
    { id: 'risk_analytics', label: 'Risk Analytics', icon: Activity },
    { id: 'analyst_ops', label: 'Analyst Ops', icon: Users },
    { id: 'red_team', label: 'Red Team', icon: Crosshair },
    { id: 'detection_eng', label: 'Detection Engineering', icon: Cpu },
    { id: 'chatbot', label: 'Chatbot Assist', icon: MessageSquare }
  ];

  return (
    <div className="flex h-screen bg-[#0a0e17] font-inter text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0e17] border-r border-[#1a1f2e] flex flex-col z-30 shrink-0">
        {/* Logo */}
        <div className="py-6 px-5 mb-2">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-cyan-neon" />
            <h1 className="text-xl font-bold tracking-wider text-cyan-neon uppercase">
              PhishGuard
            </h1>
          </div>
          <div className="text-[10px] text-gray-500 font-semibold tracking-[0.2em] uppercase pl-9 leading-relaxed mt-1">
            Security Operations<br />Center
          </div>
        </div>

        {/* Navigation */}
        <div className="px-5 mb-2 mt-4">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Main Menu</span>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const pathName = location.pathname.split('/')[1];
            const isActive = pathName === tab.id || (location.pathname === '/' && tab.id === 'triage');
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(`/${tab.id}`);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all
                  ${isActive
                    ? 'bg-[#101b23] text-white font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-[#101b23]/50 border border-transparent'}`}
              >
                <Icon size={16} className={isActive ? "text-[#0ea5e9]" : "text-gray-500"} />
                <span className="tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="p-4 m-4 rounded-xl bg-[#131b2c]/50 border border-[#1a1f2e]">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-cyan-neon" />
            <span className="text-sm font-semibold text-white">System Status</span>
          </div>
          <div className="space-y-3">
            {[
              {
                label: 'API',
                status: systemHealth.api,
                color: systemHealth.api === 'Operational'
                  ? 'text-green-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]'
                  : systemHealth.api === 'checking' ? 'text-yellow-400' : 'text-red-400'
              },
              {
                label: 'Database',
                status: systemHealth.db,
                color: systemHealth.db === 'Connected'
                  ? 'text-green-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]'
                  : systemHealth.db === 'checking' ? 'text-yellow-400' : 'text-red-400'
              },
              { label: 'ML Engine', status: 'Active', color: 'text-green-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]' }
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{item.label}</span>
                <span className={`text-xs font-medium ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('soc_authenticated');
              sessionStorage.removeItem('soc_token');
              setIsAuthenticated(false);
              navigate('/login', { replace: true });
            }}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold rounded-lg border border-red-500/20 transition-all uppercase tracking-wider"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0a0e17]">
        {/* Header */}
        <header className="h-24 shrink-0 border-b border-[#1a1f2e] px-8 flex items-center justify-between z-20">
          <div className="flex flex-col">
            <h2 className="text-[22px] font-bold text-white tracking-wide">
              {tabs.find(t => t.id === (location.pathname.split('/')[1] || 'triage'))?.label || 'Alert Triage'}
            </h2>
            <div className="text-sm text-gray-400 mt-1">
              Real-time phishing detection and threat monitoring
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex bg-[#131b2c] rounded-lg border border-[#1a1f2e] p-1">
              {['1H', '24H', '7D', 'Custom'].map(time => (
                <button
                  key={time}
                  onClick={() => setTimeRange(time)}
                  className={`px-4 py-1.5 text-[11px] font-semibold tracking-wider rounded-md transition-all
                    ${time === timeRange
                      ? 'bg-[#1a2333] text-white'
                      : 'text-gray-400 hover:text-white'}`}
                >
                  {time}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-[#052e25] border border-green-neon/30 text-green-neon text-[11px] font-bold rounded-lg uppercase tracking-widest glow-green shadow-[inset_0_0_8px_rgba(0,255,157,0.2)]">
              <Activity size={14} />
              Systems Online
            </button>
          </div>
        </header>

        {/* Content Panel */}
        <section className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/triage" replace />} />
            <Route path="/login" element={<Navigate to="/triage" replace />} />
            <Route path="/triage" element={<AlertsAndQuarantine onCorrelate={ioc => localStorage.setItem('pending_correlation_ioc', ioc)} />} />
            <Route path="/investigations" element={<EmailAnalyzer isInvestigationView={true} />} />
            <Route path="/threat_intel" element={<ThreatIntelFusion />} />
            <Route path="/xai_analysis" element={<XAIAnalysis />} />
            <Route path="/analytics" element={<ExecutiveAnalytics stats={stats} onExplain={handleExplainClick} />} />
            <Route path="/risk_analytics" element={<RiskAnalytics />} />
            <Route path="/analyst_ops" element={<AnalystWorkloadDashboard />} />
            <Route path="/red_team" element={<RedTeamSimulator />} />
            <Route path="/detection_eng" element={<DetectionEngineering />} />
            <Route path="/chatbot" element={<Chatbot initialQuestion={chatbotQuestion} onQuestionHandled={() => setChatbotQuestion(null)} />} />
            <Route path="*" element={<Navigate to="/triage" replace />} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

export default App;
