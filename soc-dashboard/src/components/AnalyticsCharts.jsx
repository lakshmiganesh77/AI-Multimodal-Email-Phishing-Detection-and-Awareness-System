import React, { useEffect, useRef, useState } from 'react';
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

const AnalyticsCharts = () => {
    const chartRef = useRef(null);
    const [gradientDetected, setGradientDetected] = useState(null);
    const [gradientBlocked, setGradientBlocked] = useState(null);
    const [expandedChart, setExpandedChart] = useState(false);

    useEffect(() => {
        const chart = chartRef.current;
        if (chart) {
            const ctx = chart.ctx;

            const detGrad = ctx.createLinearGradient(0, 0, 0, 400);
            detGrad.addColorStop(0, 'rgba(255, 51, 51, 0.5)');
            detGrad.addColorStop(1, 'rgba(255, 51, 51, 0)');
            setGradientDetected(detGrad);

            const blockGrad = ctx.createLinearGradient(0, 0, 0, 400);
            blockGrad.addColorStop(0, 'rgba(0, 243, 255, 0.5)');
            blockGrad.addColorStop(1, 'rgba(0, 243, 255, 0)');
            setGradientBlocked(blockGrad);
        }
    }, []);

    const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const data = {
        labels: dates,
        datasets: [
            {
                label: 'Detected',
                data: Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i / 2) * 50 + Math.random() * 40),
                borderColor: '#ff3333',
                backgroundColor: gradientDetected || 'rgba(255, 51, 51, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#ff3333',
                pointHoverBorderColor: '#fff'
            },
            {
                label: 'Blocked',
                data: Array.from({ length: 30 }, (_, i) => 90 + Math.sin((i + 2) / 2) * 50 + Math.random() * 30),
                borderColor: '#00f3ff',
                backgroundColor: gradientBlocked || 'rgba(0, 243, 255, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#00f3ff',
                pointHoverBorderColor: '#fff'
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    useBorderRadius: true,
                    borderRadius: 4,
                    color: '#8b949e',
                    font: { size: 12, family: 'Inter' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(13, 20, 30, 0.95)',
                titleColor: '#fff',
                bodyColor: '#8b949e',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                titleFont: { size: 13, weight: 'bold' },
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${Math.floor(context.raw)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.03)',
                    drawBorder: false
                },
                ticks: { color: '#484f58', font: { family: 'monospace' } },
                suggestedMin: 80
            },
            x: {
                grid: { display: false },
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
        <div className="bg-[rgba(13,17,23,0.6)] rounded-2xl p-6 border border-[rgba(0,243,255,0.1)] backdrop-blur-md h-full min-h-[350px] relative overflow-hidden">

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

            <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span>Threat Trend (30 Days)</span>
                <CustomTooltip
                    title="Threat Trend"
                    usedFor="Provides a high-level overview of the total volume of detected potential risks versus actual blocked threats over the last month."
                    interpret="Use this to monitor the overall threat landscape. A widening gap between Detected and Blocked indicates a growing volume of noise or low-confidence alerts."
                />
            </h2>
            <div className="h-[300px] w-full cursor-pointer transition-transform hover:scale-[1.01]" onDoubleClick={() => setExpandedChart(true)}>
                <Line ref={chartRef} data={data} options={options} />
            </div>
        </div>
    );
};

export default AnalyticsCharts;
