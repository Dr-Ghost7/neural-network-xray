'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNetworkStore } from '@/lib/store/useNetworkStore';
import { Crosshair, Zap, RotateCcw } from 'lucide-react';

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

  const CANVAS_SIZE = 280;
  const GRID_SIZE = 28;
  const SCALE = CANVAS_SIZE / GRID_SIZE;

  // Render 28x28 pixel array onto visual canvas
  const drawFromPixels = useCallback((px: Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#05060b';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const val = px[y * GRID_SIZE + x];
        if (val > 0.01) {
          const brightness = Math.min(255, Math.floor(val * 255));
          // Subtle cool white/lavender stroke tone
          ctx.fillStyle = `rgb(${brightness}, ${Math.floor(brightness * 0.96)}, ${Math.floor(brightness * 1.05)})`;
          ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
        }
      }
    }
  }, [CANVAS_SIZE, SCALE]);

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
      imgData.data[idx] = val;
      imgData.data[idx + 1] = Math.floor(val * 0.95);
      imgData.data[idx + 2] = Math.min(255, Math.floor(val * 1.15));
      imgData.data[idx + 3] = 255;
    }
    pCtx.putImageData(imgData, 0, 0);
  }, [processedPixels]);

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
    <div className="flex flex-col bg-[#0b0e19] border border-white/[0.07] rounded-2xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
          <h3 className="text-xs font-mono font-medium tracking-wider text-slate-300 uppercase">
            Drawing Surface
          </h3>
        </div>

        {result && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-950/40 border border-violet-500/20 text-violet-300">
            {result.latencyMs} ms
          </span>
        )}
      </div>

      {/* Main Drawing Area */}
      <div className="relative mx-auto my-1 rounded-xl overflow-hidden border border-white/[0.08] shadow-inner group">
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

        {/* Tactile drafting crosshairs */}
        <div className="absolute top-2 left-2 text-[10px] font-mono text-white/10 pointer-events-none select-none">+</div>
        <div className="absolute top-2 right-2 text-[10px] font-mono text-white/10 pointer-events-none select-none">+</div>
        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white/10 pointer-events-none select-none">+</div>

        {/* Normalized 28x28 feed thumbnail */}
        <div className="absolute bottom-2 right-2 flex flex-col items-center bg-[#070912]/90 border border-white/10 p-1.5 rounded-lg shadow-lg">
          <canvas
            ref={previewCanvasRef}
            width={28}
            height={28}
            className="w-9 h-9 border border-white/10 rounded image-rendering-pixelated"
            title="MNIST 28x28 normalized input"
          />
          <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase tracking-tight">Normalized</span>
        </div>
      </div>

      {/* Brush & Control Bar */}
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px] font-mono">Stroke Width</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.8"
              max="2.4"
              step="0.1"
              value={brushRadius}
              onChange={(e) => setBrushRadius(parseFloat(e.target.value))}
              className="w-24 cursor-pointer"
            />
            <span className="font-mono text-slate-400 w-5 text-right text-[11px]">{brushRadius}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={clearCanvas}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-medium text-slate-300 transition-all active:scale-95"
          >
            <RotateCcw size={13} className="text-slate-400" />
            <span>Clear</span>
          </button>

          <button
            onClick={() => setAutoCenter(!autoCenter)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
              autoCenter
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                : 'bg-white/[0.04] border-white/[0.06] text-slate-400'
            }`}
            title="Bounding-box centering for MNIST compatibility"
          >
            <Crosshair size={13} />
            <span>Center</span>
          </button>

          <button
            onClick={triggerAdversarial}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/35 text-violet-300 text-xs font-medium transition-all active:scale-95 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
            title="Fast Gradient Sign perturbation"
          >
            <Zap size={13} className="text-violet-400" />
            <span>Nudge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
