import React from 'react';
import { Target } from 'lucide-react';
import CustomTooltip from './CustomTooltip';

const DetectionPerformanceMatrix = () => {
    return (
        <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 relative hover:z-50 bg-[#0d131f]">
            <div className="flex items-center gap-2 mb-8 uppercase tracking-widest text-[14px] font-bold text-gray-300">
                <Target size={16} className="text-cyan-neon" />
                Detection Performance Matrix
                <CustomTooltip
                    title="Detection Performance"
                    usedFor="Evaluates AI accuracy by comparing predicted threat classifications against actual outcomes."
                    interpret="High False Positives cause alert fatigue. High False Negatives mean threats are bypassing the system."
                />
            </div>

            <div className="grid grid-cols-[120px_1fr_1fr] gap-x-6 gap-y-4">
                {/* Header Row */}
                <div className="col-start-2 text-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Predicted Threat
                </div>
                <div className="col-start-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Predicted Safe
                </div>

                {/* Row 1 */}
                <div className="flex items-center justify-end pr-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">
                    Actual Threat
                </div>

                {/* True Positive */}
                <div className="bg-[#05231c] border border-green-500/20 rounded-xl p-6 flex flex-col items-center justify-center relative group hover:border-green-500/40 transition-colors">
                    <div className="text-[10px] text-gray-400 font-bold mb-3 tracking-widest uppercase">TRUE POSITIVE (TP)</div>
                    <div className="text-4xl font-black text-green-neon mb-3 tracking-tighter drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">1,245</div>
                    <div className="text-[9px] text-gray-500 tracking-wider">CORRECTLY BLOCKED</div>
                </div>

                {/* False Negative */}
                <div className="bg-[#2a0e14] border border-red-500/20 rounded-xl p-6 flex flex-col items-center justify-center relative group hover:border-red-500/40 transition-colors">
                    <div className="text-[10px] text-gray-400 font-bold mb-3 tracking-widest uppercase">FALSE NEGATIVE (FN)</div>
                    <div className="text-4xl font-black text-red-500 mb-3 tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">3</div>
                    <div className="text-[9px] text-gray-500 tracking-wider">MISSED THREATS</div>
                </div>

                {/* Row 2 */}
                <div className="flex items-center justify-end pr-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">
                    Actual Safe
                </div>

                {/* False Positive */}
                <div className="bg-[#241d0e] border border-yellow-500/20 rounded-xl p-6 flex flex-col items-center justify-center relative group hover:border-yellow-500/40 transition-colors">
                    <div className="text-[10px] text-gray-400 font-bold mb-3 tracking-widest uppercase">FALSE POSITIVE (FP)</div>
                    <div className="text-4xl font-black text-yellow-500 mb-3 tracking-tighter drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">12</div>
                    <div className="text-[9px] text-gray-500 tracking-wider invisible">PLACEHOLDER</div>
                </div>

                {/* True Negative */}
                <div className="bg-[#091b24] border border-cyan-500/20 rounded-xl p-6 flex flex-col items-center justify-center relative group hover:border-cyan-500/40 transition-colors">
                    <div className="text-[10px] text-gray-400 font-bold mb-3 tracking-widest uppercase">TRUE NEGATIVE (TN)</div>
                    <div className="text-4xl font-black text-cyan-neon mb-3 tracking-tighter drop-shadow-[0_0_15px_rgba(0,243,255,0.3)]">8,932</div>
                    <div className="text-[9px] text-gray-500 tracking-wider invisible">PLACEHOLDER</div>
                </div>
            </div>

            {/* Derived Model Metrics */}
            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-black/20 rounded-lg p-4 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-black/40 transition-all">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Precision</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">99.0</span>
                        <span className="text-sm text-gray-400">%</span>
                    </div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-black/40 transition-all">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Recall</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">99.8</span>
                        <span className="text-sm text-gray-400">%</span>
                    </div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-black/40 transition-all">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">F1 Score</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">99.4</span>
                        <span className="text-sm text-gray-400">%</span>
                    </div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-black/40 transition-all">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Accuracy</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">99.9</span>
                        <span className="text-sm text-gray-400">%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetectionPerformanceMatrix;
