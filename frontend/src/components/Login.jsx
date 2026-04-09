import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login, authNotice, setAuthNotice } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setAuthNotice('');
        setLoading(true);
        try {
            await login(username, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.blob1} />
            <div style={styles.blob2} />

            <div style={styles.card}>
                <div style={styles.logoRow}>
                    <div style={styles.logoIcon}>Shield</div>
                    <div>
                        <div style={styles.logoTitle}>PhishGuard</div>
                        <div style={styles.logoSub}>Inbox Access</div>
                    </div>
                </div>

                <h2 style={styles.heading}>Sign in to continue</h2>
                <p style={styles.subheading}>Use your backend credentials to access the protected inbox.</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                            required
                            autoFocus
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            style={styles.input}
                        />
                    </div>

                    {error && <div style={styles.errorBox}>Warning: {error}</div>}
                    {!error && authNotice && <div style={styles.errorBox}>Warning: {authNotice}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p style={styles.footer}>
                    Keep frontend and backend on the same hostname family: `localhost` or `127.0.0.1`.
                </p>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a, #14213d, #1d3557)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Segoe UI', sans-serif",
    },
    blob1: {
        position: 'absolute',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(96,165,250,0.22) 0%, transparent 70%)',
        top: '-150px',
        left: '-100px',
        pointerEvents: 'none',
    },
    blob2: {
        position: 'absolute',
        width: 420,
        height: 420,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239,68,68,0.18) 0%, transparent 70%)',
        bottom: '-100px',
        right: '-80px',
        pointerEvents: 'none',
    },
    card: {
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 20,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        position: 'relative',
        zIndex: 1,
    },
    logoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 28,
    },
    logoIcon: {
        fontSize: 18,
        lineHeight: 1,
        color: '#bfdbfe',
        fontWeight: 700,
    },
    logoTitle: {
        fontSize: 24,
        fontWeight: 800,
        color: '#fff',
        letterSpacing: '-0.5px',
    },
    logoSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 2,
    },
    heading: {
        fontSize: 22,
        fontWeight: 700,
        color: '#fff',
        margin: '0 0 4px 0',
    },
    subheading: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.55)',
        margin: '0 0 28px 0',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: 0.3,
    },
    input: {
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 15,
        color: '#fff',
        outline: 'none',
    },
    errorBox: {
        background: 'rgba(239,68,68,0.15)',
        border: '1px solid rgba(239,68,68,0.35)',
        borderRadius: 8,
        padding: '10px 14px',
        color: '#fecaca',
        fontSize: 13,
    },
    button: {
        background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
        border: 'none',
        borderRadius: 10,
        padding: '14px',
        fontSize: 16,
        fontWeight: 700,
        color: '#fff',
        marginTop: 4,
        boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
    },
    footer: {
        marginTop: 28,
        textAlign: 'center',
        fontSize: 12,
        color: 'rgba(255,255,255,0.35)',
    },
};

export default Login;
