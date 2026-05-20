'use client';

import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { SceneEnvironment } from './SceneEnvironment';
import { AgentNode } from './AgentNode';
import { ConnectionEdge } from './ConnectionEdge';
import { ParticleSystem } from './ParticleSystem';
import { useAgentStore } from '@/store/agentStore';
import { useUIStore } from '@/store/uiStore';

export function AgentGraph() {
  const agents = useAgentStore((state) => state.agents);
  const connections = useAgentStore((state) => state.connections);
  const selectAgent = useUIStore((state) => state.selectAgent);

  const handleCanvasClick = () => {
    // Deselect agent when clicking empty canvas
    selectAgent(null);
  };

  return (
    <div className="canvas-layer">
      <Canvas
        camera={{ position: [0, 0, 18], fov: 60 }}
        onPointerMissed={handleCanvasClick}
        gl={{
          antialias: true,
          toneMapping: 3, // ACESFilmicToneMapping
          toneMappingExposure: 1.2,
        }}
        style={{ background: '#0a0a0f' }}
      >
        <SceneEnvironment />

        {/* Agent nodes */}
        {agents.map((agent) => (
          <AgentNode key={agent.id} id={agent.id} />
        ))}

        {/* Connection edges */}
        {connections.map((conn) => (
          <ConnectionEdge key={conn.id} connection={conn} />
        ))}

        {/* Particles flowing along active connections */}
        <ParticleSystem />

        {/* Post-processing effects */}
        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
