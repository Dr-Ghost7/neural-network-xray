/**
 * Sample digit pixel grids for immediate testing without manual drawing.
 * Each entry is a 784-element Float32Array (28x28).
 */

function generateDigitPattern(drawFn: (grid: number[][]) => void): Float32Array {
  const grid: number[][] = Array(28).fill(0).map(() => Array(28).fill(0));
  drawFn(grid);

  const flat = new Float32Array(784);
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      flat[y * 28 + x] = Math.min(1.0, grid[y][x]);
    }
  }
  return flat;
}

function strokeCircle(grid: number[][], cx: number, cy: number, r: number, val = 0.9) {
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const dist = Math.abs(Math.hypot(x - cx, y - cy) - r);
      if (dist < 1.4) {
        grid[y][x] = Math.max(grid[y][x], val * (1 - dist / 1.4));
      }
    }
  }
}

function strokeLine(grid: number[][], x0: number, y0: number, x1: number, y1: number, val = 0.9) {
  const steps = Math.hypot(x1 - x0, y1 - y0) * 3;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x0 + t * (x1 - x0));
    const y = Math.round(y0 + t * (y1 - y0));
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < 28 && ny >= 0 && ny < 28) {
          const d = Math.hypot(dx, dy);
          if (d <= 1.2) {
            grid[ny][nx] = Math.max(grid[ny][nx], val * (1 - d / 1.5));
          }
        }
      }
    }
  }
}

export const sampleDigits: Record<number, Float32Array> = {
  // Digit 0
  0: generateDigitPattern((g) => {
    strokeCircle(g, 14, 14, 7);
  }),

  // Digit 3
  3: generateDigitPattern((g) => {
    strokeLine(g, 9, 7, 19, 7);
    strokeLine(g, 19, 7, 14, 14);
    strokeLine(g, 14, 14, 19, 17);
    strokeLine(g, 19, 17, 18, 22);
    strokeLine(g, 18, 22, 10, 22);
  }),

  // Digit 5
  5: generateDigitPattern((g) => {
    strokeLine(g, 19, 7, 10, 7);
    strokeLine(g, 10, 7, 9, 14);
    strokeLine(g, 9, 14, 17, 14);
    strokeLine(g, 17, 14, 18, 21);
    strokeLine(g, 18, 21, 10, 21);
  }),

  // Digit 7
  7: generateDigitPattern((g) => {
    strokeLine(g, 8, 7, 20, 7);
    strokeLine(g, 20, 7, 11, 23);
  }),

  // Digit 8
  8: generateDigitPattern((g) => {
    strokeCircle(g, 14, 10, 4.5);
    strokeCircle(g, 14, 18, 5.5);
  }),
};
