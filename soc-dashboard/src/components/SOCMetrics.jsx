import React from 'react';
import { Clock, Users, ArrowUpRight, ArrowDownRight, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const SOCMetrics = () => {
    const metrics = [
        {
            id: 'mttd',
            label: 'Mean Time to Detect (MTTD)',
            value: '2m 14s',
            trend: '-12%',
            trendDir: 'down', // good
            icon: Activity,
            color: 'var(--cyan)'
        },
        {
            id: 'mttr',
            label: 'Mean Time to Respond (MTTR)',
            value: '8m 45s',
            trend: '+5%',
            trendDir: 'up', // bad
            icon: Clock,
            color: 'var(--purple)'
        },
        {
            id: 'sla',
            label: 'SLA Breach Rate',
            value: '0.2%',
            trend: '0%',
            trendDir: 'neutral',
            icon: AlertTriangle,
            color: 'var(--green)' // Low is good
        },
        {
            id: 'analysts',
            label: 'Active Analysts',
            value: '12/15',
            trend: 'High Load',
            trendDir: 'neutral',
            icon: Users,
            color: 'var(--blue)'
        }
    ];

    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            {metrics.map((metric, index) => (
                <motion.div
                    key={metric.id}
                    className="card p-4 flex flex-col"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-mono uppercase text-[var(--text-secondary)]">
                            {metric.label}
                        </span>
                        <metric.icon size={16} color={metric.color} />
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-xl font-semibold text-[var(--text-primary)]">
                            {metric.value}
                        </span>

                        <div className="flex items-center justify-center gap-1">
                            {metric.trendDir === 'down' ? <ArrowDownRight size={14} color="var(--green)" /> :
                                metric.trendDir === 'up' ? <ArrowUpRight size={14} color="var(--red)" /> :
                                    null}
                            <span className={`text-xs ${metric.trendDir === 'down' ? 'text-[var(--green)]' : metric.trendDir === 'up' ? 'text-[var(--red)]' : 'text-[var(--text-secondary)]'}`}>
                                {metric.trend}
                            </span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default SOCMetrics;
