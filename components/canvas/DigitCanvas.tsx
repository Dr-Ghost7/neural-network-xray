'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNetworkStore } from '@/lib/store/useNetworkStore';
import { Eraser, Crosshair, Zap, RotateCcw, PenTool } from 'lucide-react';

export const DigitCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  const {
    pixels,
    processedPixels,
    setPixels,
    clearCanvas,
    autoCenter,
    setAutoCenter,
    brushRadius,
    setBrushRadius,
    triggerAdversarial,
    result,
  } = useNetworkStore();

  const CANVAS_SIZE = 280; // 10x visual zoom for 28x28
  const GRID_SIZE = 28;
  const SCALE = CANVAS_SIZE / GRID_SIZE;

  // Render 28x28 pixel array onto visual canvas
  const drawFromPixels = useCallback((px: Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const val = px[y * GRID_SIZE + x];
        if (val > 0.01) {
          const brightness = Math.min(255, Math.floor(val * 255));
          ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
          ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
        }
      }
    }
  }, [CANVAS_SIZE, SCALE]);

  // Update visual canvas whenever pixels change (e.g., clear, adversarial, presets)
  useEffect(() => {
    drawFromPixels(pixels);
  }, [pixels, drawFromPixels]);

  // Draw 28x28 pre-processed thumbnail
  useEffect(() => {
    const prevCanvas = previewCanvasRef.current;
    if (!prevCanvas) return;
    const pCtx = prevCanvas.getContext('2d');
    if (!pCtx) return;

    const imgData = pCtx.createImageData(GRID_SIZE, GRID_SIZE);
    for (let i = 0; i < 784; i++) {
      const val = Math.floor(processedPixels[i] * 255);
      const idx = i * 4;
      imgData.data[idx] = val;     // R
      imgData.data[idx + 1] = val; // G
      imgData.data[idx + 2] = val; // B
      imgData.data[idx + 3] = 255; // A
    }
    pCtx.putImageData(imgData, 0, 0);
  }, [processedPixels]);

  // Handle continuous stroke drawing directly onto 784-element Float32Array
  const applyBrush = (gridX: number, gridY: number) => {
    const newPixels = new Float32Array(pixels);
    const radius = brushRadius;
    const rCeil = Math.ceil(radius * 1.5);

    for (let dy = -rCeil; dy <= rCeil; dy++) {
      for (let dx = -rCeil; dx <= rCeil; dx++) {
        const nx = Math.floor(gridX + dx);
        const ny = Math.floor(gridY + dy);

        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          const dist = Math.hypot(gridX - nx, gridY - ny);
          const intensity = Math.max(0, 1 - dist / (radius * 1.4));
          const idx = ny * GRID_SIZE + nx;
          newPixels[idx] = Math.min(1.0, newPixels[idx] + intensity * 0.85);
        }
      }
    }

    setPixels(newPixels);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(CANVAS_SIZE, clientX - rect.left));
    const y = Math.max(0, Math.min(CANVAS_SIZE, clientY - rect.top));

    return {
      gridX: x / SCALE,
      gridY: y / SCALE,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    setLastPoint({ x: coords.gridX, y: coords.gridY });
    applyBrush(coords.gridX, coords.gridY);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;

    if (lastPoint) {
      // Interpolate points for smooth stroke continuity
      const dist = Math.hypot(coords.gridX - lastPoint.x, coords.gridY - lastPoint.y);
      const steps = Math.max(1, Math.ceil(dist * 2));
      for (let s = 1; s <= steps; s++) {
        const interX = lastPoint.x + (coords.gridX - lastPoint.x) * (s / steps);
        const interY = lastPoint.y + (coords.gridY - lastPoint.y) * (s / steps);
        applyBrush(interX, interY);
      }
    } else {
      applyBrush(coords.gridX, coords.gridY);
    }

    setLastPoint({ x: coords.gridX, y: coords.gridY });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  return (
    <div className="flex flex-col bg-surface-900/90 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <PenTool size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">Input Canvas</h3>
            <p className="text-xs text-slate-400">Draw a digit (0–9) to classify</p>
          </div>
        </div>

        {/* Real-time Latency badge */}
        {result && (
          <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800/80 border border-slate-700/50 text-cyan-300">
            {result.latencyMs} ms
          </span>
        )}
      </div>

      {/* Main Drawing Area */}
      <div className="relative mx-auto my-1 rounded-xl overflow-hidden border border-slate-700/60 shadow-inner group">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="cursor-crosshair touch-none block"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
        />

        {/* Subtle grid lines overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:28px_28px]" />

        {/* Mini 28x28 normalized input preview */}
        <div className="absolute bottom-2 right-2 flex flex-col items-center bg-slate-950/80 border border-slate-800/80 p-1.5 rounded-lg shadow-lg">
          <canvas
            ref={previewCanvasRef}
            width={28}
            height={28}
            className="w-10 h-10 border border-slate-700/50 rounded image-rendering-pixelated"
            title="MNIST 28x28 normalized input"
          />
          <span className="text-[9px] font-mono text-slate-400 mt-1">28x28 fed</span>
        </div>
      </div>

      {/* Brush & Control Bar */}
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Brush Size</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.8"
              max="2.4"
              step="0.1"
              value={brushRadius}
              onChange={(e) => setBrushRadius(parseFloat(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-slate-400 w-6 text-right">{brushRadius}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={clearCanvas}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition-all active:scale-95"
          >
            <RotateCcw size={14} className="text-slate-400" />
            <span>Clear</span>
          </button>

          <button
            onClick={() => setAutoCenter(!autoCenter)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
              autoCenter
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/70 border-slate-700/60 text-slate-400'
            }`}
            title="Center of mass alignment to match MNIST training distribution"
          >
            <Crosshair size={14} />
            <span>Auto-Center</span>
          </button>

          <button
            onClick={triggerAdversarial}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs font-medium transition-all active:scale-95"
            title="Inject subtle adversarial perturbation to challenge the network"
          >
            <Zap size={14} className="text-purple-400" />
            <span>Nudge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
