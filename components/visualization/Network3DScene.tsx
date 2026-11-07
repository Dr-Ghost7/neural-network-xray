'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useNetworkStore } from '@/lib/store/useNetworkStore';

// Purple and Blue palette
const COLOR_IDLE = new THREE.Color('#0e1322');       // Deep obsidian indigo
const COLOR_BLUE = new THREE.Color('#3b82f6');       // Cobalt blue
const COLOR_INDIGO = new THREE.Color('#6366f1');     // Electric indigo
const COLOR_VIOLET = new THREE.Color('#8b5cf6');     // Electric violet
const COLOR_PURPLE = new THREE.Color('#c084fc');     // Glowing purple/lavender
const COLOR_SEVERED = new THREE.Color('#f43f5e');    // Ablation rose/magenta
const COLOR_SELECTED = new THREE.Color('#ffffff');   // White focus

export const Network3DScene: React.FC = () => {
  const {
    processedPixels,
    result,
    damagedNeurons,
    selectedNeuron,
    setSelectedNeuron,
  } = useNetworkStore();

  const inputMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const h1MeshRef = useRef<THREE.InstancedMesh | null>(null);
  const h2MeshRef = useRef<THREE.InstancedMesh | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);

  const tempColor = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Layer 0: 784 input pixels (28x28 grid in Y-Z plane at X = -14)
  const inputPositions = useMemo(() => {
    const pos: [number, number, number][] = [];
    const spacing = 0.32;
    const offset = (28 * spacing) / 2;
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        pos.push([-14, offset - y * spacing, x * spacing - offset]);
      }
    }
    return pos;
  }, []);

  // Layer 1: 64 hidden nodes (8x8 grid at X = -5)
  const h1Positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    const spacing = 0.85;
    const offset = (8 * spacing) / 2 - spacing / 2;
    for (let y = 0; y < 8; y++) {
      for (let z = 0; z < 8; z++) {
        pos.push([-5, offset - y * spacing, z * spacing - offset]);
      }
    }
    return pos;
  }, []);

  // Layer 2: 32 hidden nodes (8x4 grid at X = 5)
  const h2Positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    const spacing = 1.05;
    const offsetY = (8 * spacing) / 2 - spacing / 2;
    const offsetZ = (4 * spacing) / 2 - spacing / 2;
    for (let y = 0; y < 8; y++) {
      for (let z = 0; z < 4; z++) {
        pos.push([5, offsetY - y * spacing, z * spacing - offsetZ]);
      }
    }
    return pos;
  }, []);

  // Layer 3: 10 output nodes (column at X = 14)
  const outputPositions = useMemo(() => {
    const pos: [number, number, number][] = [];
    const spacing = 1.0;
    const offsetY = (10 * spacing) / 2 - spacing / 2;
    for (let i = 0; i < 10; i++) {
      pos.push([14, offsetY - i * spacing, 0]);
    }
    return pos;
  }, []);

  // Set up instance matrices
  useEffect(() => {
    if (inputMeshRef.current) {
      inputPositions.forEach((p, i) => {
        dummy.position.set(p[0], p[1], p[2]);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        inputMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      inputMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (h1MeshRef.current) {
      h1Positions.forEach((p, i) => {
        dummy.position.set(p[0], p[1], p[2]);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        h1MeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      h1MeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (h2MeshRef.current) {
      h2Positions.forEach((p, i) => {
        dummy.position.set(p[0], p[1], p[2]);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        h2MeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      h2MeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [inputPositions, h1Positions, h2Positions, dummy]);

  // Frame update
  useFrame(() => {
    // 1. Input layer color updates (Blue)
    if (inputMeshRef.current) {
      for (let i = 0; i < 784; i++) {
        const val = processedPixels[i] || 0;
        const isSelected = selectedNeuron?.layer === 'input' && selectedNeuron.index === i;

        if (isSelected) {
          tempColor.copy(COLOR_SELECTED);
        } else if (val > 0.05) {
          tempColor.lerpColors(COLOR_IDLE, COLOR_BLUE, Math.min(1.0, val * 1.5));
        } else {
          tempColor.copy(COLOR_IDLE);
        }
        inputMeshRef.current.setColorAt(i, tempColor);
      }
      if (inputMeshRef.current.instanceColor) {
        inputMeshRef.current.instanceColor.needsUpdate = true;
      }
    }

    // 2. Hidden Layer 1 updates (Indigo / Violet + dynamic active swelling)
    if (h1MeshRef.current && result) {
      const h1Act = result.activations.hidden1;
      let matrixNeedsUpdate = false;
      for (let i = 0; i < 64; i++) {
        const isDamaged = damagedNeurons.hidden1.has(i);
        const isSelected = selectedNeuron?.layer === 'hidden1' && selectedNeuron.index === i;
        const rawAct = h1Act[i] || 0;
        const act = Math.min(1.0, rawAct * 0.45);

        // Dynamically scale active nodes so they swell into visible beacons in 3D
        const p = h1Positions[i];
        dummy.position.set(p[0], p[1], p[2]);
        const scale = isDamaged ? 0.75 : isSelected ? 1.4 : rawAct > 0.3 ? 1.0 + Math.min(0.45, rawAct * 0.22) : 1.0;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        h1MeshRef.current.setMatrixAt(i, dummy.matrix);
        matrixNeedsUpdate = true;

        if (isDamaged) {
          tempColor.copy(COLOR_SEVERED);
        } else if (isSelected) {
          tempColor.copy(COLOR_SELECTED);
        } else if (act > 0.05) {
          tempColor.lerpColors(COLOR_IDLE, COLOR_INDIGO, act);
        } else {
          tempColor.copy(COLOR_IDLE);
        }
        h1MeshRef.current.setColorAt(i, tempColor);
      }
      if (matrixNeedsUpdate) {
        h1MeshRef.current.instanceMatrix.needsUpdate = true;
      }
      if (h1MeshRef.current.instanceColor) {
        h1MeshRef.current.instanceColor.needsUpdate = true;
      }
    }

    // 3. Hidden Layer 2 updates (Violet / Purple + dynamic active swelling)
    if (h2MeshRef.current && result) {
      const h2Act = result.activations.hidden2;
      let matrixNeedsUpdate = false;
      for (let i = 0; i < 32; i++) {
        const isDamaged = damagedNeurons.hidden2.has(i);
        const isSelected = selectedNeuron?.layer === 'hidden2' && selectedNeuron.index === i;
        const rawAct = h2Act[i] || 0;
        const act = Math.min(1.0, rawAct * 0.45);

        const p = h2Positions[i];
        dummy.position.set(p[0], p[1], p[2]);
        const scale = isDamaged ? 0.75 : isSelected ? 1.4 : rawAct > 0.3 ? 1.0 + Math.min(0.45, rawAct * 0.22) : 1.0;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        h2MeshRef.current.setMatrixAt(i, dummy.matrix);
        matrixNeedsUpdate = true;

        if (isDamaged) {
          tempColor.copy(COLOR_SEVERED);
        } else if (isSelected) {
          tempColor.copy(COLOR_SELECTED);
        } else if (act > 0.05) {
          tempColor.lerpColors(COLOR_IDLE, COLOR_PURPLE, act);
        } else {
          tempColor.copy(COLOR_IDLE);
        }
        h2MeshRef.current.setColorAt(i, tempColor);
      }
      if (matrixNeedsUpdate) {
        h2MeshRef.current.instanceMatrix.needsUpdate = true;
      }
      if (h2MeshRef.current.instanceColor) {
        h2MeshRef.current.instanceColor.needsUpdate = true;
      }
    }

    // 4. Dynamic Synapse Filaments (Blue -> Violet -> Purple gradient)
    if (linesRef.current && result) {
      const linePositions: number[] = [];
      const lineColors: number[] = [];

      // A. Input pixels -> H1
      const activeInputs: number[] = [];
      for (let i = 0; i < 784; i++) {
        if (processedPixels[i] > 0.35) activeInputs.push(i);
      }

      const activeH1: number[] = [];
      for (let j = 0; j < 64; j++) {
        if (!damagedNeurons.hidden1.has(j) && result.activations.hidden1[j] > 0.3) {
          activeH1.push(j);
        }
      }

      for (let i = 0; i < Math.min(activeInputs.length, 30); i++) {
        const inIdx = activeInputs[i];
        const p1 = inputPositions[inIdx];

        for (let j = 0; j < Math.min(activeH1.length, 8); j++) {
          const h1Idx = activeH1[j];
          const p2 = h1Positions[h1Idx];

          linePositions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
          lineColors.push(0.23, 0.51, 0.96, 0.54, 0.36, 0.96);
        }
      }

      // B. H1 -> H2
      const activeH2: number[] = [];
      for (let k = 0; k < 32; k++) {
        if (!damagedNeurons.hidden2.has(k) && result.activations.hidden2[k] > 0.3) {
          activeH2.push(k);
        }
      }

      for (let j = 0; j < Math.min(activeH1.length, 12); j++) {
        const p1 = h1Positions[activeH1[j]];
        for (let k = 0; k < Math.min(activeH2.length, 8); k++) {
          const p2 = h2Positions[activeH2[k]];
          linePositions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
          lineColors.push(0.54, 0.36, 0.96, 0.75, 0.52, 0.98);
        }
      }

      // C. H2 -> Output
      const predIdx = result.prediction;
      const outP = outputPositions[predIdx];
      for (let k = 0; k < activeH2.length; k++) {
        const p2 = h2Positions[activeH2[k]];
        linePositions.push(p2[0], p2[1], p2[2], outP[0], outP[1], outP[2]);
        lineColors.push(0.75, 0.52, 0.98, 0.88, 0.75, 1.0);
      }

      const geom = linesRef.current.geometry;
      geom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      geom.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
      geom.computeBoundingSphere();
    }
  });

  return (
    <>
      <ambientLight intensity={0.45} color="#1e1b4b" />
      <directionalLight position={[12, 18, 14]} intensity={0.9} color="#f8fafc" />
      <pointLight position={[-14, 0, 0]} intensity={1.6} color="#3b82f6" distance={22} />
      <pointLight position={[14, 0, 0]} intensity={1.8} color="#a855f7" distance={22} />

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        maxDistance={48}
        minDistance={9}
        target={[0, 0, 0]}
      />

      {/* Layer markers */}
      <Text position={[-14, 6.2, 0]} fontSize={0.52} color="#64748b" anchorX="center">
        INPUT · 784
      </Text>
      <Text position={[-5, 5.2, 0]} fontSize={0.52} color="#6366f1" anchorX="center">
        HIDDEN · 64
      </Text>
      <Text position={[5, 5.6, 0]} fontSize={0.52} color="#8b5cf6" anchorX="center">
        HIDDEN · 32
      </Text>
      <Text position={[14, 6.6, 0]} fontSize={0.52} color="#c084fc" anchorX="center">
        OUTPUT · 10
      </Text>

      {/* 1. Input Layer Mesh */}
      <instancedMesh
        ref={inputMeshRef}
        args={[undefined, undefined, 784]}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
            setSelectedNeuron({ layer: 'input', index: e.instanceId });
          }
        }}
      >
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshStandardMaterial
          roughness={0.25}
          metalness={0.75}
          emissiveIntensity={0.7}
        />
      </instancedMesh>

      {/* 2. Hidden Layer 1 Mesh */}
      <instancedMesh
        ref={h1MeshRef}
        args={[undefined, undefined, 64]}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
            setSelectedNeuron({ layer: 'hidden1', index: e.instanceId });
          }
        }}
      >
        <sphereGeometry args={[0.26, 12, 12]} />
        <meshStandardMaterial
          roughness={0.2}
          metalness={0.8}
          emissiveIntensity={0.85}
        />
      </instancedMesh>

      {/* 3. Hidden Layer 2 Mesh */}
      <instancedMesh
        ref={h2MeshRef}
        args={[undefined, undefined, 32]}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
            setSelectedNeuron({ layer: 'hidden2', index: e.instanceId });
          }
        }}
      >
        <sphereGeometry args={[0.32, 12, 12]} />
        <meshStandardMaterial
          roughness={0.2}
          metalness={0.8}
          emissiveIntensity={0.9}
        />
      </instancedMesh>

      {/* 4. Output Layer */}
      {outputPositions.map((pos, i) => {
        const isPredicted = result?.prediction === i;
        const isDamaged = damagedNeurons.output.has(i);
        const prob = result?.activations.output[i] || 0;

        let nodeColor = COLOR_IDLE;
        if (isDamaged) {
          nodeColor = COLOR_SEVERED;
        } else if (isPredicted) {
          nodeColor = COLOR_PURPLE;
        } else if (prob > 0.15) {
          nodeColor = COLOR_BLUE;
        }

        return (
          <group key={i} position={pos}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNeuron({ layer: 'output', index: i });
              }}
            >
              <sphereGeometry args={[isPredicted ? 0.44 : 0.32, 16, 16]} />
              <meshStandardMaterial
                color={nodeColor}
                emissive={nodeColor}
                emissiveIntensity={isPredicted ? 1.2 : isDamaged ? 0.8 : 0.25}
                roughness={0.15}
                metalness={0.85}
              />
            </mesh>

            <Text
              position={[0.85, 0, 0]}
              fontSize={0.48}
              color={isPredicted ? '#c084fc' : isDamaged ? '#f43f5e' : '#64748b'}
              anchorX="left"
              anchorY="middle"
            >
              {i}
            </Text>
          </group>
        );
      })}

      {/* Dynamic Synaptic Filaments */}
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </>
  );
};
