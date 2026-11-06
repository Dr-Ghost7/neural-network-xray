# Neural Network X-Ray

An interactive 3D WebGL visualizer and ablation sandbox for real-time neural network inference running directly in the browser.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-blue?style=flat-square&logo=three.js)](https://docs.pmnd.rs/react-three-fiber)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

---

## Why I Built This

Most machine learning demos on the web treat neural networks as black boxes: you draw a digit or upload an image, wait for an API response, and get back a static percentage. You never actually see *how* the network evaluates the input or changes its mind.

**Neural Network X-Ray** runs a full feed-forward pass on every cursor stroke at 60 FPS and translates the internal activations into an interactive 3D scene using **React Three Fiber**. As you sketch, you can see input pixels light up hidden layers, observe competing output classes fight for dominance, and physically inspect or "damage" individual neurons to test fault tolerance.

---

## What You Can Do

- **Draw & Classify in Real Time:** Sketch any digit (0–9) on the 28×28 pad. Inference triggers continuously on pointer events without debounce delays.
- **Inspect Receptive Fields:** Click any node in Hidden Layer 1 to view its learned 28×28 spatial weight filter, showing the specific stroke geometry that excites it.
- **Sever Neurons ("Damage Mode"):** Click a neuron in the 3D scene to cut its signal ($a_i = 0$). Watch how the network either tolerates the lesion through distributed representation or misclassifies the digit.
- **Adversarial Nudge:** Inject targeted Fast Gradient Sign perturbations to flip the network's prediction while keeping the drawing recognizable to human eyes.
- **Scrub Training Checkpoints:** Step through historical training checkpoints (from Epoch 0 random static to Epoch 6 convergence) to see how internal representations sharpen over time.
- **Shannon Entropy Indicator:** Tracks prediction ambiguity ($H = -\sum p \log_2 p$) in real time, alerting you when the model is torn between ambiguous digits (like a contested 4 vs 9).

---

## Engineering & Architecture Decisions

### 1. Zero-Dependency TypeScript Engine (No TensorFlow.js)
TensorFlow.js adds over 2MB of vendor bundle overhead. For an MLP ($784 \to 64 \to 32 \to 10$), the entire forward pass is just three matrix multiplications, two ReLU passes, and a numerically stabilized Softmax:

$$h_1 = \max(0, W_1 x + b_1)$$
$$h_2 = \max(0, W_2 h_1 + b_2)$$
$$\hat{y} = \text{Softmax}(W_3 h_2 + b_3)$$

Implemented in pure TypeScript using native `Float32Array` buffers, inference runs in under **0.15ms** per frame on commodity hardware. Model weights are bundled as static JSON assets taking under 300KB.

### 2. Solving the 50,000-Connection Three.js Bottleneck
Layer 1 alone has $784 \times 64 = 50{,}176$ potential synaptic connections. Rendering 50,000 discrete Three.js line objects cripples WebGL performance.

- **Instanced Mesh Nodes:** All 890 spheres across the four layers are rendered via Three.js `InstancedMesh`. Instance transforms are uploaded once; per-instance colors update dynamically inside `useFrame` using a pre-allocated color scratchpad to avoid garbage collection spikes.
- **Dynamic Synapse Culling:** Rather than rendering every connection, the engine dynamically batches only active excitation paths (active inputs $\to$ active hidden nodes $\to$ winning output) into a single `LineSegments` geometry with vertex colors.

### 3. State Management with Zustand
Continuous mouse and touch moves on an HTML5 canvas fire at 60–120Hz. Routing high-frequency drawing events through conventional React component state causes unnecessary re-renders across the tree. Drawing mutations write directly to a shared `Float32Array` buffer in Zustand, letting the canvas, inference engine, and 3D viewport stay in sync without reconciliation drag.

### 4. Center-of-Mass Alignment (MNIST Normalization)
Raw user drawings often fail on MNIST models because the training dataset is tightly centered by center-of-mass inside a $20 \times 20$ pixel bounding box. The app includes an auto-centering utility (`centerDigit`) that computes the bounding box and mass centroid of the drawn digit and shifts it to $(13.5, 13.5)$ before inference.

---

## Project Structure

```
neural-network-xray/
├── app/
│   ├── globals.css              # Cyber-slate theme & canvas grid styling
│   ├── layout.tsx               # Root layout & SEO metadata
│   └── page.tsx                 # Main application dashboard
├── components/
│   ├── canvas/
│   │   └── DigitCanvas.tsx      # 28x28 drawing pad with stroke interpolation
│   ├── visualization/
│   │   ├── Network3DScene.tsx    # R3F scene with InstancedMesh & dynamic synapses
│   │   └── NetworkCanvas3D.tsx   # Canvas wrapper & OrbitControls configuration
│   ├── inspector/
│   │   └── NeuronInspector.tsx   # Receptive field heatmap & neuron ablation controls
│   ├── predictions/
│   │   └── PredictionPanel.tsx   # Live classification bars & entropy indicator
│   ├── controls/
│   │   └── ReplayControls.tsx    # Training timeline scrubber & checkpoint playback
│   └── ui/
│       └── Header.tsx           # Navigation bar with sample digit presets
├── lib/
│   ├── neural-engine/
│   │   ├── engine.ts            # Handwritten forward pass & Softmax
│   │   ├── image-processing.ts  # Center-of-mass shift & adversarial nudge
│   │   └── types.ts             # Layer activations & weight interfaces
│   ├── store/
│   │   └── useNetworkStore.ts   # Central reactive Zustand store
│   └── data/
│       └── presets.ts           # Pre-rasterized digits for instant testing
├── public/
│   └── weights/                 # Trained weights & checkpoint JSON files
└── scripts/
    └── train_export.py          # PyTorch training & export script
```

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 20 and Node 22)
- npm, pnpm, or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Dr-Ghost7/neural-network-xray.git
cd neural-network-xray
```

2. Install dependencies:
```bash
npm install
```

3. Start the local dev server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Retraining the Model (Optional)

Pre-trained weights (`97.26%` test accuracy) and checkpoint snapshots are already committed under `public/weights/`. If you want to train your own weights or change the layer dimensions:

```bash
cd scripts
pip install torch torchvision numpy
python train_export.py
```

This runs a 6-epoch training loop over MNIST, extracts the weights at epochs 0, 1, 2, 4, and 6, and saves the formatted JSON files to `public/weights/`.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **3D Graphics:** Three.js, React Three Fiber, Drei
- **State Management:** Zustand
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS, Lucide Icons
- **ML / Math:** Custom forward pass with Float32Array (offline trained with PyTorch)
