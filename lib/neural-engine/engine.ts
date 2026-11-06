import { NetworkWeights, LayerActivations, DamagedNeurons, InferenceResult } from './types';

/**
 * Pure TypeScript forward pass implementation for a 784 -> 64 -> 32 -> 10 Multilayer Perceptron.
 * Built with typed Float32Arrays for cache coherence and microsecond latency.
 */
export class NeuralEngine {
  private weights: NetworkWeights | null = null;

  constructor(weights?: NetworkWeights) {
    if (weights) {
      this.weights = weights;
    }
  }

  public setWeights(weights: NetworkWeights) {
    this.weights = weights;
  }

  public isReady(): boolean {
    return this.weights !== null;
  }

  public getWeights(): NetworkWeights | null {
    return this.weights;
  }

  /**
   * Run forward pass inference on 784 normalized pixel values.
   */
  public forward(
    input: Float32Array,
    damaged: DamagedNeurons = { hidden1: new Set(), hidden2: new Set(), output: new Set() }
  ): InferenceResult {
    const t0 = performance.now();

    if (!this.weights) {
      throw new Error('Model weights not loaded.');
    }

    const { w1, b1, w2, b2, w3, b3 } = this.weights;

    // Layer 1: 784 -> 64 (Dense + ReLU)
    const h1 = new Float32Array(64);
    for (let i = 0; i < 64; i++) {
      if (damaged.hidden1.has(i)) {
        h1[i] = 0;
        continue;
      }
      let sum = b1[i];
      const offset = i * 784;
      for (let j = 0; j < 784; j++) {
        sum += w1[offset + j] * input[j];
      }
      h1[i] = sum > 0 ? sum : 0; // ReLU
    }

    // Layer 2: 64 -> 32 (Dense + ReLU)
    const h2 = new Float32Array(32);
    for (let i = 0; i < 32; i++) {
      if (damaged.hidden2.has(i)) {
        h2[i] = 0;
        continue;
      }
      let sum = b2[i];
      const offset = i * 64;
      for (let j = 0; j < 64; j++) {
        sum += w2[offset + j] * h1[j];
      }
      h2[i] = sum > 0 ? sum : 0; // ReLU
    }

    // Layer 3: 32 -> 10 (Dense logits)
    const logits = new Float32Array(10);
    for (let i = 0; i < 10; i++) {
      if (damaged.output.has(i)) {
        logits[i] = -1e9; // Severed output node
        continue;
      }
      let sum = b3[i];
      const offset = i * 32;
      for (let j = 0; j < 32; j++) {
        sum += w3[offset + j] * h2[j];
      }
      logits[i] = sum;
    }

    // Softmax with numerical stabilization (subtract max)
    const output = new Float32Array(10);
    let maxLogit = -Infinity;
    for (let i = 0; i < 10; i++) {
      if (logits[i] > maxLogit) maxLogit = logits[i];
    }

    let sumExp = 0;
    for (let i = 0; i < 10; i++) {
      output[i] = Math.exp(logits[i] - maxLogit);
      sumExp += output[i];
    }

    let prediction = 0;
    let maxProb = -1;
    let entropy = 0;

    for (let i = 0; i < 10; i++) {
      output[i] = sumExp > 0 ? output[i] / sumExp : 0.1;
      const prob = output[i];
      if (prob > maxProb) {
        maxProb = prob;
        prediction = i;
      }
      if (prob > 1e-7) {
        entropy -= prob * Math.log2(prob);
      }
    }

    const latencyMs = performance.now() - t0;

    return {
      activations: {
        input,
        hidden1: h1,
        hidden2: h2,
        output,
      },
      prediction,
      confidence: maxProb,
      entropy,
      latencyMs: Number(latencyMs.toFixed(2)),
    };
  }
}
