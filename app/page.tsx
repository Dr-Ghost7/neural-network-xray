'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/ui/Header';
import { DigitCanvas } from '@/components/canvas/DigitCanvas';
import { PredictionPanel } from '@/components/predictions/PredictionPanel';
import { NeuronInspector } from '@/components/inspector/NeuronInspector';
import { ReplayControls } from '@/components/controls/ReplayControls';
import { useNetworkStore } from '@/lib/store/useNetworkStore';
import { sampleDigits } from '@/lib/data/presets';

// Dynamically import Three.js 3D canvas with SSR disabled
const NetworkCanvas3D = dynamic(
  () =>
    import('@/components/visualization/NetworkCanvas3D').then(
      (mod) => mod.NetworkCanvas3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] bg-[#090b14] rounded-2xl border border-white/[0.07] flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400">Loading WebGL Scene...</p>
      </div>
    ),
  }
);

export default function Home() {
  const { initWeights, setPixels } = useNetworkStore();
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadModel() {
      try {
        const [finalRes, checkRes] = await Promise.all([
          fetch('/weights/mnist_mlp_final.json'),
          fetch('/weights/mnist_mlp_checkpoints.json'),
        ]);

        if (!finalRes.ok) {
          throw new Error(`Failed to load weights: ${finalRes.statusText}`);
        }

        const finalWeights = await finalRes.json();
        const checkpoints = checkRes.ok ? await checkRes.json() : {};

        initWeights(finalWeights, checkpoints);

        // Preload digit '7' so the 3D scene lights up immediately
        if (sampleDigits[7]) {
          setPixels(sampleDigits[7]);
        }
      } catch (err: any) {
        console.error('Weight load error:', err);
        setLoadError(err?.message || 'Failed to load model weights');
      }
    }

    loadModel();
  }, [initWeights, setPixels]);

  return (
    <div className="min-h-screen flex flex-col ambient-canvas text-slate-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
        {/* Main Workstation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Drawing Pad + Prediction Distribution */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <DigitCanvas />
            <PredictionPanel />
          </div>

          {/* Right Column: 3D Visualization + Replay Bar + Inspector */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="h-[520px] w-full">
              <NetworkCanvas3D />
            </div>

            <ReplayControls />
            <NeuronInspector />
          </div>
        </div>

        {/* Minimalist Studio Footer */}
        <footer className="mt-4 pt-5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>MLP 784-64-32-10</span>
            <span>·</span>
            <span>Pure TypeScript Forward Pass</span>
            <span>·</span>
            <span>Float32Array Buffers</span>
          </div>

          <div className="text-slate-400">
            Next.js 14 · Three.js · React Three Fiber
          </div>
        </footer>
      </main>
    </div>
  );
}
