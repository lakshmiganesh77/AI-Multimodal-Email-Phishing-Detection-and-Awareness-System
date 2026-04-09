import React, { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, PointElement,
    LineElement, RadialLinearScale, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';
import { Activity, Target, Clock, Shield, AlertTriangle, Globe, Mail, Users, Thermometer } from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import CustomTooltip from './CustomTooltip';
import DetectionPerformanceMatrix from './DetectionPerformanceMatrix';

// --- Attack source data for the world map ---
const ATTACK_SOURCES = {
    RUS: { name: 'Russia', attacks: 59, pct: 38, color: '#ff2222', note: 'APT-29 — Phishing & BEC ops', coords: [37.6, 55.75] },
    CHN: { name: 'China', attacks: 37, pct: 24, color: '#ff6b00', note: 'Credential harvesting, C2', coords: [104.2, 35.9] },
    BRA: { name: 'Brazil', attacks: 19, pct: 12, color: '#ffd700', note: 'Botnet C2 infrastructure', coords: [-51.9, -14.2] },
    NGA: { name: 'Nigeria', attacks: 30, pct: 19, color: '#ff9900', note: 'CEO impersonation, wire fraud', coords: [8.7, 9.1] },
    IRN: { name: 'Iran', attacks: 12, pct: 8, color: '#ff4444', note: 'State-sponsored spearphishing', coords: [53.7, 32.4] },
};

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, PointElement,
    LineElement, RadialLinearScale, ArcElement, Title, Tooltip, Legend, Filler
);

// Helper styles to match dark neon theme
const tooltipStyle = {
    backgroundColor: 'rgba(13, 17, 23, 0.95)',
    titleColor: '#e6edf3',
    bodyColor: '#8b949e',
    borderColor: 'rgba(0,243,255,0.2)',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8,
    displayColors: true,
};

const axisStyle = {
    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
    ticks: { color: '#6b7280', font: { family: 'Inter', size: 10 } },
    border: { display: false },
};

export default function RiskAnalytics() {
    const [expandedChart, setExpandedChart] = useState(null);
    const [mapExpanded, setMapExpanded] = useState(false);

    // 1. Attack Vector Distribution (Horizontal Bar - Percentage)
    const attackVectorData = {
        labels: ['Credential Harvesting', 'Malware', 'Business Email Compromise', 'Other'],
        datasets: [{
            label: 'Percentage',
            data: [48, 24, 20, 8],
            backgroundColor: ['#C12A34', '#c084fc', '#ffd700', '#6b7280'],
            borderWidth: 0,
            barThickness: 24,
            borderRadius: 4,
        }],
    };
    const attackVectorOptions = {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
            legend: { display: false },
            tooltip: { ...tooltipStyle, callbacks: { label: (ctx) => `${ctx.raw}% of Attacks` } }
        },
        scales: {
            x: { ...axisStyle, max: 100, ticks: { ...axisStyle.ticks, callback: (v) => v + '%' } },
            y: { ...axisStyle, grid: { display: false }, ticks: { color: '#8b949e', font: { family: 'Inter', size: 11 } } },
        },
    };

    // 2. AI Confidence Distribution (Vertical Bar with Quality)
    const aiConfData = {
        labels: ['90-100%', '80-89%', '70-79%', '60-69%', '<60%'],
        datasets: [{
            label: 'Alert Count',
            data: [450, 220, 140, 80, 40],
            backgroundColor: (ctx) => {
                const val = ctx.raw;
                if (ctx.dataIndex === 0) return '#00ff9d'; // high conf stays green
                if (ctx.dataIndex >= 3) return '#ff3333'; // low conf turns red 
                return '#148b97';
            },
            borderWidth: 1,
            borderColor: '#00f3ff',
            barPercentage: 0.7,
            borderRadius: 4
        }]
    };
    const aiConfOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: tooltipStyle },
        scales: {
            x: { ...axisStyle, grid: { display: false } },
            y: { ...axisStyle, min: 0, max: 500, ticks: { stepSize: 100, ...axisStyle.ticks } },
        },
    };

    // 3. Capabilities (Radar Chart - With Score Labels)
    const capabilitiesData = {
        labels: [
            ['Credential Theft', '92%'],
            ['BEC Detection', '54%'],
            ['Malware', '89%'],
            ['URL Analysis', '87%'],
            ['Attachment Scan', '61%'],
            ['Domain Check', '85%']
        ],
        datasets: [{
            label: 'Capability Score',
            data: [92, 54, 89, 87, 61, 85],
            backgroundColor: 'rgba(0, 153, 255, 0.2)',
            borderColor: '#0099ff',
            borderWidth: 2,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#0099ff',
            pointRadius: 4,
        }]
    };
    const capabilitiesOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { ...tooltipStyle, callbacks: { label: (ctx) => `Score: ${ctx.raw}%` } }
        },
        scales: {
            r: {
                angleLines: { color: 'rgba(255,255,255,0.1)' },
                grid: { color: 'rgba(255,255,255,0.1)' },
                pointLabels: { color: '#8b949e', font: { size: 10, family: 'Inter', weight: 'bold' } },
                ticks: { display: false, min: 0, max: 100 },
            }
        }
    };

    // 4. Threat Level (Gauge + Formula)
    const threatGaugeData = {
        labels: ['Risk', 'Safe'],
        datasets: [{
            data: [67, 33],
            backgroundColor: (context) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;
                if (context.dataIndex === 0) {
                    const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                    gradient.addColorStop(0, '#00ff9d'); // Green
                    gradient.addColorStop(0.5, '#ffd700'); // Yellow
                    gradient.addColorStop(1, '#ff3366'); // Red
                    return gradient;
                }
                return '#2d3342';
            },
            borderWidth: 0,
            circumference: 180,
            rotation: 270,
            cutout: '80%',
        }],
    };
    const threatGaugeOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
    };

    // 5. Weekly Heatmap (Hover values)
    const heatmapCols = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const heatmapData = [
        [{ v: 3, c: '#10b981' }, { v: 12, c: '#eab308' }, { v: 9, c: '#eab308' }, { v: 17, c: '#ef4444' }, { v: 4, c: '#10b981' }, { v: 21, c: '#ef4444' }, { v: 18, c: '#ef4444' }],
        [{ v: 2, c: '#10b981' }, { v: 19, c: '#ef4444' }, { v: 8, c: '#eab308' }, { v: 11, c: '#eab308' }, { v: 15, c: '#ef4444' }, { v: 14, c: '#ef4444' }, { v: 10, c: '#eab308' }],
        [{ v: 5, c: '#10b981' }, { v: 7, c: '#10b981' }, { v: 14, c: '#eab308' }, { v: 12, c: '#eab308' }, { v: 8, c: '#eab308' }, { v: 25, c: '#ef4444' }, { v: 22, c: '#ef4444' }],
        [{ v: 1, c: '#10b981' }, { v: 3, c: '#10b981' }, { v: 5, c: '#10b981' }, { v: 8, c: '#eab308' }, { v: 10, c: '#eab308' }, { v: 19, c: '#ef4444' }, { v: 16, c: '#ef4444' }]
    ];

    // 6. Response Time Metric Trend (MTTD, MTTA, MTTR)
    const responseTimeData = {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        datasets: [
            {
                label: 'MTTR (min)',
                data: [32, 28, 45, 29, 25, 27, 28],
                borderColor: '#ef4444',
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
            },
            {
                label: 'MTTA (min)',
                data: [6, 4, 12, 5, 4, 4, 5],
                borderColor: '#eab308',
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
            },
            {
                label: 'MTTD (sec)',
                data: [15, 12, 14, 12, 11, 12, 13],
                borderColor: '#0ea5e9',
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
                yAxisID: 'y1', // secondary axis for seconds
                pointRadius: 0,
            }
        ]
    };
    const responseTimeOptions = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: tooltipStyle
        },
        scales: {
            x: { ...axisStyle, grid: { display: false } },
            y: { ...axisStyle, min: 0, max: 60, title: { display: true, text: 'Minutes', color: '#6b7280', font: { size: 9 } } },
            y1: { ...axisStyle, min: 0, max: 30, position: 'right', grid: { display: false }, title: { display: true, text: 'Seconds (MTTD)', color: '#6b7280', font: { size: 9 } } }
        }
    };

    // 7. Threat Severity Distribution
    const severityData = {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
            data: [12, 18, 31, 44],
            backgroundColor: ['#ff3333', '#ff6b6b', '#ffd700', '#00ff9d'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };
    const severityOptions = {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        plugins: {
            legend: { position: 'right', labels: { color: '#8b949e', font: { family: 'Inter', size: 10 }, padding: 15, usePointStyle: true, pointStyle: 'circle' } },
            tooltip: tooltipStyle
        }
    };

    // 8. Top Targeted Departments
    const deptData = {
        labels: ['Finance', 'HR', 'Engineering', 'Sales'],
        datasets: [{
            label: 'Attacks (%)',
            data: [35, 22, 18, 15],
            backgroundColor: '#c084fc',
            borderRadius: 4,
            barPercentage: 0.5
        }]
    };
    const deptOptions = {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: { ...tooltipStyle, callbacks: { label: (ctx) => `${ctx.raw}% of Attacks` } } },
        scales: {
            x: { ...axisStyle, max: 50, ticks: { ...axisStyle.ticks, callback: (v) => v + '%' } },
            y: { ...axisStyle, grid: { display: false } }
        }
    };

    // 9. Threat Source Geography
    const geoData = {
        labels: ['Russia', 'China', 'Brazil', 'Nigeria', 'Iran'],
        datasets: [{
            label: 'Attacks',
            data: [842, 651, 320, 215, 140],
            backgroundColor: 'rgba(255, 51, 51, 0.2)',
            borderColor: '#ff3333',
            borderWidth: 1,
            fill: true,
            tension: 0.4
        }]
    };
    const geoOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: tooltipStyle },
        scales: {
            x: { ...axisStyle, grid: { display: false } },
            y: { ...axisStyle, display: false }
        }
    };


    const renderChart = (chartId, ChartComponent, data, options, extraClass = "") => (
        <div className={`flex-1 min-h-0 ${extraClass}`} onDoubleClick={() => setExpandedChart({ id: chartId, Component: ChartComponent, data, options })}>
            <ChartComponent data={data} options={options} />
        </div>
    );

    return (
        <div className="flex flex-col gap-4 pb-8 animate-in fade-in duration-500 relative">

            {/* Modal Overlay for Expanded Chart */}
            {expandedChart && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setExpandedChart(null)}
                >
                    <div
                        className="w-[90vw] h-[90vh] glass-card rounded-2xl border border-white/10 p-8 flex flex-col relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"
                            onClick={() => setExpandedChart(null)}
                        >
                            ✕
                        </button>
                        <div className="flex-1 min-h-0 w-full h-full p-4">
                            <expandedChart.Component
                                data={expandedChart.data}
                                options={{
                                    ...expandedChart.options,
                                    maintainAspectRatio: false,
                                    plugins: { ...expandedChart.options.plugins, legend: { display: true, labels: { color: '#8b949e', font: { family: 'Inter' } } } }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── World Map Fullscreen Modal ── */}
            {mapExpanded && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setMapExpanded(false)}
                >
                    <div
                        className="relative w-[95vw] max-w-[1100px] rounded-2xl border border-white/10 flex flex-col p-6"
                        style={{ background: '#0d1117', boxShadow: '0 0 60px rgba(255,50,50,0.15)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Globe size={16} className="text-[#ff3333]" />
                                <h2 className="text-[13px] font-bold text-white tracking-widest uppercase">Threat Source Geography</h2>
                            </div>
                            <button
                                className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"
                                onClick={() => setMapExpanded(false)}
                            >✕</button>
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 mb-4">
                            {Object.values(ATTACK_SOURCES).map((src, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: src.color, boxShadow: `0 0 6px ${src.color}` }} />
                                    <span className="text-[11px] text-gray-300 font-mono">{src.name}</span>
                                    <span className="text-[11px] font-mono font-black" style={{ color: src.color }}>{src.pct}%</span>
                                </div>
                            ))}
                        </div>
                        {/* Full-size map */}
                        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', height: '60vh' }}>
                            <ComposableMap
                                projection="geoMercator"
                                projectionConfig={{ scale: 160, center: [15, 20] }}
                                style={{ width: '100%', height: '100%' }}
                            >
                                <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={6}>
                                    <Geographies geography={GEO_URL}>
                                        {({ geographies }) =>
                                            geographies.map(geo => {
                                                const isoMap = { '643': 'RUS', '156': 'CHN', '076': 'BRA', '566': 'NGA', '364': 'IRN' };
                                                const key = isoMap[String(geo.id)];
                                                const src = key ? ATTACK_SOURCES[key] : null;
                                                return (
                                                    <Geography key={geo.rsmKey} geography={geo}
                                                        style={{
                                                            default: {
                                                                fill: src ? src.color + '55' : '#1a2535',
                                                                stroke: src ? src.color : '#253347',
                                                                strokeWidth: src ? 1.5 : 0.3,
                                                                outline: 'none',
                                                                filter: src ? `drop-shadow(0 0 8px ${src.color})` : 'none',
                                                            },
                                                            hover: { fill: src ? src.color + 'aa' : '#1e2f40', outline: 'none', cursor: 'pointer' },
                                                            pressed: { outline: 'none' },
                                                        }}
                                                    />
                                                );
                                            })
                                        }
                                    </Geographies>
                                    {Object.entries(ATTACK_SOURCES).map(([key, src]) => (
                                        <Marker key={key} coordinates={src.coords}>
                                            <circle r={5 + src.pct / 7} fill={src.color} fillOpacity={0.9} stroke="#fff" strokeWidth={0.8} style={{ filter: `drop-shadow(0 0 8px ${src.color})` }} />
                                            <text x={0} y={-10} textAnchor="middle" fontSize={9} fill={src.color} fontFamily="monospace" fontWeight="bold">{src.name}</text>
                                            <title>{src.name}: {src.attacks} attacks ({src.pct}%) — {src.note}</title>
                                        </Marker>
                                    ))}
                                </ZoomableGroup>
                            </ComposableMap>
                        </div>
                        {/* Stats row */}
                        <div className="flex justify-around mt-4 pt-4 border-t border-white/5">
                            {Object.values(ATTACK_SOURCES).map((src, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-[18px] font-mono font-black" style={{ color: src.color }}>{src.attacks}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">{src.name}</div>
                                    <div className="text-[9px] text-gray-600 mt-0.5">{src.note}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Context Header */}
            <div className="mb-2 relative px-2 flex justify-between items-end">
                <div>
                    <div className="absolute left-[-5px] top-0 bottom-0 w-[3px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] rounded-r-md"></div>
                    <h3 className="text-[15px] font-bold text-white tracking-[0.1em] uppercase mb-0.5 flex items-center gap-2">
                        Risk & Posture Analytics
                        <CustomTooltip
                            title="SOC Risk Analytics"
                            usedFor="Monitor global organizational risk, model degradation, and threat landscapes."
                            interpret="High numbers in Critical Severity or Low AI Confidence indicate an immediate need for analyst triage or model retraining."
                        />
                    </h3>
                    <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Live Organization Threat Profile</p>
                </div>
            </div>

            <DetectionPerformanceMatrix />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">

                {/* 1. Attack Vector Distribution */}
                <div className="glass-card rounded-2xl border border-white/5 p-4 md:p-5 h-[280px] flex flex-col relative hover:z-50 bg-[#121926]/80">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Target size={14} className="text-red-500" />
                            <h2 className="text-[11px] font-bold text-white tracking-widest uppercase">Attack Vector Breakdown</h2>
                            <CustomTooltip title="Attack Vectors" usedFor="Percentage distribution of detected attack types." interpret="A spike in a specific vector (e.g. Malware) might indicate a targeted campaign." />
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 cursor-pointer transition-transform hover:scale-[1.02]" onDoubleClick={() => setExpandedChart({ Component: Bar, data: attackVectorData, options: attackVectorOptions })}>
                        <Bar data={attackVectorData} options={attackVectorOptions} />
                    </div>
                </div>

                {/* 2. AI Confidence Distribution */}
                <div className="glass-card rounded-2xl border border-white/5 p-4 md:p-5 h-[280px] flex flex-col relative hover:z-50 bg-[#121926]/80 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-[#00f3ff]" />
                            <h2 className="text-[11px] font-bold text-white tracking-widest uppercase">Model Confidence</h2>
                            <CustomTooltip title="Model Confidence" usedFor="Displays the AI's confidence levels for generated alerts." interpret="High volume of low confidence alerts (<60%) suggests the model needs retraining or tuning." />
                        </div>
                    </div>
                    <div className="flex justify-between items-center mb-2 px-2">
                        <div>
                            <span className="text-[20px] font-black font-mono text-[#00ff9d]">91%</span>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Model Accuracy</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[12px] font-bold text-[#ffd700] px-2 py-0.5 bg-[#ffd700]/10 border border-[#ffd700]/30 rounded">Medium Risk</span>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1.5">False Positives</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 mt-2 cursor-pointer transition-transform hover:scale-[1.02]" onDoubleClick={() => setExpandedChart({ Component: Bar, data: aiConfData, options: aiConfOptions })}>
                        <Bar data={aiConfData} options={aiConfOptions} />
                    </div>
                    <div className="absolute right-0 top-1/4 bottom-1/4 w-[2px] bg-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.8)] rounded-l-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                {/* 3. Global Threat Level */}
                <div className="glass-card rounded-2xl border border-white/5 p-5 md:p-6 h-[340px] flex flex-col relative hover:z-50 bg-[#121926]/80">
                    <h2 className="text-[11px] font-bold text-white tracking-widest uppercase mb-5 flex items-center gap-2">
                        <Thermometer size={14} className="text-[#eab308]" />
                        Global Risk Index
                        <CustomTooltip title="Global Risk Index" usedFor="Aggregated real-time risk score for the organization." interpret="A score rising above Moderate requires immediate SOC manager intervention." />
                    </h2>
                    <div className="flex-1 min-h-0 relative flex justify-center items-center mt-2">
                        <div className="w-[210px] h-[210px]">
                            <Doughnut data={threatGaugeData} options={threatGaugeOptions} />
                        </div>
                        {/* Center text for gauge */}
                        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 flex flex-col items-center">
                            <span className="text-5xl font-black font-mono text-[#eab308] drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]">67</span>
                            <span className="border border-[#eab308]/30 px-3 mt-1.5 py-0.5 rounded text-[9px] font-bold text-[#eab308] tracking-widest uppercase">Moderate</span>
                        </div>
                    </div>

                    {/* Formula Explanation */}
                    <div className="mt-4 px-1">
                        <div className="bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-center">
                            <p className="text-[9px] text-gray-400 font-mono leading-relaxed">
                                Risk Score = Threat Level + Incident Severity + Response Delay
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. Threat Severity */}
                <div className="glass-card rounded-2xl border border-white/5 p-4 md:p-5 h-[280px] flex flex-col relative hover:z-50 bg-[#121926]/80">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={14} className="text-[#ff3333]" />
                        <h2 className="text-[11px] font-bold text-white tracking-widest uppercase">Threat Severity Distribution</h2>
                        <CustomTooltip title="Threat Severity" usedFor="Categorizes active threats by potential organizational impact." interpret="Focus immediately on Critical and High severity threats to prevent data breaches." />
                    </div>
                    <div className="flex-1 min-h-0 relative flex">
                        <div className="w-1/2 h-full flex items-center justify-center">
                            <Doughnut data={severityData} options={{ ...severityOptions, plugins: { ...severityOptions.plugins, legend: { display: false } } }} />
                            <div className="absolute left-[25%] top-[50%] -translate-x-1/2 -translate-y-1/2 text-center">
                                <div className="text-xl font-black font-mono text-[#ff3333]">14%</div>
                                <div className="text-[8px] uppercase text-gray-500 font-bold tracking-widest">Critical Rate</div>
                            </div>
                        </div>
                        <div className="w-1/2 flex flex-col justify-center gap-3 pl-4">
                            {[
                                { label: 'Critical', val: 12, color: '#ff3333' },
                                { label: 'High', val: 18, color: '#ff6b6b' },
                                { label: 'Medium', val: 31, color: '#ffd700' },
                                { label: 'Low', val: 44, color: '#00ff9d' }
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center text-[11px]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-gray-300 font-bold">{item.label}</span>
                                    </div>
                                    <span className="font-mono text-white">{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 5. Phishing Success Rate */}
                <div className="glass-card rounded-2xl border border-white/5 p-4 md:p-5 h-[280px] flex flex-col relative hover:z-50 bg-[#121926]/80">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Mail size={14} className="text-[#c084fc]" />
                            <h2 className="text-[11px] font-bold text-white tracking-widest uppercase">Phishing Success Rate</h2>
                            <CustomTooltip title="Phishing Success" usedFor="Tracks the funnel from email delivery to successful user compromise." interpret="A high 'Users Clicked' rate indicates a need for urgent security awareness training." />
                        </div>
                        <span className="text-[11px] font-bold text-white px-2 py-0.5 bg-[#ff3333]/20 border border-[#ff3333]/50 rounded text-red-400">
                            18% User Risk Rate
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-4">

                        <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                                <span className="text-gray-400 font-bold uppercase tracking-wider">Emails Delivered</span>
                                <span className="font-mono text-white font-black">420</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-500 w-full" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                                <span className="text-[#ffd700] font-bold uppercase tracking-wider">Phishing Attempts</span>
                                <span className="font-mono text-[#ffd700] font-black">38</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#ffd700] w-[9.04%] shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                                <span className="text-[#ff3333] font-bold uppercase tracking-wider">Users Clicked</span>
                                <span className="font-mono text-[#ff3333] font-black">7</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#ff3333] w-[18.42%] shadow-[0_0_8px_rgba(255,51,51,0.8)]" />
                            </div>
                        </div>

                    </div>
                </div>

                {/* 6. Capabilities Radar */}
                <div className="glass-card rounded-2xl border border-white/5 p-4 md:p-5 h-[280px] flex flex-col hover:z-50 relative bg-[#121926]/80">
                    <h2 className="text-[11px] font-bold text-white tracking-widest uppercase mb-4 flex items-center gap-2">
                        <Shield size={14} className="text-[#0099ff]" />
                        Detection Capabilities
                        <CustomTooltip title="Detection Capabilities" usedFor="Scores the system's effectiveness across various detection domains." interpret="Low scores (e.g. BEC Detection < 60%) highlight vulnerabilities in the current security stack." />
                    </h2>
                    <div className="flex-1 min-h-0 relative flex justify-center items-center cursor-pointer transition-transform hover:scale-[1.02]" onDoubleClick={() => setExpandedChart({ Component: Radar, data: capabilitiesData, options: capabilitiesOptions })}>
                        <div className="absolute inset-0 max-w-[95%] max-h-[95%] m-auto pb-4">
                            <Radar data={capabilitiesData} options={capabilitiesOptions} />
                        </div>
                    </div>
                </div>


                {/* ROW 3 */}

                {/* 7. Response Time Trend */}
                <div className="glass-card rounded-2xl border border-white/5 p-4 md:p-5 h-[280px] flex flex-col relative hover:z-50 bg-[#121926]/80 col-span-1 md:col-span-2">
                    <div className="flex items-baseline justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-[#0ea5e9]" />
                            <h2 className="text-[11px] font-bold text-white tracking-widest uppercase">Response Timeline</h2>
                            <CustomTooltip title="Response Timeline" usedFor="Tracks Mean Time to Detect (MTTD), Analyze (MTTA), and Respond (MTTR)." interpret="Upward trends in MTTR indicate analyst burnout or inefficient triage processes." />
                        </div>

                        <div className="flex gap-6">
                            <div className="text-center">
                                <div className="text-[16px] font-black font-mono text-[#0ea5e9]">12s</div>
                                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">MTTD</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[16px] font-black font-mono text-[#eab308]">4m</div>
                                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">MTTA</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[16px] font-black font-mono text-[#ef4444]">28m</div>
                                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">MTTR</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 text-white mt-2 cursor-pointer transition-transform hover:scale-[1.02]" onDoubleClick={() => setExpandedChart({ Component: Line, data: responseTimeData, options: responseTimeOptions })}>
                        <Line data={responseTimeData} options={responseTimeOptions} />
                    </div>
                </div>

                {/* 8. Top Targeted Departments */}
                <div className="glass-card rounded-2xl border border-white/5 p-4 md:p-5 h-[280px] flex flex-col relative hover:z-50 bg-[#121926]/80">
                    <h2 className="text-[11px] font-bold text-white tracking-widest uppercase mb-4 flex items-center gap-2">
                        <Users size={14} className="text-[#c084fc]" />
                        Top Targeted Departments
                        <CustomTooltip title="Targeted Departments" usedFor="Highlights which business units are targeted most frequently." interpret="High targeting of Finance/HR often correlates with BEC and Wire Fraud campaigns." />
                    </h2>
                    <div className="text-[10px] text-gray-400 mb-2 font-mono">BEC attacks mostly target Finance.</div>
                    <div className="flex-1 min-h-0 mt-2 cursor-pointer transition-transform hover:scale-[1.02]" onDoubleClick={() => setExpandedChart({ Component: Bar, data: deptData, options: deptOptions })}>
                        <Bar data={deptData} options={deptOptions} />
                    </div>
                </div>

                {/* ROW 4 */}

                {/* 9. Threat Source Geography - World Map */}
                <div className="glass-card rounded-2xl border border-white/5 p-4 md:p-5 min-h-[320px] flex flex-col relative hover:z-50 bg-[#121926]/80">
                    <h2 className="text-[11px] font-bold text-white tracking-widest uppercase mb-1 flex items-center gap-2">
                        <Globe size={14} className="text-[#ff3333]" />
                        Threat Source Geography
                        <CustomTooltip title="Threat Geography" usedFor="Maps the origin country of inbound attacks by ASN." interpret="High volume from specific regions may indicate state-sponsored or organized criminal campaigns." />
                    </h2>
                    <div className="text-[10px] text-gray-400 mb-3 font-mono">Hover a country to see attack details</div>

                    {/* Country legend */}
                    <div className="flex flex-wrap gap-3 mb-3">
                        {Object.values(ATTACK_SOURCES).map((src, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: src.color, boxShadow: `0 0 5px ${src.color}` }} />
                                <span className="text-[10px] text-gray-400 font-mono">{src.name}</span>
                                <span className="text-[10px] font-mono font-black" style={{ color: src.color }}>{src.pct}%</span>
                            </div>
                        ))}
                    </div>

                    <div
                        className="flex-1 min-h-0 relative rounded-xl overflow-hidden cursor-pointer group/map"
                        style={{ background: 'rgba(0,0,0,0.4)' }}
                        onDoubleClick={() => setMapExpanded(true)}
                    >
                        {/* Expand hint overlay */}
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/map:opacity-100 transition-opacity">
                            <button
                                onClick={e => { e.stopPropagation(); setMapExpanded(true); }}
                                className="flex items-center gap-1 px-2 py-1 bg-black/70 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/60 hover:text-white uppercase tracking-wider transition-all"
                            >
                                ⤢ Expand
                            </button>
                        </div>
                        <ComposableMap
                            projection="geoMercator"
                            projectionConfig={{ scale: 120, center: [15, 20] }}
                            style={{ width: '100%', height: '100%' }}
                            height={220}
                        >
                            <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={4}>
                                <Geographies geography={GEO_URL}>
                                    {({ geographies }) =>
                                        geographies.map(geo => {
                                            const iso = geo.id;
                                            // Convert numeric ISO 3166-1 to alpha-3 lookup
                                            const isoMap = { '643': 'RUS', '156': 'CHN', '076': 'BRA', '566': 'NGA', '364': 'IRN' };
                                            const key = isoMap[String(iso)];
                                            const src = key ? ATTACK_SOURCES[key] : null;
                                            return (
                                                <Geography
                                                    key={geo.rsmKey}
                                                    geography={geo}
                                                    style={{
                                                        default: {
                                                            fill: src ? src.color + '55' : '#1a2535',
                                                            stroke: src ? src.color : '#253347',
                                                            strokeWidth: src ? 1.5 : 0.3,
                                                            outline: 'none',
                                                            filter: src ? `drop-shadow(0 0 6px ${src.color})` : 'none',
                                                        },
                                                        hover: {
                                                            fill: src ? src.color + 'aa' : '#1e2f40',
                                                            stroke: src ? src.color : '#2d3f55',
                                                            strokeWidth: src ? 2 : 0.4,
                                                            outline: 'none',
                                                            cursor: 'pointer',
                                                        },
                                                        pressed: { outline: 'none' },
                                                    }}
                                                />
                                            );
                                        })
                                    }
                                </Geographies>

                                {/* Attack origin markers with tooltips */}
                                {Object.entries(ATTACK_SOURCES).map(([key, src]) => (
                                    <Marker key={key} coordinates={src.coords}>
                                        <circle r={4 + src.pct / 8} fill={src.color} fillOpacity={0.9} stroke="#fff" strokeWidth={0.5} style={{ filter: `drop-shadow(0 0 5px ${src.color})` }} />
                                        <title>{src.name}: {src.attacks} attacks ({src.pct}%) — {src.note}</title>
                                    </Marker>
                                ))}
                            </ZoomableGroup>
                        </ComposableMap>
                    </div>

                    {/* Bottom stats row */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                        {Object.values(ATTACK_SOURCES).map((src, i) => (
                            <div key={i} className="text-center group relative cursor-default">
                                <div className="text-[13px] font-mono font-black" style={{ color: src.color }}>{src.attacks}</div>
                                <div className="text-[9px] text-gray-500 uppercase tracking-wide">{src.name}</div>
                                {/* Inline hover tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 min-w-[160px] bg-[#0a0e1a] border border-[rgba(255,50,50,0.2)] rounded-lg p-2.5 shadow-xl hidden group-hover:block">
                                    <p className="text-[10px] font-bold m-0" style={{ color: src.color }}>{src.name} — {src.pct}%</p>
                                    <p className="text-[9px] text-gray-400 m-0 mt-0.5">{src.note}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                {/* 10. Weekly Heatmap */}
                <div className="glass-card rounded-2xl border border-white/5 p-4 md:p-5 min-h-[320px] flex flex-col relative hover:z-50 bg-[#121926]/80 xl:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[11px] font-bold text-white tracking-widest uppercase">Weekly Threat Intensity</h2>
                            <CustomTooltip title="Threat Intensity Heatmap" usedFor="Visualizes attack volume across days of the week." interpret="Consistent weekend spikes might indicate automated scanning or attacks targeting off-hours." />
                        </div>
                        <div className="flex gap-4">
                            <div className="text-right">
                                <div className="text-[14px] font-black font-mono text-white">9</div>
                                <div className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">Avg Weekday</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[14px] font-black font-mono text-[#ff3333]">14</div>
                                <div className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">Avg Weekend</div>
                            </div>
                        </div>
                    </div>

                    {/* Custom built tooltip-enabled heatmap */}
                    <div className="flex-1 flex flex-col justify-center mt-2">
                        <div className="grid grid-cols-7 gap-y-2 gap-x-2 w-full max-w-[500px] mx-auto">
                            {heatmapCols.map((col, i) => (
                                <div key={`header-${i}`} className="text-center text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-widest border-b border-white/5 pb-1">{col}</div>
                            ))}

                            {/* Dynamic Row Rendering */}
                            {heatmapData.map((row, rIdx) => (
                                <React.Fragment key={`row-${rIdx}`}>
                                    {row.map((cell, cIdx) => (
                                        <div key={`c-${rIdx}-${cIdx}`} className="group relative aspect-square rounded-[4px] border border-black/20" style={{ backgroundColor: cell.c }}>
                                            {/* Custom Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-[#0d1117] border border-white/10 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                                                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Threat Count</div>
                                                <div className="text-[13px] font-mono font-black" style={{ color: cell.c }}>{cell.v} detected</div>
                                            </div>
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
