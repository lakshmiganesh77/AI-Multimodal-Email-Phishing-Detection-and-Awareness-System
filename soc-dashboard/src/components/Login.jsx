import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                sessionStorage.setItem('soc_token', data.access_token);
                sessionStorage.setItem('soc_authenticated', 'true');
                onLogin();
            } else {
                const err = await res.json().catch(() => ({}));
                const errorMessage = typeof err.detail === 'string'
                    ? err.detail
                    : (Array.isArray(err.detail) ? 'Invalid request format. Check backend.' : 'Invalid credentials. Use admin / 1234');
                setError(errorMessage);
                setIsLoading(false);
            }
        } catch (err) {
            setError('System integrity check failed: Backend unreachable.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center relative overflow-hidden font-inter selection:bg-cyan-neon/30">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-neon/10 rounded-full blur-[150px] animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '6s' }} />

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:32px_32px] z-0 opacity-50 pointer-events-none" />

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[420px] p-6"
            >
                <div className="glass-card rounded-[24px] p-10 border border-cyan-neon/20 shadow-[0_0_40px_rgba(0,243,255,0.05)] relative overflow-hidden bg-[#0a0e17]/80 backdrop-blur-xl">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-neon to-transparent shadow-[0_0_10px_rgba(0,243,255,0.5)]" />

                    {/* Logo & Header */}
                    <div className="flex flex-col items-center text-center mb-10">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-20 h-20 mb-6 rounded-2xl bg-[#00f3ff]/5 border border-cyan-neon/30 shadow-[0_0_20px_rgba(0,243,255,0.15)] flex items-center justify-center transition-all"
                        >
                            <Shield size={36} className="text-cyan-neon drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
                        </motion.div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-1">
                            Phish<span className="text-cyan-neon glow-text-cyan">Guard</span>
                        </h1>
                        <p className="text-[10px] font-bold text-cyan-neon/70 uppercase tracking-[0.3em] flex items-center gap-2">
                            <Activity size={10} className="animate-pulse" />
                            Security Operations Center
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2 px-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Operator ID</label>
                            </div>
                            <div className="relative group">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-neon transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    required
                                    className="w-full h-12 pl-12 pr-4 bg-[#131b2c]/80 border border-[#1a1f2e] rounded-xl text-white text-sm outline-none transition-all duration-300 focus:border-cyan-neon/50 focus:bg-[#131b2c] focus:shadow-[0_0_15px_rgba(0,243,255,0.1)] font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2 px-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Access Key</label>
                            </div>
                            <div className="relative group">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-neon transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full h-12 pl-12 pr-4 bg-[#131b2c]/80 border border-[#1a1f2e] rounded-xl text-white text-sm outline-none transition-all duration-300 focus:border-cyan-neon/50 focus:bg-[#131b2c] focus:shadow-[0_0_15px_rgba(0,243,255,0.1)] font-medium"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3 mt-2">
                                <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                                <span className="text-red-400 text-[11px] font-medium leading-tight">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full h-12 rounded-xl text-[#052e25] text-xs font-black tracking-widest uppercase transition-all duration-300 relative overflow-hidden active:scale-[0.98] group mt-4
                                ${isLoading
                                    ? 'bg-cyan-neon/50 cursor-wait'
                                    : 'bg-cyan-neon hover:bg-[#00e5f2] shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_25px_rgba(0,243,255,0.5)]'}`}
                        >
                            {isLoading ? 'Establishing Link...' : 'Initiate Access'}
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none opacity-20" />
                        </button>
                    </form>

                    {/* Footer Credentials */}
                    <div className="mt-8 pt-8 border-t border-[#1a1f2e] flex flex-col items-center gap-3">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">Authorized Access Only</span>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-[#131b2c] border border-[#1a1f2e] rounded text-[10px] font-mono text-gray-400">ID: admin</span>
                            <span className="px-2 py-1 bg-[#131b2c] border border-[#1a1f2e] rounded text-[10px] font-mono text-gray-400">KEY: 1234</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
