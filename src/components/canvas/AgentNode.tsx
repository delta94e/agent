'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAgentStore } from '@/store/agentStore';
import { useUIStore } from '@/store/uiStore';
import { statusColors } from '@/theme/tokens';

interface AgentNodeProps {
  id: string;
}

export function AgentNode({ id }: AgentNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const agent = useAgentStore((state) => state.agents.find((a) => a.id === id));
  const selectedAgentId = useUIStore((state) => state.selectedAgentId);
  const selectAgent = useUIStore((state) => state.selectAgent);
  const setHoveredAgent = useUIStore((state) => state.setHoveredAgent);

  const isSelected = selectedAgentId === id;

  const color = useMemo(() => new THREE.Color(agent?.color || '#00f5ff'), [agent?.color]);

  const tempVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const pos = useAgentStore.getState().positions[id];
    if (!pos || !groupRef.current) return;

    // Smooth lerp entire group to target position
    tempVec.set(pos.x, pos.y, pos.z);
    groupRef.current.position.lerp(tempVec, 0.08);

    // Animate based on status
    const currentStatus = useAgentStore.getState().agents.find((a) => a.id === id)?.status;

    if (currentStatus === 'processing') {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      if (glowRef.current) glowRef.current.scale.setScalar(pulse);
    } else if (currentStatus === 'active') {
      const float = Math.sin(state.clock.elapsedTime * 1.5 + parseInt(id.split('-')[1] || '0')) * 0.3;
      groupRef.current.position.y += float * 0.02;
    }

    // Hover/select scale
    const targetScale = hovered || isSelected ? 1.15 : 1;
    groupRef.current.scale.lerp(tempVec.set(targetScale, targetScale, targetScale), 0.1);
  });

  if (!agent) return null;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectAgent(isSelected ? null : id);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    setHoveredAgent(id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    setHoveredAgent(null);
    document.body.style.cursor = 'auto';
  };

  const emissiveIntensity = agent.status === 'processing' ? 0.8 : agent.status === 'active' ? 0.5 : 0.2;

  return (
    <group ref={groupRef}>
      {/* Core sphere */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.75, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered || isSelected ? 0.2 : 0.08}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.0, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* HTML label — attached to group so it follows the node */}
      <Html
        position={[0, 1.0, 0]}
        center
        sprite
        zIndexRange={[10, 0]}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '10px',
            fontWeight: 600,
            color: '#e2e8f0',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            padding: '2px 8px',
            background: 'rgba(10, 10, 15, 0.85)',
            borderRadius: '4px',
            border: `1px solid ${agent.color}40`,
            letterSpacing: '0.5px',
            textShadow: `0 0 8px ${agent.color}60`,
            transform: 'scale(0.85)',
          }}
        >
          <span style={{ marginRight: '3px' }}>{agent.icon}</span>
          {agent.name}
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: statusColors[agent.status],
              boxShadow: `0 0 6px ${statusColors[agent.status]}`,
              marginLeft: '6px',
              verticalAlign: 'middle',
              animation: agent.status === 'processing' ? 'pulse-dot 0.8s infinite' : undefined,
            }}
          />
        </div>
      </Html>
    </group>
  );
}

