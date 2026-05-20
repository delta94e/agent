'use client';

import { useEffect, useRef } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { useOrchestrationStore } from '@/store/orchestrationStore';

/**
 * Simulates real-time orchestration activity:
 * - Random token increments
 * - Connection activation/deactivation
 * - Agent status changes
 * - Log entries
 */
export function useSimulation(enabled: boolean = true) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const sources = ['orchestrator', 'aggregator', 'coach', 'monitor', 'summarizer'];
    const messages = [
      'Processing input tokens...',
      'Routing request to next agent',
      'Streaming response → target agent',
      'Checkpoint saved to memory',
      'Token buffer flushed | latency 823ms',
      'Safety check passed ✓',
      'Model warm-up complete',
      'Aggregating results from 3 sources',
      'Context window: 14,291 / 128,000 tokens',
      'Response quality score: 0.94',
      'WebSocket ping: 12ms',
      'Cache hit ratio: 78%',
    ];

    intervalRef.current = setInterval(() => {
      const store = useOrchestrationStore.getState();
      const agentStore = useAgentStore.getState();

      // Random token increment
      const tokenIncrement = Math.floor(Math.random() * 30) + 5;
      store.incrementTokens(tokenIncrement);

      // Random token rate update
      store.updateMetrics({
        tokenRate: Math.floor(Math.random() * 2000) + 1500,
        avgLatencyMs: Math.floor(Math.random() * 800) + 400,
      });

      // Random log entry
      if (Math.random() > 0.3) {
        const levels: Array<'info' | 'warn' | 'error' | 'debug'> = ['info', 'info', 'info', 'debug', 'warn'];
        store.pushLog({
          timestamp: new Date().toISOString(),
          level: levels[Math.floor(Math.random() * levels.length)],
          source: sources[Math.floor(Math.random() * sources.length)],
          message: `${messages[Math.floor(Math.random() * messages.length)]} | ${tokenIncrement} tokens`,
        });
      }

      // Randomly toggle connection activity (REMOVED to prevent conflict with manual Start/Stop)
      // if (Math.random() > 0.7) { ... }

      // Update active agents count
      const activeCount = agentStore.agents.filter(
        (a) => a.status === 'active' || a.status === 'processing'
      ).length;
      store.updateMetrics({ activeAgents: activeCount });
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled]);
}
