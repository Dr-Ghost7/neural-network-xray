'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useNetworkStore } from '@/lib/store/useNetworkStore';

// Color definitions
const COLOR_IDLE = new THREE.Color('#1e293b');
const COLOR_CYAN = new THREE.Color('#00f0ff');
const COLOR_AMBER = new THREE.Color('#f59e0b');
const COLOR_ROSE = new THREE.Color('#f43f5e');
const COLOR_EMERALD = new THREE.Color('#10b981');

export const Network3DScene: React.FC = () => {
  const {
    processedPixels,
    result,
    damagedNeurons,
    selectedNeuron,
    setSelectedNeuron,
  } = useNetworkStore();

  // Mesh and Buffer references
  const inputMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const h1MeshRef = useRef<THREE.InstancedMesh | null>(null);
  const h2MeshRef = useRef<THREE.InstancedMesh | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);

  // Temporary Three.js math objects to avoid GC allocation during render loop
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 1. Calculate positions for all layers
  // Layer 0: 784 input pixels (28x28 grid in Y-Z plane at X = -14)
  const inputPositions = useMemo(() => {
    const pos: [number, number, number][] = [];
    const spacing = 0.32;
    const offset = (28 * spacing) / 2;
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        // Center the 28x28 grid
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

  // Setup initial instance transforms
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

  // Frame update: Update instance colors and synaptic connections smoothly
  useFrame(() => {
    // 1. Update Input Nodes
    if (inputMeshRef.current) {
      for (let i = 0; i < 784; i++) {
        const val = processedPixels[i] || 0;
        const isSelected = selectedNeuron?.layer === 'input' && selectedNeuron.index === i;

        if (isSelected) {
          tempColor.set(COLOR_AMBER);
        } else if (val > 0.05) {
          tempColor.lerpColors(COLOR_IDLE, COLOR_CYAN, Math.min(1.0, val * 1.4));
        } else {
          tempColor.copy(COLOR_IDLE);
        }
        inputMeshRef.current.setColorAt(i, tempColor);
      }
      if (inputMeshRef.current.instanceColor) {
        inputMeshRef.current.instanceColor.needsUpdate = true;
      }
    }

    // 2. Update Hidden Layer 1 Nodes
    if (h1MeshRef.current && result) {
      const h1Act = result.activations.hidden1;
      for (let i = 0; i < 64; i++) {
        const isDamaged = damagedNeurons.hidden1.has(i);
        const isSelected = selectedNeuron?.layer === 'hidden1' && selectedNeuron.index === i;
        const act = Math.min(1.0, (h1Act[i] || 0) * 0.4);

        if (isDamaged) {
          tempColor.set(COLOR_ROSE);
        } else if (isSelected) {
          tempColor.set(COLOR_AMBER);
        } else if (act > 0.05) {
          tempColor.lerpColors(COLOR_IDLE, COLOR_CYAN, act);
        } else {
          tempColor.copy(COLOR_IDLE);
        }
        h1MeshRef.current.setColorAt(i, tempColor);
      }
      if (h1MeshRef.current.instanceColor) {
        h1MeshRef.current.instanceColor.needsUpdate = true;
      }
    }

    // 3. Update Hidden Layer 2 Nodes
    if (h2MeshRef.current && result) {
      const h2Act = result.activations.hidden2;
      for (let i = 0; i < 32; i++) {
        const isDamaged = damagedNeurons.hidden2.has(i);
        const isSelected = selectedNeuron?.layer === 'hidden2' && selectedNeuron.index === i;
        const act = Math.min(1.0, (h2Act[i] || 0) * 0.4);

        if (isDamaged) {
          tempColor.set(COLOR_ROSE);
        } else if (isSelected) {
          tempColor.set(COLOR_AMBER);
        } else if (act > 0.05) {
          tempColor.lerpColors(COLOR_IDLE, COLOR_EMERALD, act);
        } else {
          tempColor.copy(COLOR_IDLE);
        }
        h2MeshRef.current.setColorAt(i, tempColor);
      }
      if (h2MeshRef.current.instanceColor) {
        h2MeshRef.current.instanceColor.needsUpdate = true;
      }
    }

    // 4. Update Dynamic Synapses (Lines between active nodes)
    if (linesRef.current && result) {
      const linePositions: number[] = [];
      const lineColors: number[] = [];

      // A. Active input pixels to active H1 nodes (top connections only to guarantee 60fps)
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

      // Sample representative connections
      for (let i = 0; i < Math.min(activeInputs.length, 30); i++) {
        const inIdx = activeInputs[i];
        const p1 = inputPositions[inIdx];

        for (let j = 0; j < Math.min(activeH1.length, 8); j++) {
          const h1Idx = activeH1[j];
          const p2 = h1Positions[h1Idx];

          linePositions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
          // Cyan synaptic tint with alpha-like falloff
          lineColors.push(0.0, 0.7, 0.9, 0.0, 0.9, 1.0);
        }
      }

      // B. Active H1 nodes to active H2 nodes
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
          lineColors.push(0.0, 0.9, 0.8, 0.1, 0.9, 0.5);
        }
      }

      // C. Active H2 nodes to predicted Output node
      const predIdx = result.prediction;
      const outP = outputPositions[predIdx];
      for (let k = 0; k < activeH2.length; k++) {
        const p2 = h2Positions[activeH2[k]];
        linePositions.push(p2[0], p2[1], p2[2], outP[0], outP[1], outP[2]);
        lineColors.push(0.1, 0.8, 0.5, 0.0, 1.0, 0.8);
      }

      const geom = linesRef.current.geometry;
      geom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      geom.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
      geom.computeBoundingSphere();
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 15]} intensity={0.9} />
      <pointLight position={[-14, 0, 0]} intensity={1.5} color="#00f0ff" distance={20} />
      <pointLight position={[14, 0, 0]} intensity={1.5} color="#10b981" distance={20} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxDistance={50}
        minDistance={8}
        target={[0, 0, 0]}
      />

      {/* Layer Labels */}
      <Text position={[-14, 6, 0]} fontSize={0.6} color="#64748b" anchorX="center">
        INPUT (784)
      </Text>
      <Text position={[-5, 5, 0]} fontSize={0.6} color="#64748b" anchorX="center">
        HIDDEN 1 (64)
      </Text>
      <Text position={[5, 5.5, 0]} fontSize={0.6} color="#64748b" anchorX="center">
        HIDDEN 2 (32)
      </Text>
      <Text position={[14, 6.5, 0]} fontSize={0.6} color="#64748b" anchorX="center">
        OUTPUT (10)
      </Text>

      {/* 1. Input Layer Mesh (Instanced) */}
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
          roughness={0.3}
          metalness={0.7}
          emissiveIntensity={0.6}
        />
      </instancedMesh>

      {/* 2. Hidden Layer 1 Mesh (Instanced) */}
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
          emissiveIntensity={0.8}
        />
      </instancedMesh>

      {/* 3. Hidden Layer 2 Mesh (Instanced) */}
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
          emissiveIntensity={0.8}
        />
      </instancedMesh>

      {/* 4. Output Layer (Individual Meshes with Digit Labels) */}
      {outputPositions.map((pos, i) => {
        const isPredicted = result?.prediction === i;
        const isDamaged = damagedNeurons.output.has(i);
        const prob = result?.activations.output[i] || 0;

        let nodeColor = COLOR_IDLE;
        if (isDamaged) {
          nodeColor = COLOR_ROSE;
        } else if (isPredicted) {
          nodeColor = COLOR_CYAN;
        } else if (prob > 0.15) {
          nodeColor = COLOR_AMBER;
        }

        return (
          <group key={i} position={pos}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNeuron({ layer: 'output', index: i });
              }}
            >
              <sphereGeometry args={[isPredicted ? 0.44 : 0.34, 16, 16]} />
              <meshStandardMaterial
                color={nodeColor}
                emissive={nodeColor}
                emissiveIntensity={isPredicted ? 1.0 : isDamaged ? 0.7 : 0.2}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>

            {/* Glowing Digit Label next to the node */}
            <Text
              position={[0.8, 0, 0]}
              fontSize={0.48}
              color={isPredicted ? '#00f0ff' : isDamaged ? '#f43f5e' : '#94a3b8'}
              anchorX="left"
              anchorY="middle"
            >
              {i}
            </Text>
          </group>
        );
      })}

      {/* Synaptic Filaments / Connection Lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </>
  );
};
