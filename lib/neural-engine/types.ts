export interface NetworkWeights {
  architecture: number[];
  w1: Float32Array;
  b1: Float32Array;
  w2: Float32Array;
  b2: Float32Array;
  w3: Float32Array;
  b3: Float32Array;
}

export interface RawWeightsJSON {
  architecture: number[];
  w1: number[];
  b1: number[];
  w2: number[];
  b2: number[];
  w3: number[];
  b3: number[];
}

export interface LayerActivations {
  input: Float32Array;   // 784
  hidden1: Float32Array; // 64
  hidden2: Float32Array; // 32
  output: Float32Array;  // 10
}

export interface DamagedNeurons {
  hidden1: Set<number>;
  hidden2: Set<number>;
  output: Set<number>;
}

export interface InferenceResult {
  activations: LayerActivations;
  prediction: number;
  confidence: number;
  entropy: number;
  latencyMs: number;
}

export interface SelectedNeuron {
  layer: 'input' | 'hidden1' | 'hidden2' | 'output';
  index: number;
}
