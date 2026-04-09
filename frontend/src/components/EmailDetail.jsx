import React, { useEffect } from 'react';
import { ArrowLeft, Mail, AlertTriangle, CheckCircle2, Paperclip, Eye, ShieldAlert, Trash2, Ban } from 'lucide-react';
import { useToast } from './Toast';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { getPlainEnglishReasons } from '../utils';
import api, { classifyApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const EmailDetail = ({ email, onBack }) => {
    const toast = useToast();
    const { logout } = useAuth();

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') onBack();
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onBack]);

    if (!email) {
        return (
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', gap: '16px', backgroundColor: 'var(--bg-paper)', borderRadius: '16px', margin: '8px'
            }}>
                <Mail size={64} strokeWidth={1.5} />
                <p style={{ fontSize: '18px', fontWeight: '500' }}>Select an email to view</p>
            </div>
        );
    }

    const isPhishing = email.label === 'PHISHING';
    const isSuspicious = email.label === 'SUSPICIOUS';
    const isSafe = email.label === 'SAFE';
    const displayDate = new Date(email.created_at || Date.now()).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const reasons = parseReasons(email.reasons);

    const submitFeedback = async (label, successMessage, unauthorizedMessage) => {
        try {
            const response = await api.post('/feedback', { email_id: email.id, label });
            if (response.data.success) {
                toast.success(successMessage);
            } else {
                toast.error(response.data.error || 'Feedback failed.');
            }
        } catch (error) {
            const apiError = classifyApiError(error);
            if (apiError.kind === 'unauthorized') {
                logout(unauthorizedMessage || apiError.message);
                return;
            }
            toast.error(apiError.message);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
                flex: 1, backgroundColor: 'var(--bg-paper)', borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '8px',
                transition: 'background-color 0.3s, border-color 0.3s'
            }}
        >
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-paper)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={onBack} style={{
                        padding: '8px', borderRadius: '50%', border: 'none', background: 'var(--input-bg)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)'
                    }}>
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    {!isSafe && (
                        <button
                            onClick={() => submitFeedback('SAFE', 'Marked as safe.', 'Session expired. Please sign in again.')}
                            style={feedbackButton('var(--bg-paper)', 'var(--success-text)', '1px solid var(--border-color)')}
                        >
                            <CheckCircle2 size={16} /> Mark Safe
                        </button>
                    )}

                    {!isPhishing && (
                        <button
                            onClick={() => submitFeedback('PHISHING', 'Reported as phishing.', 'Session expired. Please sign in again.')}
                            style={feedbackButton('#fce8e6', '#d93025', '1px solid transparent')}
                        >
                            <AlertTriangle size={16} /> Report Phishing
                        </button>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
                    {!isSafe && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                backgroundColor: isPhishing ? '#fce8e6' : '#fef7e0',
                                border: `1px solid ${isPhishing ? '#ea4335' : '#fbbc04'}`,
                                borderRadius: '16px',
                                padding: '24px',
                                marginBottom: '32px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ marginTop: '2px' }}>
                                        {isPhishing ? <ShieldAlert size={28} color="#d93025" /> : <AlertTriangle size={28} color="#f29900" />}
                                    </div>
                                    <div>
                                        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold', color: isPhishing ? '#d93025' : '#b06000' }}>
                                            {isPhishing ? 'This email is likely a scam' : 'This email looks highly suspicious'}
                                        </h2>
                                        <p style={{ margin: 0, fontSize: '15px', color: '#202124', fontWeight: '500' }}>
                                            Do not click links or download attachments.
                                        </p>
                                    </div>
                                </div>
                                <div style={{
                                    backgroundColor: 'rgba(0,0,0,0.05)', padding: '6px 12px', borderRadius: '20px',
                                    fontSize: '13px', fontWeight: '600', color: '#5f6368', whiteSpace: 'nowrap'
                                }}>
                                    Confidence: {email.risk_score > 80 ? 'High' : 'Medium'} ({email.risk_score}%)
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                <button style={actionButton('#d93025', 'white')}>
                                    <Trash2 size={18} /> Delete Email
                                </button>
                                <button style={actionButton('#f1f3f4', '#202124', '1px solid #dadce0')}>
                                    <Ban size={18} /> Block Sender
                                </button>
                            </div>

                            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#202124' }}>
                                    Why this email is dangerous
                                </h3>
                                <ul style={{ margin: 0, paddingLeft: '24px', color: '#202124', fontSize: '15px', lineHeight: '1.6' }}>
                                    {getPlainEnglishReasons(reasons).map((reason, idx) => (
                                        <li key={idx} style={{ marginBottom: '8px', paddingLeft: '4px' }}>{reason}</li>
                                    ))}
                                </ul>

                                <details style={{ marginTop: '18px' }}>
                                    <summary style={{
                                        cursor: 'pointer',
                                        color: '#1a73e8',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        outline: 'none',
                                        display: 'inline-block'
                                    }}>
                                        Technical analysis
                                    </summary>
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '16px',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#5f6368',
                                        border: '1px solid #e5e7eb',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        {buildTechnicalReasons(email).map((reason, index) => (
                                            <div key={index}>- {reason}</div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        </motion.div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.4', marginBottom: '16px' }}>
                            {email.subject || 'No Subject'}
                        </h1>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: '700', fontSize: '16px', flexShrink: 0
                                }}>
                                    {(email.sender || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1F2937', fontSize: '15px' }}>
                                        {(email.sender || 'Unknown Sender').split('<')[0].replace(/"/g, '')}
                                    </div>
                                    <div style={{ color: '#6B7280', fontSize: '13px' }}>
                                        {(email.sender || '').includes('<') ? `<${email.sender.split('<')[1]}` : (email.sender || 'Unknown Sender')}
                                    </div>
                                    <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '2px' }}>
                                        to me
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', color: '#6B7280', fontSize: '13px' }}>
                                {displayDate}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        fontSize: '15px', lineHeight: '1.7', color: 'var(--text-primary)', minHeight: '200px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                    }}>
                        {email.body_html ? (
                            <div style={{
                                background: '#fff',
                                borderRadius: '8px',
                                padding: '16px',
                                border: '1px solid #e8eaed',
                                color: '#202124'
                            }}>
                                <div
                                    style={{ color: '#202124' }}
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(
                                            `<style>
                                                body, table, td, div, p, span, a, font { color: #202124 !important; }
                                                a { color: #1a73e8 !important; }
                                            </style>${email.body_html}`
                                        )
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ whiteSpace: 'pre-wrap' }}>{email.body}</div>
                        )}
                    </div>

                    {email.attachments && email.attachments.length > 0 && (
                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Paperclip size={16} /> Attachments ({email.attachments.length})
                            </h4>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {email.attachments.map((att, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px',
                                        backgroundColor: '#F9FAFB', minWidth: '200px'
                                    }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '6px',
                                            backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px'
                                        }}>
                                            {att.filename && att.filename.includes('.') ? att.filename.split('.').pop().substring(0, 3).toUpperCase() : 'FILE'}
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }} title={att.filename}>
                                                {att.filename || 'Unknown File'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                                {att.size ? (att.size > 1024 * 1024 ? (att.size / (1024 * 1024)).toFixed(1) + ' MB' : (att.size / 1024).toFixed(1) + ' KB') : 'Unknown Size'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {email.steps && email.steps.length > 0 && (
                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Eye size={16} /> Live Analysis Log
                            </h4>
                            <div style={{
                                backgroundColor: '#1e1e1e', color: '#00ff41', padding: '16px', borderRadius: '8px',
                                fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6', overflowX: 'auto'
                            }}>
                                {email.steps.map((step, index) => (
                                    <div key={index}>{step}</div>
                                ))}
                                <div style={{ color: '#fff', marginTop: '8px' }}>&gt; Analysis finished.</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

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

const feedbackButton = (backgroundColor, color, border) => ({
    padding: '8px 16px',
    backgroundColor,
    color,
    border,
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
});

const actionButton = (backgroundColor, color, border = 'none') => ({
    padding: '10px 24px',
    backgroundColor,
    color,
    border,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
});

export default EmailDetail;
