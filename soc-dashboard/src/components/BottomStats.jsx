import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Zap } from 'lucide-react';

const BottomStats = () => {
    const statsGroups = [
        {
            title: '7-Day Stats',
            icon: Activity,
            metrics: [
                { label: 'Threats Detected', value: '1,247' },
                { label: 'Emails Processed', value: '52,847' },
                { label: 'False Positives', value: '0.02%', highlight: '#00ff9d' }
            ],
            color: '#00f3ff'
        },
        {
            title: 'Response Times',
            icon: Zap,
            metrics: [
                { label: 'Avg Detection', value: '1.2s' },
                { label: 'Avg Analysis', value: '0.8s' },
                { label: 'Avg Response', value: '2.1s' }
            ],
            color: '#ffd700'
        },
        {
            title: '30-Day Summary',
            icon: Clock,
            metrics: [
                { label: 'Threats Blocked', value: '4,892' },
                { label: 'Attack Campaigns', value: '23' },
                { label: 'Zero-Day Catches', value: '7', highlight: '#ff3333' }
            ],
            color: '#ff3333'
        }
    ];

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5 mt-6">
            {statsGroups.map((group, index) => {
                const Icon = group.icon;
                return (
                    <motion.div
                        key={group.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-[rgba(20,30,40,0.6)] backdrop-blur-[10px] rounded-xl p-6 border border-[rgba(0,243,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden"
                        whileHover={{
                            translateY: -5,
                            boxShadow: `0 12px 40px rgba(0,0,0,0.4), inset 0 0 0 1px ${group.color}40`
                        }}
                    >
                        {/* Top Gradient Line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px]"
                            style={{ background: `linear-gradient(90deg, transparent, ${group.color}, transparent)` }}
                        />

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{
                                    backgroundColor: `${group.color}15`,
                                    border: `1px solid ${group.color}30`,
                                    boxShadow: `0 0 15px ${group.color}20`
                                }}>
                                <Icon size={20} color={group.color} />
                            </div>
                            <h4 className="text-[var(--text-primary)] text-base font-semibold tracking-[0.5px] m-0">
                                {group.title}
                            </h4>
                        </div>

                        <div className="flex flex-col gap-4">
                            {group.metrics.map((metric, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <span className="text-[var(--text-secondary)] text-[13px]">
                                        {metric.label}
                                    </span>
                                    <span className="text-base font-bold font-mono"
                                        style={{
                                            color: metric.highlight || 'var(--text-primary)',
                                            textShadow: metric.highlight ? `0 0 10px ${metric.highlight}60` : 'none'
                                        }}>
                                        {metric.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default BottomStats;
