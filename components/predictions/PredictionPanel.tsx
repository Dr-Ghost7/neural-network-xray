'use client';

import React from 'react';
import { useNetworkStore } from '@/lib/store/useNetworkStore';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const PredictionPanel: React.FC = () => {
  const { result, damagedNeurons, isEngineReady } = useNetworkStore();

  if (!isEngineReady || !result) {
    return (
      <div className="bg-[#0b0e19] border border-white/[0.07] rounded-2xl p-5 flex flex-col items-center justify-center min-h-[360px] shadow-2xl">
        <div className="w-7 h-7 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-slate-400 font-mono">Loading Neural Weights...</p>
      </div>
    );
  }

  const { prediction, confidence, entropy, activations } = result;
  const probs = Array.from(activations.output);

  const confPercent = Math.round(confidence * 100);
  const isHighAmbiguity = entropy > 1.35;

  const totalDamaged = 
    damagedNeurons.hidden1.size + 
    damagedNeurons.hidden2.size + 
    damagedNeurons.output.size;

  return (
    <div className="flex flex-col bg-[#0b0e19] border border-white/[0.07] rounded-2xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6]" />
          <h3 className="text-xs font-mono font-medium tracking-wider text-slate-300 uppercase">
            Inference Output
          </h3>
        </div>

        {totalDamaged > 0 && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300">
            {totalDamaged} Severed
          </span>
        )}
      </div>

      {/* Hero Prediction Display */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/[0.06] mb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-violet-600/20 border border-violet-500/30 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-mono font-bold tracking-tight bg-gradient-to-br from-blue-200 via-indigo-100 to-violet-300 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
              {prediction}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white tracking-tight font-mono">{confPercent}%</span>
              <span className="text-xs text-slate-400 font-mono">confidence</span>
            </div>
            <div className="mt-0.5">
              {isHighAmbiguity ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium font-mono">
                  <AlertCircle size={11} />
                  Contested (H = {entropy.toFixed(2)})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-violet-300 font-medium font-mono">
                  <CheckCircle2 size={11} className="text-violet-400" />
                  Decisive (H = {entropy.toFixed(2)})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 10-Class Probability Distribution */}
      <div className="space-y-1.5">
        {probs.map((prob, digit) => {
          const isWinner = digit === prediction;
          const p = Math.round(prob * 100);
          const isDamaged = damagedNeurons.output.has(digit);

          return (
            <div
              key={digit}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                isDamaged
                  ? 'opacity-30 border-rose-900/40 bg-rose-950/20'
                  : isWinner
                  ? 'border-violet-500/40 bg-violet-950/20 shadow-[0_0_12px_rgba(139,92,246,0.12)]'
                  : 'border-white/[0.04] bg-white/[0.01]'
              }`}
            >
              <span
                className={`font-mono text-xs w-3.5 font-semibold ${
                  isWinner ? 'text-violet-300' : 'text-slate-400'
                }`}
              >
                {digit}
              </span>

              {/* Progress bar */}
              <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-150 rounded-full ${
                    isWinner
                      ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.6)]'
                      : prob > 0.15
                      ? 'bg-indigo-400/60'
                      : 'bg-white/10'
                  }`}
                  style={{ width: `${Math.max(2, p)}%` }}
                />
              </div>

              <span
                className={`font-mono text-[11px] w-8 text-right ${
                  isWinner ? 'text-violet-300 font-semibold' : 'text-slate-400'
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
