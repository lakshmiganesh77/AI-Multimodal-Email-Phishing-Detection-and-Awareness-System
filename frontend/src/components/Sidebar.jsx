import React, { useState } from 'react';
import { Inbox, Star, Clock, Send, File, AlertOctagon, Trash2, ChevronDown, Pencil, Upload, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useToast } from './Toast';
import api, { classifyApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ onEmailUploaded, filterBy, onFilterChange }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [stats, setStats] = useState({ total_scans: 0, malicious_count: 0 });
  const toast = useToast();
  const { logout } = useAuth();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 20MB.');
      event.target.value = '';
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.task_id) {
        toast.info('Deep analysis queued. Polling backend status...');
        let isDone = false;
        let analysisResult = null;
        let attempts = 0;
        const maxAttempts = 60;

        while (!isDone && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
          const statusRes = await api.get(`/analyze/status/${response.data.task_id}`);

          if (statusRes.data.status === 'done') {
            isDone = true;
            analysisResult = statusRes.data.analysis;
          } else if (statusRes.data.status === 'failed') {
            throw new Error(statusRes.data.error || 'Background analysis failed.');
          }
        }

        if (!isDone) {
          throw new Error('Analysis timed out. Make sure the Celery worker is running.');
        }

        const label = analysisResult?.label || 'UNKNOWN';
        const riskScore = analysisResult?.risk_score || 0;

        if (label === 'PHISHING') {
          toast.error(`Critical phishing detected. Score: ${riskScore}/100`);
        } else if (label === 'SUSPICIOUS') {
          toast.warning(`Suspicious email detected. Score: ${riskScore}/100`);
        } else {
          toast.success(`Threat assessment: ${label} (${riskScore}/100)`);
        }

        if (onEmailUploaded && typeof onEmailUploaded === 'function') {
          onEmailUploaded();
        }
      } else {
        const analysis = response.data.analysis || response.data;
        const label = analysis.label || 'UNKNOWN';
        if (label === 'PHISHING') toast.warning('Phishing detected.');
        else toast.success(`Email analyzed. Result: ${label}`);
      }
    } catch (err) {
      const apiError = classifyApiError(err);
      setUploadError(apiError.message);
      if (apiError.kind === 'unauthorized') {
        logout(apiError.message);
      } else {
        toast.error(`Upload failed: ${apiError.message}`);
      }
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/user/stats');
      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      const apiError = classifyApiError(err);
      if (apiError.kind === 'unauthorized') {
        logout(apiError.message);
        return;
      }
      console.error('Failed to fetch sidebar stats:', err);
    }
  };

  React.useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUploadWrapper = async (e) => {
    await handleFileUpload(e);
    fetchStats();
  };

  return (
    <aside style={{
      width: '256px',
      backgroundColor: 'var(--bg-paper)',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px',
      height: '100%',
      transition: 'background-color 0.3s'
    }}>
      <div style={{ padding: '8px 0 16px 8px' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#c2e7ff',
            color: '#001d35',
            padding: '16px 24px',
            borderRadius: '16px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            minWidth: '140px',
            boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
            transition: 'box-shadow 0.2s, background-color 0.2s'
          }}
          onClick={() => toast.info('Compose feature coming soon.')}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px 0 rgba(60,64,67,0.3), 0 8px 12px 6px rgba(60,64,67,0.15)';
            e.currentTarget.style.backgroundColor = '#b3d7ef';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)';
            e.currentTarget.style.backgroundColor = '#c2e7ff';
          }}
        >
          <Pencil size={24} strokeWidth={2} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Compose</span>
        </button>
      </div>

      <div style={{ padding: '0 8px 16px 8px' }}>
        <label htmlFor="email-upload" style={{
          display: 'flex',
          width: '100%',
          textAlign: 'center',
          padding: '10px',
          borderRadius: '24px',
          border: '1px solid #747775',
          color: '#0b57d0',
          fontWeight: '500',
          fontSize: '14px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
          onMouseEnter={(e) => !uploading && (e.currentTarget.style.backgroundColor = '#f0f4f9')}
          onMouseLeave={(e) => !uploading && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Upload size={18} />
          <span>{uploading ? 'Analyzing...' : 'Upload & Scan Email'}</span>
        </label>
        <input
          id="email-upload"
          type="file"
          accept=".eml,.msg,.txt"
          onChange={handleFileUploadWrapper}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        {uploadError && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#d93025' }}>
            {uploadError}
          </div>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
        <NavItem icon={<Inbox size={20} />} label="Inbox" count={stats.total_scans || 0} active={filterBy === 'all'} onClick={() => onFilterChange && onFilterChange('all')} />
        <NavItem icon={<ShieldAlert size={20} color="#c5221f" />} label="Phishing" active={filterBy === 'phishing'} onClick={() => onFilterChange && onFilterChange('phishing')} />
        <NavItem icon={<AlertTriangle size={20} color="#b45309" />} label="Suspicious" active={filterBy === 'suspicious'} onClick={() => onFilterChange && onFilterChange('suspicious')} />

        <div style={{ height: '16px' }} />

        <NavItem icon={<Star size={20} />} label="Starred" active={filterBy === 'starred'} onClick={() => onFilterChange && onFilterChange('starred')} />
        <NavItem icon={<Clock size={20} />} label="Snoozed" active={filterBy === 'snoozed'} onClick={() => onFilterChange && onFilterChange('snoozed')} />
        <NavItem icon={<Send size={20} />} label="Sent" active={filterBy === 'sent'} onClick={() => onFilterChange && onFilterChange('sent')} />
        <NavItem icon={<File size={20} />} label="Drafts" active={filterBy === 'drafts'} onClick={() => onFilterChange && onFilterChange('drafts')} />
        <NavItem icon={<AlertOctagon size={20} />} label="Spam" count={stats.malicious_count > 0 ? stats.malicious_count : null} active={filterBy === 'spam'} onClick={() => onFilterChange && onFilterChange('spam')} />
        <NavItem icon={<Trash2 size={20} />} label="Trash" active={filterBy === 'trash'} onClick={() => onFilterChange && onFilterChange('trash')} />
        <NavItem icon={<ChevronDown size={20} />} label="More" />
      </nav>
    </aside>
  );
};

const NavItem = ({ icon, label, count, active, onClick }) => {
  const [hover, setHover] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderRadius: '0 24px 24px 0',
        cursor: 'pointer',
        backgroundColor: active ? 'var(--active-bg)' : (hover ? 'var(--hover-bg)' : 'transparent'),
        color: active ? 'var(--active-text)' : 'var(--text-secondary)',
        fontWeight: active ? '700' : '400',
        fontSize: '14px',
        marginRight: '8px',
        transition: 'background-color 0.1s ease-in-out, color 0.1s'
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
        <span>{label}</span>
      </div>
      {count && <span style={{ fontSize: '12px', fontWeight: '600' }}>{count}</span>}
    </div>
  );
};

export default Sidebar;
