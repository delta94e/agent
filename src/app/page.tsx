'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { ControlPanel } from '@/components/panels/ControlPanel';
import { HUD } from '@/components/panels/HUD';
import { useForceLayout } from '@/hooks/useForceLayout';
import { useSimulation } from '@/hooks/useSimulation';

// Dynamic import with SSR disabled for Three.js components
const AgentGraph = dynamic(
  () => import('@/components/canvas/AgentGraph').then((mod) => ({ default: mod.AgentGraph })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#0a0a0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            color: '#00f5ff',
            letterSpacing: '3px',
            animation: 'pulse-dot 1.5s ease-in-out infinite',
          }}
        >
          INITIALIZING 3D ENGINE...
        </div>
      </div>
    ),
  }
);

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Initialize force-directed layout (Web Worker)
  useForceLayout();

  // Run simulation for demo
  useSimulation();

  return (
    <>
      {/* Grid overlay background — client only to avoid hydration mismatch */}
      {mounted && <div className="grid-overlay" />}

      {/* 3D Canvas Layer — full viewport, behind everything */}
      <AgentGraph />

      {/* UI Layer — floating panels on top of canvas */}
      <div className="ui-layer">
        <HUD />
        <ControlPanel />

        {/* Title watermark */}
        {mounted && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '24px',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '3px',
                color: 'rgba(0, 245, 255, 0.3)',
                textTransform: 'uppercase',
              }}
            >
              Multi-Agent Orchestration Platform
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: 'rgba(148, 163, 184, 0.3)',
                marginTop: '4px',
              }}
            >
              v1.0 · Cyber Nexus
            </div>
          </div>
        )}
      </div>
    </>
  );
}
