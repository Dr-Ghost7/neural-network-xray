'use client';

import React from 'react';
import { useNetworkStore } from '@/lib/store/useNetworkStore';
import { AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';

export const PredictionPanel: React.FC = () => {
  const { result, damagedNeurons, isEngineReady } = useNetworkStore();

  if (!isEngineReady || !result) {
    return (
      <div className="bg-surface-900/90 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-slate-400 font-mono">Initializing Neural Weights...</p>
      </div>
    );
  }

  const { prediction, confidence, entropy, activations } = result;
  const probs = Array.from(activations.output);

  // Confidence styling
  const confPercent = Math.round(confidence * 100);
  const isHighAmbiguity = entropy > 1.35;

  const totalDamaged = 
    damagedNeurons.hidden1.size + 
    damagedNeurons.hidden2.size + 
    damagedNeurons.output.size;

  return (
    <div className="flex flex-col bg-surface-900/90 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">Live Classification</h3>
            <p className="text-xs text-slate-400">Softmax output probabilities</p>
          </div>
        </div>

        {totalDamaged > 0 && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300">
            {totalDamaged} Severed
          </span>
        )}
      </div>

      {/* Hero Prediction Display */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 via-slate-800/40 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg">
            <span className="text-4xl font-black font-mono tracking-tighter text-cyan-300 drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]">
              {prediction}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{confPercent}%</span>
              <span className="text-xs text-slate-400 font-mono">confidence</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {isHighAmbiguity ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                  <AlertTriangle size={12} />
                  Contested (H = {entropy.toFixed(2)})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 size={12} />
                  Decisive (H = {entropy.toFixed(2)})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Probability Bars (0 to 9) */}
      <div className="space-y-1.5">
        {probs.map((prob, digit) => {
          const isWinner = digit === prediction;
          const p = Math.round(prob * 100);
          const isDamaged = damagedNeurons.output.has(digit);

          return (
            <div
              key={digit}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all ${
                isDamaged
                  ? 'opacity-30 border-rose-900/50 bg-rose-950/20'
                  : isWinner
                  ? 'border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_15px_-3px_rgba(0,240,255,0.15)]'
                  : 'border-slate-800/50 bg-slate-950/30'
              }`}
            >
              <span
                className={`font-mono text-xs w-4 font-bold ${
                  isWinner ? 'text-cyan-300' : 'text-slate-400'
                }`}
              >
                {digit}
              </span>

              {/* Progress bar */}
              <div className="flex-1 h-2 rounded-full bg-slate-800/80 overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-150 rounded-full ${
                    isWinner
                      ? 'bg-gradient-to-r from-cyan-400 to-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                      : prob > 0.15
                      ? 'bg-amber-400/80'
                      : 'bg-slate-600/50'
                  }`}
                  style={{ width: `${Math.max(2, p)}%` }}
                />
              </div>

              <span
                className={`font-mono text-[11px] w-9 text-right ${
                  isWinner ? 'text-cyan-300 font-semibold' : 'text-slate-500'
                }`}
              >
                {p}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
