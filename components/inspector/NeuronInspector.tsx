'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useNetworkStore } from '@/lib/store/useNetworkStore';
import { ShieldAlert, Wrench, X, Eye, Flame } from 'lucide-react';

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

  // Find top firing neurons in Hidden Layers to make ablation experimentation effortless
  const topActiveHidden = useMemo(() => {
    if (!result) return [];
    const items: { layer: 'hidden1' | 'hidden2'; index: number; activation: number }[] = [];

    const h1 = result.activations.hidden1;
    for (let i = 0; i < 64; i++) {
      if (h1[i] > 0.1) items.push({ layer: 'hidden1', index: i, activation: h1[i] });
    }

    const h2 = result.activations.hidden2;
    for (let i = 0; i < 32; i++) {
      if (h2[i] > 0.1) items.push({ layer: 'hidden2', index: i, activation: h2[i] });
    }

    return items.sort((a, b) => b.activation - a.activation).slice(0, 4);
  }, [result]);

  // Draw 28x28 receptive field for Hidden 1 neurons (Purple/Blue palette)
  useEffect(() => {
    if (layer !== 'hidden1' || !weights || !receptiveCanvasRef.current) return;
    const canvas = receptiveCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w1 = weights.w1;
    const offset = index * 784;

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
        // Positive weight: Electric Violet / Purple
        imgData.data[pIdx] = Math.floor(norm * 168);
        imgData.data[pIdx + 1] = Math.floor(norm * 85);
        imgData.data[pIdx + 2] = Math.floor(norm * 247);
      } else {
        // Negative weight: Cobalt / Deep Blue
        imgData.data[pIdx] = Math.floor(Math.abs(norm) * 30);
        imgData.data[pIdx + 1] = Math.floor(Math.abs(norm) * 80);
        imgData.data[pIdx + 2] = Math.floor(Math.abs(norm) * 230);
      }
      imgData.data[pIdx + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
  }, [selectedNeuron, weights, layer, index]);

  // Default view when no individual neuron is clicked: Show Top Firing Hidden Neurons for quick ablation testing!
  if (!selectedNeuron) {
    return (
      <div className="bg-[#0b0e19] border border-white/[0.07] rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_#8b5cf6]" />
            <h3 className="text-xs font-mono font-medium tracking-wider text-slate-200 uppercase">
              Hidden Layer Ablation
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Click any 3D node or pick a firing neuron below
          </span>
        </div>

        {/* Top firing neurons carrying the current digit's signal */}
        {topActiveHidden.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topActiveHidden.map((item) => {
              const damaged = damagedNeurons[item.layer].has(item.index);
              const label = item.layer === 'hidden1' ? `H1 #${item.index}` : `H2 #${item.index}`;

              return (
                <div
                  key={`${item.layer}-${item.index}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all ${
                    damaged
                      ? 'border-rose-900/40 bg-rose-950/20 text-rose-300'
                      : 'border-white/[0.05] bg-black/30 hover:border-violet-500/30'
                  }`}
                >
                  <button
                    onClick={() => setSelectedNeuron({ layer: item.layer, index: item.index })}
                    className="flex items-center gap-2 text-left hover:text-white"
                    title="Inspect receptive weights and activations"
                  >
                    <Flame size={12} className={damaged ? 'text-rose-400' : 'text-violet-400'} />
                    <span className="font-mono font-semibold">{label}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({item.activation.toFixed(2)})
                    </span>
                  </button>

                  <button
                    onClick={() => toggleDamageNeuron(item.layer, item.index)}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded transition ${
                      damaged
                        ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                        : 'bg-white/[0.06] text-slate-300 hover:bg-rose-500/20 hover:text-rose-300'
                    }`}
                  >
                    {damaged ? 'Severed' : 'Sever'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 font-mono py-1">
            Draw a digit on the canvas to see which hidden neurons fire and test severing them.
          </p>
        )}
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
    <div className="flex flex-col bg-[#0b0e19] border border-white/[0.07] rounded-2xl p-4 shadow-2xl relative">
      <button
        onClick={() => setSelectedNeuron(null)}
        className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition"
      >
        <X size={14} />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_#8b5cf6]" />
        <div>
          <h3 className="text-xs font-mono font-medium text-slate-200 uppercase tracking-wide">
            Neuron #{index} · {layerLabels[layer!]}
          </h3>
        </div>
      </div>

      <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3 space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Activation</span>
          <span className="text-violet-300 font-mono font-semibold">
            {currentActivation.toFixed(4)}
          </span>
        </div>

        <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isDamaged ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-500 to-violet-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, currentActivation * 100))}%` }}
          />
        </div>
      </div>

      {/* Layer 1 Weight Receptive Field Heatmap */}
      {layer === 'hidden1' && (
        <div className="flex flex-col items-center p-3 rounded-xl bg-black/30 border border-white/[0.06] mb-3">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">Receptive Weight Filter</span>
            <div className="flex items-center gap-2 text-[9px] font-mono">
              <span className="text-blue-400">(-) Inhibit</span>
              <span className="text-violet-400">(+) Excite</span>
            </div>
          </div>

          <canvas
            ref={receptiveCanvasRef}
            width={28}
            height={28}
            className="w-20 h-20 border border-white/10 rounded-lg shadow-lg image-rendering-pixelated"
          />
        </div>
      )}

      {/* Damage / Sever Controls */}
      {layer !== 'input' && (
        <button
          onClick={() => toggleDamageNeuron(layer as 'hidden1' | 'hidden2' | 'output', index)}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium text-xs transition-all active:scale-95 ${
            isDamaged
              ? 'bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300'
              : 'bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300'
          }`}
        >
          {isDamaged ? (
            <>
              <Wrench size={13} />
              <span>Restore Signal</span>
            </>
          ) : (
            <>
              <ShieldAlert size={13} />
              <span>Sever Hidden Neuron #{index}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
