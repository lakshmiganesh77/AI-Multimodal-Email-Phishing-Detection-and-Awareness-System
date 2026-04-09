import React from 'react';
import { Shield, AlertTriangle, Activity, Target, DollarSign, Users, ShieldCheck } from 'lucide-react';

const StatsCards = ({ stats }) => {
    const cards = [
        {
            title: 'Threats Detected (24h)',
            value: stats.threats_detected || 156,
            icon: AlertTriangle,
            color: 'var(--color-red-neon)',
            trend: '12%',
            trendUp: false
        },
        {
            title: 'Block Rate',
            value: '99.7%',
            icon: Shield,
            color: 'var(--color-green-neon)',
            trend: '0.3%',
            trendUp: true
        },
        {
            title: 'AI Confidence',
            value: '94.2%',
            icon: Target,
            color: 'var(--color-cyan-neon)',
            trend: 'Stable',
            trendUp: true
        },
        {
            title: 'Est. Fraud Prevented',
            value: '$85,000',
            subtext: 'this week',
            icon: DollarSign,
            color: '#00ff9d',
            trend: 'BEC Blocked',
            trendUp: true
        },
        {
            title: 'High Risk Employees',
            value: '4 Users',
            subtext: 'Finance (3), HR (1)',
            icon: Users,
            color: '#ff3333',
            trend: 'Phish Clicks',
            trendUp: false
        },
        {
            title: 'Security Posture',
            value: '82 / 100',
            subtext: 'Maturity Score',
            icon: ShieldCheck,
            color: '#c084fc',
            trend: '+7 points',
            trendUp: true
        }
    ];

    return (
        <div className="grid grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div key={index} className="glass-card p-4 md:p-5 flex flex-col justify-between h-[110px] md:h-[120px] rounded-2xl border border-white/5 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-lg border" style={{
                                backgroundColor: `color-mix(in srgb, ${card.color} 10%, transparent)`,
                                borderColor: `color-mix(in srgb, ${card.color} 30%, transparent)`,
                            }}>
                                <Icon size={18} color={card.color} />
                            </div>
                            <span className={`badge ${card.trendUp ? 'badge-safe text-green-400 border-green-400/30 bg-green-400/10' : 'badge-critical'}`}>
                                {card.trendUp ? '↑' : '↓'} {card.trend}
                            </span>
                        </div>

                        <div>
                            <p className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                                {card.title}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-xl md:text-2xl font-bold text-white m-0 tracking-tight glow-text-cyan">
                                    {card.value}
                                </h3>
                                {card.subtext && (
                                    <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                                        {card.subtext}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Glow Effect */}
                        <div className="absolute -bottom-5 -right-5 w-20 h-20 rounded-full blur-[40px] opacity-10 pointer-events-none" style={{
                            background: card.color
                        }} />
                    </div>
                );
            })}
        </div>
    );
};

export default StatsCards;
