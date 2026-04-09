import React, { useRef, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import CustomTooltip from './CustomTooltip';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const TrafficAnalysis = ({ onExplain }) => {
    const chartRef = useRef(null);
    const [gradientTraffic, setGradientTraffic] = useState(null);
    const [gradientThreats, setGradientThreats] = useState(null);
    const [expandedChart, setExpandedChart] = useState(false);

    useEffect(() => {
        const chart = chartRef.current;
        if (chart) {
            const ctx = chart.ctx;

            // Create gradients
            const trafficGrad = ctx.createLinearGradient(0, 0, 0, 400);
            trafficGrad.addColorStop(0, 'rgba(0, 243, 255, 0.4)');
            trafficGrad.addColorStop(1, 'rgba(0, 243, 255, 0)');
            setGradientTraffic(trafficGrad);

            const threatsGrad = ctx.createLinearGradient(0, 0, 0, 400);
            threatsGrad.addColorStop(0, 'rgba(255, 51, 51, 0.4)');
            threatsGrad.addColorStop(1, 'rgba(255, 51, 51, 0)');
            setGradientThreats(threatsGrad);
        }
    }, []);

    // Generate 24 hours of data
    const labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

    const trafficData = labels.map((_, i) => {
        const base = 40;
        const trend = Math.sin((i / 23) * Math.PI * 2) * 10;
        let random = Math.random() * 15;
        let val = base + trend + random + (i > 9 && i < 17 ? 20 : 0);

        if (i === 10) val += 120; // Simultaneous spike
        if (i === 14) val -= 10; // Low traffic during targeted attack

        return Math.floor(Math.max(val, 0));
    });

    const threatData = labels.map((_, i) => {
        const base = 10;
        const trend = Math.sin((i / 23) * Math.PI * 2) * 5;
        let random = Math.random() * 8;
        let val = base + trend + random + (i > 12 && i < 16 ? 10 : 0);

        if (i === 10) val += 60; // Simultaneous attack
        if (i === 14) val += 90; // Targeted attack (low traffic, high threat)

        return Math.floor(Math.max(val, 0));
    });

    const loadData = labels.map((_, i) => {
        // Correlates with traffic
        return Math.floor(20 + (trafficData[i] * 0.4) + Math.random() * 5);
    });

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Traffic Volume',
                data: trafficData,
                borderColor: '#00f3ff', // Cyan
                backgroundColor: gradientTraffic || 'rgba(0, 243, 255, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#00f3ff',
                pointBorderColor: '#00f3ff',
                pointRadius: 0,
                pointHoverRadius: 6
            },
            {
                label: 'System Load',
                data: loadData,
                borderColor: '#0077be', // Blue
                borderDash: [5, 5],
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4
            },
            {
                label: 'Threats Detected',
                data: threatData,
                borderColor: '#ff3333', // Red
                backgroundColor: gradientThreats || 'rgba(255, 51, 51, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: labels.map((_, i) => (i === 10 || i === 14 ? '#ffd700' : '#ff3333')),
                pointBorderColor: labels.map((_, i) => (i === 10 || i === 14 ? '#fff' : '#ff3333')),
                pointRadius: labels.map((_, i) => (i === 10 || i === 14 ? 6 : 0)),
                pointHoverRadius: 8
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'center',
                labels: {
                    usePointStyle: true,
                    color: '#8b949e',
                    font: { size: 12, family: 'Inter' },
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(13, 20, 30, 0.95)',
                titleColor: '#00f3ff',
                bodyColor: '#fff',
                borderColor: 'rgba(0, 243, 255, 0.3)',
                borderWidth: 1,
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                displayColors: false,
                intersect: false,
                mode: 'index',
                callbacks: {
                    label: function (context) {
                        let label = `${context.dataset.label}: ${context.raw}`;
                        if (context.dataset.label === 'Threats Detected') {
                            if (context.dataIndex === 10) label += ' (⚠️ DDOS + Malware Volume Spike)';
                            if (context.dataIndex === 14) label += ' (🎯 Targeted Phishing Campaign)';
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: { color: '#484f58', font: { family: 'monospace' } },
                suggestedMin: 0
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#484f58',
                    font: { family: 'monospace' },
                    maxTicksLimit: 8
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        }
    };

    return (
        <div className="card h-full p-6 flex flex-col relative">

            {/* Modal Overlay for Expanded Chart */}
            {expandedChart && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setExpandedChart(false)}
                >
                    <div
                        className="w-[90vw] h-[90vh] glass-card rounded-2xl border border-[rgba(0,243,255,0.1)] p-8 flex flex-col relative bg-[#121926]/90"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors z-[60]"
                            onClick={() => setExpandedChart(false)}
                        >
                            ✕
                        </button>
                        <div className="flex-1 min-h-0 w-full h-full p-4">
                            <Line data={data} options={{ ...options, maintainAspectRatio: false }} />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-5">
                <div>
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                        <div className="w-1 h-4 bg-[var(--cyan)]" />
                        <span>REAL-TIME TRAFFIC ANALYSIS</span>
                        <CustomTooltip
                            title="Traffic Analysis"
                            usedFor="Correlates overall network traffic volume against system load and the rate of incoming threats within the last 24 hours."
                            interpret="Watch for anomalies where Threat Volume spikes independently of Traffic Volume, which strongly suggests a targeted attack rather than background noise."
                        />
                    </h3>
                    <p className="text-xs text-secondary ml-3 mt-1">
                        Network volume vs. detected threats over time.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="badge bg-[var(--bg-hover)] border border-[var(--border-color)] cursor-pointer">
                        Live Feed
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-[200px] w-full cursor-pointer transition-transform hover:scale-[1.01]" onDoubleClick={() => setExpandedChart(true)}>
                <Line ref={chartRef} data={data} options={options} />
            </div>
        </div>
    );
};

export default TrafficAnalysis;
