'use client';

import React from 'react';
import { useNetworkStore } from '@/lib/store/useNetworkStore';
import { Github } from 'lucide-react';
import { sampleDigits } from '@/lib/data/presets';

export const Header: React.FC = () => {
  const { setPixels, isEngineReady } = useNetworkStore();

  const loadPreset = (digit: number) => {
    if (sampleDigits[digit]) {
      setPixels(sampleDigits[digit]);
    }
  };

  return (
    <header className="border-b border-white/[0.06] bg-[#070912]/80 backdrop-blur-xl sticky top-0 z-30 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600/30 via-indigo-600/30 to-violet-600/30 border border-violet-500/40 p-1 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(139,92,246,0.35)]">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <circle cx="5" cy="6" r="2" className="fill-blue-500/50 stroke-blue-400" />
              <circle cx="5" cy="18" r="2" className="fill-blue-500/50 stroke-blue-400" />
              <circle cx="12" cy="12" r="2" className="fill-indigo-500/60 stroke-indigo-300" />
              <circle cx="19" cy="7" r="2" className="fill-violet-500/60 stroke-violet-300" />
              <circle cx="19" cy="17" r="2" className="fill-violet-500/60 stroke-violet-300" />
              <path
                d="M7 7.2L10 10.8M7 16.8L10 13.2M14 10.8L17 8.2M14 13.2L17 15.8"
                className="stroke-violet-300/40"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
              Neural Network X-Ray
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              3D WebGL Inference & Ablation
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Presets:</span>
          <div className="flex items-center gap-1">
            {[0, 3, 5, 7, 8].map((d) => (
              <button
                key={d}
                onClick={() => loadPreset(d)}
                disabled={!isEngineReady}
                className="w-7 h-7 rounded-lg bg-white/[0.03] hover:bg-violet-600/20 hover:border-violet-500/40 border border-white/[0.06] text-xs font-mono font-medium text-slate-400 hover:text-violet-300 transition-all active:scale-95 disabled:opacity-40"
                title={`Load digit ${d}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* GitHub link */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Dr-Ghost7/neural-network-xray"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-medium text-slate-300 transition-all hover:text-white"
          >
            <Github size={13} />
            <span className="hidden sm:inline">Dr-Ghost7</span>
          </a>
        </div>
      </div>
    </header>
  );
};
