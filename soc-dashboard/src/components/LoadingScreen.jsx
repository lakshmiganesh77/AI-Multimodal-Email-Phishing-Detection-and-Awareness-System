import React, { useState, useEffect } from 'react';
import { Shield, Mail, Search, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingScreen = () => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const messages = [
        { icon: Mail, text: "Scanning incoming emails for threats..." },
        { icon: Search, text: "Analyzing suspicious patterns..." },
        { icon: AlertTriangle, text: "Detecting phishing attempts..." },
        { icon: Lock, text: "Verifying sender authenticity..." },
        { icon: CheckCircle, text: "Initializing threat intelligence..." },
        { icon: Shield, text: "Loading Security Operations Center..." }
    ];

    useEffect(() => {
        // Progress bar animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 2;
            });
        }, 50);

        // Message rotation
        const messageInterval = setInterval(() => {
            setCurrentMessageIndex(prev => (prev + 1) % messages.length);
        }, 1500);

        return () => {
            clearInterval(progressInterval);
            clearInterval(messageInterval);
        };
    }, []);

    const CurrentIcon = messages[currentMessageIndex].icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#1a1f35] flex items-center justify-center relative overflow-hidden">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] animate-grid-pulse z-0" />

            {/* Scanline Effect */}
            <div className="absolute top-0 left-0 right-0 h-full bg-[linear-gradient(transparent_50%,rgba(0,243,255,0.03)_50%)] bg-[length:100%_4px] animate-scanline pointer-events-none z-[1]" />

            {/* Loading Content */}
            <div className="relative z-[2] text-center max-w-[500px] p-5">
                {/* Animated Shield Logo */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-[120px] h-[120px] mx-auto mb-10 rounded-full bg-gradient-to-br from-[rgba(0,243,255,0.2)] to-[rgba(0,150,255,0.2)] border-[3px] border-[var(--cyan)] flex items-center justify-center shadow-[0_0_40px_rgba(0,243,255,0.5)] animate-glow"
                >
                    <Shield size={60} color="var(--cyan)" strokeWidth={2} />
                </motion.div>

                {/* Brand Name */}
                <h1 className="text-4xl font-bold text-white mb-3 tracking-[2px] [text-shadow:0_0_20px_rgba(0,243,255,0.5)]">
                    PHISHGUARD
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mb-[60px] font-medium tracking-[1px]">
                    Security Operations Center
                </p>

                {/* Rotating Messages */}
                <div className="h-20 mb-10 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentMessageIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="flex items-center gap-3"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <CurrentIcon size={24} color="var(--cyan)" />
                            </motion.div>
                            <span className="text-base text-[var(--text-primary)] font-medium">
                                {messages[currentMessageIndex].text}
                            </span>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-[400px] mx-auto">
                    <div className="w-full h-1.5 bg-white/10 rounded-[10px] overflow-hidden mb-3 border border-[rgba(0,243,255,0.2)]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-gradient-to-r from-[var(--cyan)] to-[#0096ff] shadow-[0_0_15px_rgba(0,243,255,0.6)] rounded-[10px]"
                        />
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)] font-semibold font-mono">
                        {progress}% COMPLETE
                    </p>
                </div>

                {/* Loading Dots */}
                <div className="mt-10 flex gap-2 justify-center">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            className="w-2 h-2 rounded-full bg-[var(--cyan)] shadow-[0_0_10px_rgba(0,243,255,0.6)]"
                        />
                    ))}
                </div>

                {/* Security Status */}
                <div className="mt-[60px] p-4 bg-[rgba(0,243,255,0.05)] border border-[rgba(0,243,255,0.2)] rounded-lg">
                    <p className="text-[11px] text-[var(--text-secondary)] m-0 font-semibold tracking-[0.5px]">
                        🔒 SECURE CONNECTION ESTABLISHED
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
