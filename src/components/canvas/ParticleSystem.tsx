'use client';
/* eslint-disable react-hooks/purity */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAgentStore } from '@/store/agentStore';

const PARTICLE_COUNT = 2000;

interface Particle {
  connectionId: string;
  progress: number;
  speed: number;
  size: number;
}

export function ParticleSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useRef<Particle[]>(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      connectionId: '',
      progress: Math.random(),
      speed: 0.002 + Math.random() * 0.006,
      size: 0.03 + Math.random() * 0.04,
    }))
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { connections, positions } = useAgentStore.getState();
    const activeConnections = connections.filter((c) => c.isActive);

    if (activeConnections.length === 0) {
      // Hide all particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        dummy.position.set(0, 0, -1000);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      return;
    }

    const particlesPerConnection = Math.floor(PARTICLE_COUNT / activeConnections.length);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const connIdx = Math.floor(i / particlesPerConnection);
      if (connIdx >= activeConnections.length) {
        // Extra particles — hide them
        dummy.position.set(0, 0, -1000);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      const conn = activeConnections[connIdx];
      const source = positions[conn.sourceAgentId];
      const target = positions[conn.targetAgentId];

      if (!source || !target) {
        dummy.position.set(0, 0, -1000);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      const p = particles.current[i];
      p.progress += p.speed;
      if (p.progress > 1) p.progress -= 1;

      // Lerp along the connection path
      const t = p.progress;
      dummy.position.set(
        source.x + (target.x - source.x) * t + (Math.random() - 0.5) * 0.15,
        source.y + (target.y - source.y) * t + (Math.random() - 0.5) * 0.15,
        source.z + (target.z - source.z) * t + (Math.random() - 0.5) * 0.15
      );

      // Fade in/out at edges
      const fade = Math.sin(t * Math.PI);
      dummy.scale.setScalar(p.size * fade);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={0x00f5ff} transparent opacity={0.7} toneMapped={false} />
    </instancedMesh>
  );
}
