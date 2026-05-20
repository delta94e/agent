'use client';

import { useOrchestrationStore } from '@/store/orchestrationStore';
import { useAgentStore } from '@/store/agentStore';
import { statusColors } from '@/theme/tokens';

export function HUD() {
  const metrics = useOrchestrationStore((state) => state.metrics);
  const agents = useAgentStore((state) => state.agents);
  const processingCount = agents.filter((a) => a.status === 'processing').length;
  const activeCount = agents.filter((a) => a.status === 'active').length;

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {/* Token Counter */}
      <div
        style={{
          padding: '12px 18px',
          background: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 245, 255, 0.1)',
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '4px',
          }}
        >
          TOTAL TOKENS
        </div>
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '22px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00f5ff, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {metrics.totalTokens.toLocaleString()}
        </div>
      </div>

      {/* Agent Status Mini */}
      <div
        style={{
          padding: '10px 18px',
          background: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 245, 255, 0.1)',
          display: 'flex',
          gap: '16px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 700, color: statusColors.active }}>
            {activeCount}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', color: '#475569', letterSpacing: '1px' }}>
            ACTIVE
          </div>
        </div>
        <div style={{ width: '1px', background: 'rgba(0, 245, 255, 0.12)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 700, color: statusColors.processing }}>
            {processingCount}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', color: '#475569', letterSpacing: '1px' }}>
            STREAM
          </div>
        </div>
        <div style={{ width: '1px', background: 'rgba(0, 245, 255, 0.12)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>
            {metrics.avgLatencyMs}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', color: '#475569', letterSpacing: '1px' }}>
            MS
          </div>
        </div>
      </div>
    </div>
  );
}
