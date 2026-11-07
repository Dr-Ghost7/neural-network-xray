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
  } = useNetworkStore();

  const [isPlaying, setIsPlaying] = useState(false);

  const availableEpochs = Object.keys(checkpoints)
    .map(Number)
    .sort((a, b) => a - b);

  const hasCheckpoints = availableEpochs.length > 0;

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
    <div className="bg-[#0b0e19] border border-white/[0.07] rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4">
      {/* Training Timeline Scrubbing */}
      <div className="flex items-center gap-3.5 flex-1 min-w-[280px]">
        <div className="p-2 rounded-xl bg-violet-600/15 border border-violet-500/25 text-violet-400">
          <History size={15} />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wide">
              Training Checkpoints
            </span>
            <span className="text-[11px] font-mono text-violet-300">
              {activeEpoch === 0 ? 'Epoch 0 (Untrained Noise)' : `Epoch ${activeEpoch} of 6`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition"
              title={isPlaying ? 'Pause replay' : 'Play replay'}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
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
              className="flex-1 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Damaged Neurons Reset */}
      {totalDamaged > 0 && (
        <button
          onClick={resetDamagedNeurons}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium transition"
        >
          <RotateCcw size={13} />
          <span>Repair All ({totalDamaged} Severed)</span>
        </button>
      )}
    </div>
  );
};
