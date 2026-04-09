import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { Square, CheckSquare, Star, RefreshCw, Search, X, Trash2, Archive, ShieldAlert } from 'lucide-react';
import { useToast } from './Toast';
import { getPlainEnglishReasons } from '../utils';
import { useWebSocket } from '../contexts/WebSocketContext';
import api, { classifyApiError } from '../lib/api';

const EmailList = ({ onSelectEmail, selectedEmail, searchQuery: externalSearchQuery, onSearchChange, filterBy, refreshTrigger }) => {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date-desc');
    const [selectedEmails, setSelectedEmails] = useState(new Set());
    const [analysisModalEmail, setAnalysisModalEmail] = useState(null);
    const toast = useToast();
    const { lastMessage } = useWebSocket();

    const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : searchQuery;
    const handleSearchChange = onSearchChange || setSearchQuery;

    const fetchEmails = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const response = await api.get('/soc/recent');
            setEmails(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            const apiError = classifyApiError(err);
            setEmails([]);
            setError(apiError.message || 'Failed to load emails.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await api.get('/imap/check');
            toast.success('Checked for new emails.');
        } catch (err) {
            const apiError = classifyApiError(err);
            toast.error(apiError.message);
        }

        await fetchEmails(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchEmails(true);
    }, [refreshTrigger]);

    useEffect(() => {
        if (lastMessage && lastMessage.type === 'new_alert') {
            const newEmail = lastMessage.alert;
            setEmails((prev) => {
                if (prev.find((e) => e.id === newEmail.id)) return prev;
                return [newEmail, ...prev];
            });

            if (newEmail.label === 'PHISHING') {
                toast.error(`Critical phishing alert: ${newEmail.sender}`);
            } else if (newEmail.label === 'SUSPICIOUS') {
                toast.warning(`Suspicious email: ${newEmail.sender}`);
            }
        }
    }, [lastMessage, toast]);

    const processedEmails = useMemo(() => {
        let filtered = [...emails];

        if (activeSearchQuery.trim()) {
            const query = activeSearchQuery.toLowerCase();
            filtered = filtered.filter((email) =>
                email.sender?.toLowerCase().includes(query) ||
                email.subject?.toLowerCase().includes(query) ||
                email.body?.toLowerCase().includes(query)
            );
        }

        if (filterBy === 'phishing') filtered = filtered.filter((email) => email.label === 'PHISHING');
        else if (filterBy === 'suspicious') filtered = filtered.filter((email) => email.label === 'SUSPICIOUS');
        else if (filterBy === 'safe') filtered = filtered.filter((email) => email.label === 'SAFE');

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc': return new Date(b.created_at) - new Date(a.created_at);
                case 'date-asc': return new Date(a.created_at) - new Date(b.created_at);
                case 'sender': return (a.sender || '').localeCompare(b.sender || '');
                case 'risk': return (b.risk_score || 0) - (a.risk_score || 0);
                default: return 0;
            }
        });

        return filtered;
    }, [emails, activeSearchQuery, sortBy, filterBy]);

    const handleSelectAll = () => {
        if (selectedEmails.size === processedEmails.length) {
            setSelectedEmails(new Set());
        } else {
            setSelectedEmails(new Set(processedEmails.map((email) => email.id)));
        }
    };

    const handleSelectEmail = (id) => {
        const nextSelected = new Set(selectedEmails);
        if (nextSelected.has(id)) nextSelected.delete(id);
        else nextSelected.add(id);
        setSelectedEmails(nextSelected);
    };

    const handleBulkDelete = async () => {
        try {
            const emailIds = Array.from(selectedEmails).join(',');
            const response = await api.delete(`/emails/delete?email_ids=${emailIds}`);
            if (response.data.success) {
                toast.success(`Deleted ${response.data.deleted_count} email(s).`);
                setSelectedEmails(new Set());
                fetchEmails();
            } else {
                toast.error('Failed to delete emails.');
            }
        } catch (err) {
            const apiError = classifyApiError(err);
            toast.error(apiError.message);
        }
    };

    const handleBulkArchive = () => {
        const archivedIds = new Set(selectedEmails);
        setEmails((prev) => prev.filter((email) => !archivedIds.has(email.id)));
        toast.success(`Archived ${selectedEmails.size} email(s).`);
        setSelectedEmails(new Set());
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (loading && emails.length === 0) {
        return (
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '16px',
                backgroundColor: 'white', borderRadius: '16px', margin: '8px'
            }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{
                        width: '40px', height: '40px',
                        border: '4px solid #f0f0f0', borderTop: '4px solid #1a73e8',
                        borderRadius: '50%'
                    }}
                />
                <p style={{ color: '#5f6368' }}>Loading secure inbox...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '16px',
                backgroundColor: 'white', borderRadius: '16px', margin: '8px', padding: '32px'
            }}>
                <p style={{ color: '#d93025', fontSize: '16px' }}>{error}</p>
                <button onClick={() => fetchEmails(true)} style={{
                    padding: '10px 20px', backgroundColor: '#1a73e8', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
                }}>Retry</button>
            </div>
        );
    }

    return (
        <div style={{
            flex: 1, backgroundColor: 'var(--bg-paper)', borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid var(--border-color)', display: 'flex',
            flexDirection: 'column', overflow: 'hidden', margin: '8px',
            transition: 'background-color 0.3s, border-color 0.3s'
        }}>
            <div style={{
                padding: '16px', borderBottom: '1px solid #f0f0f0',
                display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        onClick={handleSelectAll}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5f6368' }}
                        title="Select all"
                    >
                        {selectedEmails.size === processedEmails.length && processedEmails.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center',
                        backgroundColor: 'var(--input-bg)', borderRadius: '12px',
                        padding: '10px 16px', gap: '12px', transition: 'all 0.2s',
                        border: '1px solid transparent'
                    }}>
                        <Search size={20} style={{ color: '#5f6368' }} />
                        <input
                            type="text"
                            placeholder="Search emails..."
                            value={activeSearchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            style={{
                                flex: 1, border: 'none', background: 'transparent',
                                outline: 'none', fontSize: '15px', color: 'var(--text-primary)'
                            }}
                        />
                        {activeSearchQuery && (
                            <button onClick={() => handleSearchChange('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5f6368' }}>
                                <X size={18} />
                            </button>
                        )}
                    </div>
                    <motion.button
                        whileHover={{ scale: refreshing ? 1 : 1.05 }}
                        whileTap={{ scale: refreshing ? 1 : 0.95 }}
                        onClick={handleRefresh}
                        disabled={refreshing}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: refreshing ? '#d0e1fd' : '#e8f0fe',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: refreshing ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#1a73e8',
                            fontSize: '14px',
                            fontWeight: '500',
                            opacity: refreshing ? 0.8 : 1
                        }}
                    >
                        <motion.div
                            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                            transition={refreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
                        >
                            <RefreshCw size={20} />
                        </motion.div>
                        {refreshing && <span>Processing...</span>}
                    </motion.button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            padding: '6px 12px', backgroundColor: 'var(--input-bg)',
                            border: '1px solid var(--border-color)', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', outline: 'none'
                        }}
                    >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="sender">Sender A-Z</option>
                        <option value="risk">Highest Risk</option>
                    </select>

                    {selectedEmails.size > 0 && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleBulkDelete} style={actionButton('#d93025')}>
                                <Trash2 size={16} /> Delete
                            </button>
                            <button onClick={handleBulkArchive} style={actionButton('#5f6368')}>
                                <Archive size={16} /> Archive
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {processedEmails.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: '#5f6368' }}>
                        <p style={{ fontSize: '16px' }}>No emails found</p>
                    </div>
                ) : (
                    <motion.div key={filterBy} variants={container} initial="hidden" animate="show">
                        <AnimatePresence mode="popLayout">
                            {processedEmails.map((email) => (
                                <motion.div key={email.id} variants={item} layout>
                                    <EmailRow
                                        email={email}
                                        isSelected={selectedEmails.has(email.id)}
                                        onSelect={() => handleSelectEmail(email.id)}
                                        onClick={() => onSelectEmail(email)}
                                        isActive={selectedEmail?.id === email.id}
                                        onQuickAnalysis={() => setAnalysisModalEmail(email)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {analysisModalEmail && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '24px', backdropFilter: 'blur(4px)',
                            overflowY: 'auto'
                        }}
                        onClick={() => setAnalysisModalEmail(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            style={{
                                backgroundColor: '#111827', borderRadius: '16px', padding: '32px',
                                maxWidth: '600px', width: '100%', color: 'white',
                                maxHeight: 'calc(100vh - 48px)',
                                overflowY: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid #374151'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <ShieldAlert size={32} color={analysisModalEmail.risk_score > 70 ? '#EF4444' : '#F59E0B'} />
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#F9FAFB' }}>Security Scan Result</h2>
                                        <div style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '4px' }}>Safe Preview Mode</div>
                                    </div>
                                </div>
                                <button onClick={() => setAnalysisModalEmail(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #374151' }}>
                                <div style={{ color: '#9CA3AF', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: '600' }}>Threat Level</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontSize: '36px', fontWeight: '800', lineHeight: 1, color: analysisModalEmail.risk_score > 70 ? '#EF4444' : '#F59E0B' }}>
                                        {analysisModalEmail.risk_score}
                                    </span>
                                    <span style={{ fontSize: '16px', color: '#6B7280' }}>/ 100</span>
                                </div>
                            </div>

                            <div style={{ color: '#9CA3AF', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontWeight: '600' }}>Why this email is dangerous</div>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '20px', border: '1px solid #374151' }}>
                                <ul style={{ margin: 0, paddingLeft: '24px', color: '#E5E7EB', fontSize: '15px', lineHeight: '1.6' }}>
                                    {getPlainEnglishReasons(parseReasons(analysisModalEmail.reasons)).map((reason, idx) => (
                                        <li key={idx} style={{ marginBottom: '8px', paddingLeft: '4px' }}>{reason}</li>
                                    ))}
                                </ul>

                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                    borderLeft: '4px solid #EF4444',
                                    borderRadius: '0 8px 8px 0',
                                    color: '#FCA5A5',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    If you interact with this email, your credentials, device, or data may be at risk.
                                </div>

                                <details style={{ marginTop: '18px' }}>
                                    <summary style={{
                                        cursor: 'pointer',
                                        color: '#60A5FA',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        outline: 'none',
                                        display: 'inline-block'
                                    }}>
                                        See Technical Analysis
                                    </summary>
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '16px',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#9CA3AF',
                                        border: '1px solid #374151',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        {buildTechnicalReasons(analysisModalEmail).map((reason, index) => (
                                            <div key={index}>- {reason}</div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const actionButton = (color) => ({
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color,
    fontSize: '13px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '6px'
});

const parseReasons = (rawReasons) => {
    if (Array.isArray(rawReasons)) return rawReasons;
    if (typeof rawReasons !== 'string') return [];
    try {
        return JSON.parse(rawReasons);
    } catch {
        try {
            return JSON.parse(rawReasons.replace(/'/g, '"'));
        } catch {
            return rawReasons.split(',').map((reason) => reason.trim()).filter(Boolean);
        }
    }
};

const buildTechnicalReasons = (email) => {
    const parsedReasons = parseReasons(email.reasons).map((reason) => {
        if (typeof reason !== 'string') return JSON.stringify(reason);
        return reason
            .replace(/\\u([\d\w]{4})/gi, (_, grp) => String.fromCharCode(parseInt(grp, 16)))
            .replace(/\\n/g, ' ')
            .replace(/\\"/g, '"')
            .replace(/^"|"$/g, '')
            .trim();
    }).filter(Boolean);

    return parsedReasons.length > 0 ? parsedReasons : ['No technical indicators were returned by the backend for this email.'];
};

const formatSender = (senderString) => {
    if (!senderString) return 'Unknown Sender';
    const match = senderString.match(/^(.*?)\s*<.*?>$/);
    if (match && match[1]) {
        return match[1].replace(/"/g, '').trim();
    }
    if (senderString.includes('@')) {
        return senderString.split('@')[0];
    }
    return senderString;
};

const EmailRow = ({ email, isSelected, onSelect, onClick, isActive, onQuickAnalysis }) => {
    const isPhishing = email.label === 'PHISHING';
    const isSuspicious = email.label === 'SUSPICIOUS';
    const dateObj = new Date(email.created_at || Date.now());
    const isToday = new Date().toDateString() === dateObj.toDateString();
    const displayDate = isToday
        ? dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const cleanSender = formatSender(email.sender);

    const getSnippetText = () => {
        let text = email.body || email.body_html || '';
        if (!text) return '(no content)';
        return text.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().substring(0, 100);
    };

    return (
        <motion.div
            whileHover={{
                boxShadow: 'inset 1px 0 0 var(--border-color), inset -1px 0 0 var(--border-color), 0 1px 2px 0 rgba(0,0,0,0.1), 0 1px 3px 1px rgba(0,0,0,0.1)',
                zIndex: 1,
                backgroundColor: 'var(--hover-bg)'
            }}
            style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 16px', borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer', backgroundColor: isActive ? 'var(--active-bg)' : (isSelected ? 'var(--input-bg)' : 'var(--bg-paper)'),
                transition: 'background-color 0.1s',
                height: '40px'
            }}
            onClick={onClick}
        >
            <div
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dadce0', minWidth: '40px' }}
            >
                {isSelected ? <CheckSquare size={18} style={{ color: '#0b57d0' }} /> : <Square size={18} />}
                <Star size={18} />
            </div>

            <div style={{
                width: '180px',
                fontWeight: isActive ? '700' : '600',
                fontSize: '14px',
                color: isActive ? 'var(--active-text)' : 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {cleanSender}
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                {isPhishing && (
                    <span style={{ backgroundColor: '#fce8e6', color: '#c5221f', padding: '0 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', height: '16px', display: 'flex', alignItems: 'center' }}>
                        PHISHING
                    </span>
                )}
                {isSuspicious && (
                    <span style={{ backgroundColor: '#fef7e0', color: '#ea8600', padding: '0 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', height: '16px', display: 'flex', alignItems: 'center' }}>
                        SUSPICIOUS
                    </span>
                )}

                <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {email.subject || '(no subject)'}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>-</span>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                    {getSnippetText()}
                </span>

                {(isPhishing || isSuspicious) && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); onQuickAnalysis(); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
                            backgroundColor: isPhishing ? '#fce8e6' : '#fef7e0',
                            color: isPhishing ? '#c5221f' : '#ea8600',
                            border: '1px solid ' + (isPhishing ? '#f8d0cb' : '#fce8b2'),
                            borderRadius: '16px', cursor: 'pointer', fontSize: '11px', fontWeight: '700',
                            marginLeft: '8px', flexShrink: 0
                        }}
                    >
                        <ShieldAlert size={12} /> SAFE PREVIEW
                    </motion.button>
                )}
            </div>

            <div style={{
                fontSize: '12px',
                color: isActive ? 'var(--active-text)' : 'var(--text-secondary)',
                fontWeight: isActive ? '700' : '500',
                minWidth: '60px',
                textAlign: 'right'
            }}>
                {displayDate}
            </div>
        </motion.div>
    );
};

export default EmailList;
