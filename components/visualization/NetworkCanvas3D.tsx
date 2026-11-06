'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Network3DScene } from './Network3DScene';
import { RotateCw, Compass } from 'lucide-react';

export const NetworkCanvas3D: React.FC = () => {
  return (
    <div className="relative w-full h-full min-h-[480px] bg-gradient-to-b from-[#070b16] via-[#04060c] to-[#020306] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col">
      {/* 3D Viewport Controls & Indicators */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md flex items-center gap-2 text-xs font-medium text-slate-300 shadow-lg">
          <Compass size={14} className="text-cyan-400" />
          <span>Interactive 3D Synaptic Mesh</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-none">
        <div className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800/70 backdrop-blur-md text-[11px] font-mono text-slate-400">
          Left Drag: Orbit · Right Drag: Pan · Scroll: Zoom
        </div>
      </div>

      {/* R3F WebGL Canvas */}
      <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [0, 8, 24], fov: 45 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <Network3DScene />
          </Suspense>
        </Canvas>
      </div>

      {/* Subtle status footer */}
      <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            <span>Active Excitation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span>Layer 2 Latent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            <span>Ablated / Damaged</span>
          </div>
        </div>

        <span className="text-slate-500">784 → 64 → 32 → 10 Feed-Forward</span>
      </div>
    </div>
  );
};
