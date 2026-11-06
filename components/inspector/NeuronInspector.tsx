'use client';

import React, { useRef, useEffect } from 'react';
import { useNetworkStore } from '@/lib/store/useNetworkStore';
import { Eye, ShieldAlert, Wrench, Sparkles, X } from 'lucide-react';

export const NeuronInspector: React.FC = () => {
  const {
    selectedNeuron,
    setSelectedNeuron,
    result,
    weights,
    damagedNeurons,
    toggleDamageNeuron,
  } = useNetworkStore();

  const receptiveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const layer = selectedNeuron?.layer;
  const index = selectedNeuron?.index ?? 0;

  const isDamaged =
    layer && layer !== 'input'
      ? damagedNeurons[layer as 'hidden1' | 'hidden2' | 'output'].has(index)
      : false;

  // Compute activation
  let currentActivation = 0;
  if (result && selectedNeuron) {
    if (layer === 'input') {
      currentActivation = result.activations.input[index] || 0;
    } else if (layer === 'hidden1') {
      currentActivation = result.activations.hidden1[index] || 0;
    } else if (layer === 'hidden2') {
      currentActivation = result.activations.hidden2[index] || 0;
    } else if (layer === 'output') {
      currentActivation = result.activations.output[index] || 0;
    }
  }

  // Draw 28x28 receptive field for Hidden 1 neurons
  useEffect(() => {
    if (layer !== 'hidden1' || !weights || !receptiveCanvasRef.current) return;
    const canvas = receptiveCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w1 = weights.w1;
    const offset = index * 784;

    // Find max absolute weight for normalization
    let maxAbs = 0.001;
    for (let i = 0; i < 784; i++) {
      const val = Math.abs(w1[offset + i]);
      if (val > maxAbs) maxAbs = val;
    }

    const imgData = ctx.createImageData(28, 28);
    for (let i = 0; i < 784; i++) {
      const weight = w1[offset + i];
      const norm = weight / maxAbs; // -1 to 1
      const pIdx = i * 4;

      if (norm > 0) {
        // Positive weight: Neon cyan / blue
        imgData.data[pIdx] = 0;
        imgData.data[pIdx + 1] = Math.floor(norm * 240);
        imgData.data[pIdx + 2] = Math.floor(norm * 255);
      } else {
        // Negative weight: Crimson / rose
        imgData.data[pIdx] = Math.floor(Math.abs(norm) * 244);
        imgData.data[pIdx + 1] = Math.floor(Math.abs(norm) * 63);
        imgData.data[pIdx + 2] = Math.floor(Math.abs(norm) * 94);
      }
      imgData.data[pIdx + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
  }, [selectedNeuron, weights, layer, index]);

  if (!selectedNeuron) {
    return (
      <div className="bg-surface-900/90 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col items-center justify-center text-center">
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 mb-3">
          <Eye size={20} />
        </div>
        <h4 className="text-xs font-semibold text-slate-300">Neuron X-Ray Inspector</h4>
        <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
          Click any glowing node in the 3D scene to inspect its receptive weights and damage state.
        </p>
      </div>
    );
  }

  const layerLabels: Record<string, string> = {
    input: 'Input Pixel',
    hidden1: 'Hidden Layer 1 (64 Nodes)',
    hidden2: 'Hidden Layer 2 (32 Nodes)',
    output: 'Output Softmax (10 Digits)',
  };

  return (
    <div className="flex flex-col bg-surface-900/90 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-2xl relative">
      <button
        onClick={() => setSelectedNeuron(null)}
        className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
      >
        <X size={14} />
      </button>

      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">Neuron Inspector</h3>
          <p className="text-xs text-slate-400">{layerLabels[layer!]}</p>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">Node Index</span>
          <span className="text-white font-mono font-bold">#{index}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">Activation</span>
          <span className="text-cyan-300 font-mono font-semibold">
            {currentActivation.toFixed(4)}
          </span>
        </div>

        {/* Activation bar */}
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isDamaged ? 'bg-rose-500' : 'bg-cyan-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, currentActivation * 100))}%` }}
          />
        </div>
      </div>

      {/* Layer 1 Weight Receptive Field (Heatmap) */}
      {layer === 'hidden1' && (
        <div className="flex flex-col items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-[11px] text-slate-400 font-mono">Learned Weight Filter</span>
            <div className="flex items-center gap-2 text-[9px] font-mono">
              <span className="text-rose-400">(-) Inhibit</span>
              <span className="text-cyan-400">(+) Excite</span>
            </div>
          </div>

          <canvas
            ref={receptiveCanvasRef}
            width={28}
            height={28}
            className="w-24 h-24 border border-slate-700/80 rounded-lg shadow-lg image-rendering-pixelated"
          />
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            28×28 spatial features that excite this specific neuron
          </p>
        </div>
      )}

      {/* Damage / Sever Controls */}
      {layer !== 'input' && (
        <button
          onClick={() => toggleDamageNeuron(layer as 'hidden1' | 'hidden2' | 'output', index)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs transition-all active:scale-95 ${
            isDamaged
              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300'
          }`}
        >
          {isDamaged ? (
            <>
              <Wrench size={14} />
              <span>Repair Severed Neuron</span>
            </>
          ) : (
            <>
              <ShieldAlert size={14} />
              <span>Sever / Damage Neuron</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
