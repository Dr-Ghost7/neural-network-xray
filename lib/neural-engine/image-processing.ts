/**
 * Image processing utilities for MNIST digit normalization.
 * Standard MNIST digits are size-normalized to fit in a 20x20 box
 * and centered at the center of mass in a 28x28 bounding field.
 */

export function centerDigit(pixels: Float32Array, width = 28, height = 28): Float32Array {
  let totalMass = 0;
  let cx = 0;
  let cy = 0;

  let minX = width, maxX = 0;
  let minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const val = pixels[y * width + x];
      if (val > 0.05) {
        totalMass += val;
        cx += x * val;
        cy += y * val;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If canvas is blank, return empty input
  if (totalMass === 0 || minX > maxX || minY > maxY) {
    return new Float32Array(width * height);
  }

  cx /= totalMass;
  cy /= totalMass;

  // Compute shift needed to place center of mass at (13.5, 13.5)
  const shiftX = Math.round(13.5 - cx);
  const shiftY = Math.round(13.5 - cy);

  const centered = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    const srcY = y - shiftY;
    if (srcY < 0 || srcY >= height) continue;

    for (let x = 0; x < width; x++) {
      const srcX = x - shiftX;
      if (srcX < 0 || srcX >= width) continue;

      centered[y * width + x] = pixels[srcY * width + srcX];
    }
  }

  return centered;
}

/**
 * Adds an adversarial perturbation (Fast Gradient Sign style nudge)
 * that pushes prediction away from target digit.
 */
export function applyAdversarialNudge(
  pixels: Float32Array,
  weights: Float32Array, // W1 weights (64 * 784)
  activeNeuronIdx: number,
  epsilon: number = 0.15
): Float32Array {
  const nudged = new Float32Array(pixels.length);
  const offset = activeNeuronIdx * 784;

  for (let i = 0; i < pixels.length; i++) {
    const gradSign = Math.sign(weights[offset + i]);
    let val = pixels[i] - epsilon * gradSign;
    if (val < 0) val = 0;
    if (val > 1) val = 1;
    nudged[i] = val;
  }

  return nudged;
}
