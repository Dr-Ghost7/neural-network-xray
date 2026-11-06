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
import { Cpu, Eye, ShieldAlert, Sparkles, Layers, Sliders } from 'lucide-react';

// Dynamically import Three.js 3D canvas with SSR disabled
const NetworkCanvas3D = dynamic(
  () =>
    import('@/components/visualization/NetworkCanvas3D').then(
      (mod) => mod.NetworkCanvas3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[480px] bg-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400">Loading WebGL Scene...</p>
      </div>
    ),
  }
);

export default function Home() {
  const { initWeights, setPixels, isEngineReady } = useNetworkStore();
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch trained weights & checkpoints on mount
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

        // Preload digit '7' so the 3D scene immediately lights up on load
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
    <div className="min-h-screen flex flex-col bg-[#05070e] text-slate-100 cyber-grid">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Main interactive cockpit */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Control Column: Drawing Pad + Predictions */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <DigitCanvas />
            <PredictionPanel />
          </div>

          {/* Right Area: 3D Visualization + Replay Bar + Inspector */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="h-[520px] w-full">
              <NetworkCanvas3D />
            </div>

            <ReplayControls />

            {/* Neuron Inspector */}
            <NeuronInspector />
          </div>
        </div>

        {/* Technical Architecture Highlights / Recruiter Talking Points */}
        <div className="mt-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Layers size={16} />
            </div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Engineering Architecture & Performance Specifications
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-900/80 border border-slate-800/70 backdrop-blur-md">
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Cpu size={16} />
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                  Zero-Dependency TS Engine
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Forward pass executes via handwritten matrix multiplications using native{' '}
                <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">Float32Array</code>.
                Inference completes in <strong className="text-slate-200">~0.1ms</strong> per frame
                without TensorFlow.js bundle bloat.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-900/80 border border-slate-800/70 backdrop-blur-md">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Sparkles size={16} />
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                  GPU Instanced Rendering
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                890 network nodes are rendered using hardware-accelerated Three.js InstancedMesh.
                Synaptic line vertices are dynamically culled to active excitation thresholds,
                maintaining a rock-solid 60 FPS.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-900/80 border border-slate-800/70 backdrop-blur-md">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <ShieldAlert size={16} />
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                  Interactive Neuron Ablation
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click any hidden or output node in 3D to sever its activation feed. Watch the network
                experience graceful degradation or prediction flipping in real time.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
