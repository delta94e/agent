'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAgentStore } from '@/store/agentStore';
import type { Connection } from '@/types';

interface ConnectionEdgeProps {
  connection: Connection;
}

export function ConnectionEdge({ connection }: ConnectionEdgeProps) {
  const lineRef = useRef<THREE.Line>(null);

  const lineObj = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(6); // 2 points × 3 coords
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: connection.isActive ? 0x00f5ff : 0x1a1a2e,
      transparent: true,
      opacity: connection.isActive ? 0.6 : 0.2,
    });

    return new THREE.Line(geometry, material);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const positions = useAgentStore.getState().positions;
    const source = positions[connection.sourceAgentId];
    const target = positions[connection.targetAgentId];

    if (!source || !target || !lineObj) return;

    const posAttr = lineObj.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.setXYZ(0, source.x, source.y, source.z);
    posAttr.setXYZ(1, target.x, target.y, target.z);
    posAttr.needsUpdate = true;

    // Animate opacity for active connections
    const mat = lineObj.material as THREE.LineBasicMaterial;
    const isActive = useAgentStore.getState().connections.find((c) => c.id === connection.id)?.isActive;
    // eslint-disable-next-line react-hooks/immutability
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, isActive ? 0.6 : 0.15, 0.05);
    mat.color.set(isActive ? 0x00f5ff : 0x2a2a3e);
  });

  return <primitive ref={lineRef} object={lineObj} />;
}

