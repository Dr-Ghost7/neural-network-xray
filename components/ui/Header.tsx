'use client';

import React from 'react';
import { useNetworkStore } from '@/lib/store/useNetworkStore';
import { Brain, Cpu, Github, Sparkles } from 'lucide-react';
import { sampleDigits } from '@/lib/data/presets';

export const Header: React.FC = () => {
  const { setPixels, isEngineReady } = useNetworkStore();

  const loadPreset = (digit: number) => {
    if (sampleDigits[digit]) {
      setPixels(sampleDigits[digit]);
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-surface-900/60 backdrop-blur-xl sticky top-0 z-30 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-purple-500 to-emerald-400 p-[1px] shadow-[0_0_15px_-2px_rgba(0,240,255,0.4)]">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Brain size={18} className="text-cyan-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">
                NEURAL NETWORK X-RAY
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive 3D WebGL inference & synaptic ablation engine
            </p>
          </div>
        </div>

        {/* Quick Digit Preset Chips */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Presets:</span>
          <div className="flex items-center gap-1.5">
            {[0, 3, 5, 7, 8].map((d) => (
              <button
                key={d}
                onClick={() => loadPreset(d)}
                disabled={!isEngineReady}
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 hover:border-cyan-500/40 border border-slate-700/60 text-xs font-mono font-medium text-slate-300 hover:text-cyan-300 transition-all active:scale-95 disabled:opacity-40"
                title={`Load pre-drawn digit ${d}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Engineering Badges & Repo Link */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400 px-3 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <Cpu size={13} className="text-emerald-400" />
            <span>Pure TS Forward Pass · 0.1ms</span>
          </div>

          <a
            href="https://github.com/Dr-Ghost7/neural-network-xray"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition-all hover:border-slate-600"
          >
            <Github size={14} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
