'use client';

import React, { useState, useEffect } from 'react';
import { useNetworkStore } from '@/lib/store/useNetworkStore';
import { Play, Pause, History, RotateCcw } from 'lucide-react';

export const ReplayControls: React.FC = () => {
  const {
    activeEpoch,
    setEpoch,
    checkpoints,
    damagedNeurons,
    resetDamagedNeurons,
    setPixels,
  } = useNetworkStore();

  const [isPlaying, setIsPlaying] = useState(false);

  const availableEpochs = Object.keys(checkpoints)
    .map(Number)
    .sort((a, b) => a - b);

  const hasCheckpoints = availableEpochs.length > 0;

  // Auto-play replay animation
  useEffect(() => {
    if (!isPlaying || !hasCheckpoints) return;

    const interval = setInterval(() => {
      const currentIndex = availableEpochs.indexOf(activeEpoch);
      const nextIndex = (currentIndex + 1) % availableEpochs.length;
      setEpoch(availableEpochs[nextIndex]);
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, activeEpoch, availableEpochs, hasCheckpoints, setEpoch]);

  const totalDamaged =
    damagedNeurons.hidden1.size +
    damagedNeurons.hidden2.size +
    damagedNeurons.output.size;

  return (
    <div className="bg-surface-900/90 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
      {/* Training Timeline Scrubbing */}
      <div className="flex items-center gap-3 flex-1 min-w-[280px]">
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <History size={16} />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white tracking-wide">
              Training Checkpoint Replay
            </span>
            <span className="text-[11px] font-mono text-cyan-300">
              {activeEpoch === 0 ? 'Epoch 0 (Untrained Noise)' : `Epoch ${activeEpoch} / 6`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title={isPlaying ? 'Pause replay' : 'Play replay'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>

            <input
              type="range"
              min="0"
              max={availableEpochs.length > 0 ? availableEpochs.length - 1 : 4}
              step="1"
              value={
                availableEpochs.indexOf(activeEpoch) !== -1
                  ? availableEpochs.indexOf(activeEpoch)
                  : availableEpochs.length - 1
              }
              onChange={(e) => {
                setIsPlaying(false);
                const idx = parseInt(e.target.value, 10);
                if (availableEpochs[idx] !== undefined) {
                  setEpoch(availableEpochs[idx]);
                }
              }}
              className="flex-1 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Damaged Neurons Reset */}
      {totalDamaged > 0 && (
        <button
          onClick={resetDamagedNeurons}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-medium transition"
        >
          <RotateCcw size={14} />
          <span>Repair All ({totalDamaged} Severed)</span>
        </button>
      )}
    </div>
  );
};
