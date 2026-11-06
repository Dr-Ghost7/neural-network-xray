import { create } from 'zustand';
import { 
  InferenceResult, 
  DamagedNeurons, 
  SelectedNeuron, 
  NetworkWeights, 
  RawWeightsJSON 
} from '../neural-engine/types';
import { NeuralEngine } from '../neural-engine/engine';
import { centerDigit, applyAdversarialNudge } from '../neural-engine/image-processing';

interface NetworkState {
  // Engine
  engine: NeuralEngine;
  isEngineReady: boolean;
  weights: NetworkWeights | null;
  checkpoints: Record<number, RawWeightsJSON>;
  activeEpoch: number;

  // Drawing & Input
  pixels: Float32Array; // 784
  processedPixels: Float32Array; // 784 centered or passed through
  autoCenter: boolean;
  brushRadius: number;

  // Inference & Inspection
  result: InferenceResult | null;
  selectedNeuron: SelectedNeuron | null;
  damagedNeurons: DamagedNeurons;
  viewMode: '3d' | '2d' | 'split';
  compareMode: boolean;

  // Actions
  initWeights: (weightsJson: RawWeightsJSON, checkpoints?: Record<number, RawWeightsJSON>) => void;
  setEpoch: (epoch: number) => void;
  setPixels: (pixels: Float32Array) => void;
  clearCanvas: () => void;
  setAutoCenter: (val: boolean) => void;
  setBrushRadius: (val: number) => void;
  setViewMode: (mode: '3d' | '2d' | 'split') => void;
  setCompareMode: (val: boolean) => void;
  setSelectedNeuron: (neuron: SelectedNeuron | null) => void;
  toggleDamageNeuron: (layer: 'hidden1' | 'hidden2' | 'output', index: number) => void;
  resetDamagedNeurons: () => void;
  triggerAdversarial: () => void;
  runInference: () => void;
}

function parseWeights(raw: RawWeightsJSON): NetworkWeights {
  return {
    architecture: raw.architecture,
    w1: new Float32Array(raw.w1),
    b1: new Float32Array(raw.b1),
    w2: new Float32Array(raw.w2),
    b2: new Float32Array(raw.b2),
    w3: new Float32Array(raw.w3),
    b3: new Float32Array(raw.b3),
  };
}

export const useNetworkStore = create<NetworkState>((set, get) => {
  const engine = new NeuralEngine();

  return {
    engine,
    isEngineReady: false,
    weights: null,
    checkpoints: {},
    activeEpoch: 6,

    pixels: new Float32Array(784),
    processedPixels: new Float32Array(784),
    autoCenter: true,
    brushRadius: 1.3,

    result: null,
    selectedNeuron: null,
    damagedNeurons: {
      hidden1: new Set<number>(),
      hidden2: new Set<number>(),
      output: new Set<number>(),
    },
    viewMode: 'split',
    compareMode: false,

    initWeights: (weightsJson, checkpoints = {}) => {
      const parsed = parseWeights(weightsJson);
      engine.setWeights(parsed);

      set({
        weights: parsed,
        checkpoints,
        isEngineReady: true,
      });

      get().runInference();
    },

    setEpoch: (epoch: number) => {
      const { checkpoints } = get();
      if (!checkpoints[epoch]) return;

      const newWeights = parseWeights(checkpoints[epoch]);
      engine.setWeights(newWeights);

      set({
        weights: newWeights,
        activeEpoch: epoch,
      });

      get().runInference();
    },

    setPixels: (pixels: Float32Array) => {
      const { autoCenter } = get();
      const processed = autoCenter ? centerDigit(pixels) : pixels;
      set({ pixels, processedPixels: processed });
      get().runInference();
    },

    clearCanvas: () => {
      const empty = new Float32Array(784);
      set({ pixels: empty, processedPixels: empty, selectedNeuron: null });
      get().runInference();
    },

    setAutoCenter: (val: boolean) => {
      const { pixels } = get();
      const processed = val ? centerDigit(pixels) : pixels;
      set({ autoCenter: val, processedPixels: processed });
      get().runInference();
    },

    setBrushRadius: (val: number) => {
      set({ brushRadius: val });
    },

    setViewMode: (mode) => {
      set({ viewMode: mode });
    },

    setCompareMode: (val) => {
      set({ compareMode: val });
    },

    setSelectedNeuron: (neuron) => {
      set({ selectedNeuron: neuron });
    },

    toggleDamageNeuron: (layer, index) => {
      const { damagedNeurons } = get();
      const currentSet = new Set(damagedNeurons[layer]);

      if (currentSet.has(index)) {
        currentSet.delete(index);
      } else {
        currentSet.add(index);
      }

      set({
        damagedNeurons: {
          ...damagedNeurons,
          [layer]: currentSet,
        },
      });

      get().runInference();
    },

    resetDamagedNeurons: () => {
      set({
        damagedNeurons: {
          hidden1: new Set(),
          hidden2: new Set(),
          output: new Set(),
        },
      });
      get().runInference();
    },

    triggerAdversarial: () => {
      const { processedPixels, weights, result } = get();
      if (!weights || !result) return;

      // Perturb towards the runner-up or away from prediction
      const targetNeuron = (result.prediction + 1) % 10;
      const nudged = applyAdversarialNudge(processedPixels, weights.w1, targetNeuron, 0.22);
      
      set({ pixels: nudged, processedPixels: nudged });
      get().runInference();
    },

    runInference: () => {
      const { engine, processedPixels, damagedNeurons, isEngineReady } = get();
      if (!isEngineReady) return;

      try {
        const res = engine.forward(processedPixels, damagedNeurons);
        set({ result: res });
      } catch (err) {
        console.error('Inference error:', err);
      }
    },
  };
});
