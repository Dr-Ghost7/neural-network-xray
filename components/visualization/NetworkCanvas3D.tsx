'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Network3DScene } from './Network3DScene';

export const NetworkCanvas3D: React.FC = () => {
  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#090b14] rounded-2xl border border-white/[0.07] overflow-hidden shadow-2xl flex flex-col group">
      {/* Subtle top indicator */}
      <div className="absolute top-3.5 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <span className="inline-block w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_#8b5cf6]" />
        <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
          Synaptic Graph · 3D
        </span>
      </div>

      <div className="absolute top-3.5 right-4 z-10 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
        <span className="text-[11px] font-mono text-slate-400 bg-obsidian-950/80 px-2 py-0.5 rounded border border-white/5">
          Drag to Orbit · Scroll to Zoom
        </span>
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

      {/* Clean low-profile footer */}
      <div className="px-4 py-2.5 bg-obsidian-950/90 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
            <span className="text-slate-300">Input / Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#a855f7]" />
            <span className="text-slate-300">Latent / Output</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
            <span className="text-slate-300">Severed</span>
          </div>
        </div>

        <span className="text-slate-400 hidden sm:inline">784 → 64 → 32 → 10 Feed-Forward</span>
      </div>
    </div>
  );
};
