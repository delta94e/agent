'use client';

import { useState, useRef } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import { useUIStore } from '@/store/uiStore';
import { statusColors } from '@/theme/tokens';
import { AgentConfigForm } from './AgentConfigForm';

export function ControlPanel() {
  const [showAddForm, setShowAddForm] = useState(false);
  const agents = useAgentStore((state) => state.agents);
  const connections = useAgentStore((state) => state.connections);
  const setStatus = useAgentStore((state) => state.setStatus);
  const setConnectionActive = useAgentStore((state) => state.setConnectionActive);
  const removeAgent = useAgentStore((state) => state.removeAgent);
  const metrics = useOrchestrationStore((state) => state.metrics);
  const logs = useOrchestrationStore((state) => state.logs);
  const isPanelOpen = useUIStore((state) => state.isPanelOpen);
  const togglePanel = useUIStore((state) => state.togglePanel);
  const activeTab = useUIStore((state) => state.activeTab);
  const setTab = useUIStore((state) => state.setTab);
  const selectedAgentId = useUIStore((state) => state.selectedAgentId);
  const selectAgent = useUIStore((state) => state.selectAgent);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const [isRunning, setIsRunning] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const handleStartOrchestration = () => {
    if (isRunning) {
      // ---- STOP ----
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];

      // Reset all agents and connections
      const currentAgents = useAgentStore.getState().agents;
      const currentConnections = useAgentStore.getState().connections;
      currentAgents.forEach((a) => setStatus(a.id, 'idle'));
      currentConnections.forEach((c) => setConnectionActive(c.id, false));
      setIsRunning(false);

      useOrchestrationStore.getState().pushLog({
        timestamp: new Date().toISOString(),
        level: 'warn',
        source: 'orchestrator',
        message: '⏹ Orchestration stopped by user',
      });
      return;
    }

    // ---- START ----
    setIsRunning(true);
    const currentAgents = useAgentStore.getState().agents;
    const currentConnections = useAgentStore.getState().connections;

    useOrchestrationStore.getState().pushLog({
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'orchestrator',
      message: `▶ Orchestration started — ${currentAgents.length} agents, ${currentConnections.length} connections`,
    });

    // Stage 1: Set all to processing with cascade delay
    currentAgents.forEach((a, i) => {
      const t = setTimeout(() => {
        setStatus(a.id, 'processing');
        useOrchestrationStore.getState().pushLog({
          timestamp: new Date().toISOString(),
          level: 'info',
          source: a.name.toLowerCase().replace(/\s+/g, '-'),
          message: `⚡ Agent initializing... model=${a.model}`,
        });
      }, i * 400);
      timeoutsRef.current.push(t);
    });

    // Stage 2: Activate connections one by one
    currentConnections.forEach((c, i) => {
      const t = setTimeout(() => {
        setConnectionActive(c.id, true);
        const srcName = currentAgents.find((a) => a.id === c.sourceAgentId)?.name ?? c.sourceAgentId;
        const tgtName = currentAgents.find((a) => a.id === c.targetAgentId)?.name ?? c.targetAgentId;
        useOrchestrationStore.getState().pushLog({
          timestamp: new Date().toISOString(),
          level: 'info',
          source: 'router',
          message: `🔗 ${srcName} → ${tgtName} connected`,
        });
      }, currentAgents.length * 400 + i * 300);
      timeoutsRef.current.push(t);
    });

    // Stage 3: Switch to active with burst of tokens
    const stage3Delay = currentAgents.length * 400 + currentConnections.length * 300 + 500;
    currentAgents.forEach((a, i) => {
      const t = setTimeout(() => {
        setStatus(a.id, 'active');
        useOrchestrationStore.getState().incrementTokens(Math.floor(Math.random() * 500) + 200);
        useOrchestrationStore.getState().pushLog({
          timestamp: new Date().toISOString(),
          level: 'info',
          source: a.name.toLowerCase().replace(/\s+/g, '-'),
          message: `✓ Agent ready — streaming responses`,
        });
      }, stage3Delay + i * 200);
      timeoutsRef.current.push(t);
    });
  };

  const tabs = [
    { key: 'agents' as const, label: 'AGENTS' },
    { key: 'metrics' as const, label: 'METRICS' },
    { key: 'logs' as const, label: 'LOGS' },
  ];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={togglePanel}
        style={{
          position: 'fixed',
          top: '16px',
          right: isPanelOpen ? '436px' : '16px',
          zIndex: 20,
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: '1px solid rgba(0, 245, 255, 0.2)',
          background: 'rgba(26, 26, 46, 0.85)',
          backdropFilter: 'blur(20px)',
          color: '#00f5ff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {isPanelOpen ? '✕' : '☰'}
      </button>

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '420px',
          background: 'rgba(12, 12, 20, 0.92)',
          backdropFilter: 'blur(30px)',
          borderLeft: '1px solid rgba(0, 245, 255, 0.12)',
          zIndex: 15,
          display: 'flex',
          flexDirection: 'column',
          transform: isPanelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 0',
            borderBottom: '1px solid rgba(0, 245, 255, 0.08)',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              color: '#e2e8f0',
              letterSpacing: '2px',
              marginBottom: '16px',
            }}
          >
            <span style={{ color: '#00f5ff' }}>MAOP</span> CONTROL
          </h2>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTab(tab.key)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #00f5ff' : '2px solid transparent',
                  background: activeTab === tab.key ? 'rgba(0, 245, 255, 0.08)' : 'transparent',
                  color: activeTab === tab.key ? '#00f5ff' : '#94a3b8',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderRadius: '6px 6px 0 0',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          {/* AGENTS TAB */}
          {activeTab === 'agents' && (
            <div>
              {selectedAgent ? (
                /* Agent Detail */
                <div>
                  <button
                    onClick={() => selectAgent(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      marginBottom: '16px',
                      padding: 0,
                    }}
                  >
                    ← Back to list
                  </button>
                  <div
                    style={{
                      background: 'rgba(26, 26, 46, 0.65)',
                      borderRadius: '16px',
                      padding: '24px',
                      border: `1px solid ${selectedAgent.color}30`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: `${selectedAgent.color}20`,
                          border: `1px solid ${selectedAgent.color}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                        }}
                      >
                        {selectedAgent.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#e2e8f0',
                          }}
                        >
                          {selectedAgent.name}
                        </div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '11px',
                            color: '#94a3b8',
                          }}
                        >
                          {selectedAgent.model} · temp {selectedAgent.temperature}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div style={{ marginBottom: '16px' }}>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '10px',
                          color: '#475569',
                          textTransform: 'uppercase',
                          letterSpacing: '1.5px',
                          marginBottom: '6px',
                        }}
                      >
                        STATUS
                      </div>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 500,
                          background: `${statusColors[selectedAgent.status]}18`,
                          color: statusColors[selectedAgent.status],
                          border: `1px solid ${statusColors[selectedAgent.status]}30`,
                        }}
                      >
                        ● {selectedAgent.status.toUpperCase()}
                      </span>
                    </div>

                    {/* System Prompt */}
                    <div style={{ marginBottom: '16px' }}>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '10px',
                          color: '#475569',
                          textTransform: 'uppercase',
                          letterSpacing: '1.5px',
                          marginBottom: '6px',
                        }}
                      >
                        SYSTEM PROMPT
                      </div>
                      <div
                        style={{
                          padding: '12px',
                          background: 'rgba(10, 10, 15, 0.6)',
                          borderRadius: '8px',
                          border: '1px solid rgba(0, 245, 255, 0.08)',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '12px',
                          color: '#94a3b8',
                          lineHeight: 1.6,
                        }}
                      >
                        {selectedAgent.systemPrompt}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        removeAgent(selectedAgent.id);
                        selectAgent(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'transparent',
                        border: '1px solid rgba(255, 0, 110, 0.25)',
                        borderRadius: '8px',
                        color: '#ff006e',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 0, 110, 0.1)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 110, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      ✕ DELETE AGENT
                    </button>
                  </div>
                </div>
              ) : (
                /* Agent List */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => selectAgent(agent.id)}
                      style={{
                        padding: '14px 16px',
                        background: 'rgba(26, 26, 46, 0.5)',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 245, 255, 0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${agent.color}40`;
                        e.currentTarget.style.background = 'rgba(26, 26, 46, 0.75)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.08)';
                        e.currentTarget.style.background = 'rgba(26, 26, 46, 0.5)';
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: `${agent.color}18`,
                          border: `1px solid ${agent.color}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0,
                        }}
                      >
                        {agent.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#e2e8f0',
                          }}
                        >
                          {agent.name}
                        </div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '10px',
                            color: '#475569',
                          }}
                        >
                          {agent.model}
                        </div>
                      </div>
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: statusColors[agent.status],
                          boxShadow: `0 0 6px ${statusColors[agent.status]}`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* METRICS TAB */}
          {activeTab === 'metrics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'TOTAL TOKENS', value: metrics.totalTokens.toLocaleString(), color: '#00f5ff' },
                { label: 'TOKEN RATE', value: `${metrics.tokenRate}/min`, color: '#8b5cf6' },
                { label: 'ACTIVE AGENTS', value: `${metrics.activeAgents}/${agents.length}`, color: '#10b981' },
                { label: 'MESSAGES', value: metrics.totalMessages.toString(), color: '#f59e0b' },
                { label: 'AVG LATENCY', value: `${metrics.avgLatencyMs}ms`, color: '#00f5ff' },
                { label: 'ERROR RATE', value: `${(metrics.errorRate * 100).toFixed(1)}%`, color: '#ff006e' },
              ].map((metric) => (
                <div
                  key={metric.label}
                  style={{
                    padding: '16px',
                    background: 'rgba(26, 26, 46, 0.5)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 245, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                    }}
                  >
                    {metric.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '18px',
                      fontWeight: 700,
                      color: metric.color,
                      textShadow: `0 0 12px ${metric.color}40`,
                    }}
                  >
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                lineHeight: 1.8,
              }}
            >
              {logs.map((log) => {
                const levelColors: Record<string, string> = {
                  info: '#00f5ff',
                  warn: '#f59e0b',
                  error: '#ff006e',
                  debug: '#475569',
                };
                return (
                  <div
                    key={log.id}
                    style={{
                      padding: '4px 0',
                      borderBottom: '1px solid rgba(0, 245, 255, 0.04)',
                    }}
                  >
                    <span style={{ color: '#475569' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>{' '}
                    <span
                      style={{
                        color: levelColors[log.level],
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {log.level.padEnd(5)}
                    </span>{' '}
                    <span style={{ color: '#8b5cf6' }}>[{log.source}]</span>{' '}
                    <span style={{ color: '#94a3b8' }}>{log.message}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(0, 245, 255, 0.08)',
            display: 'flex',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleStartOrchestration}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: isRunning
                ? 'linear-gradient(135deg, #ff006e, #cc0058)'
                : 'linear-gradient(135deg, #00f5ff, #0099aa)',
              border: 'none',
              borderRadius: '10px',
              color: isRunning ? '#fff' : '#0a0a0f',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: isRunning
                ? '0 0 20px rgba(255, 0, 110, 0.4)'
                : '0 0 20px rgba(0, 245, 255, 0.2)',
            }}
          >
            {isRunning ? '⏹ STOP' : '▶ START'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: '10px',
              color: '#94a3b8',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            + ADD
          </button>
        </div>
      </div>

      {/* Add Agent Modal */}
      {showAddForm && <AgentConfigForm onClose={() => setShowAddForm(false)} />}
    </>
  );
}
