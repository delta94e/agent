'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAgentStore } from '@/store/agentStore';

/**
 * Hook that manages the Web Worker for force-directed layout.
 * Initializes worker on mount, sends node/link data, and updates positions in store.
 */
export function useForceLayout() {
  const workerRef = useRef<Worker | null>(null);
  const agents = useAgentStore((state) => state.agents);
  const connections = useAgentStore((state) => state.connections);
  const updatePositionsBatch = useAgentStore((state) => state.updatePositionsBatch);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/forceLayout.worker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (event) => {
      const { type, positions } = event.data;
      if (type === 'positions' && positions) {
        updatePositionsBatch(positions);
      }
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Send init data when agents/connections change
  useEffect(() => {
    if (!workerRef.current) return;

    workerRef.current.postMessage({
      type: 'init',
      nodes: agents.map((a) => ({
        id: a.id,
        x: a.position.x,
        y: a.position.y,
        z: a.position.z,
      })),
      links: connections.map((c) => ({
        source: c.sourceAgentId,
        target: c.targetAgentId,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents.length, connections.length]); // Re-init when count changes

  const addNode = useCallback((id: string, x?: number, y?: number, z?: number) => {
    workerRef.current?.postMessage({
      type: 'addNode',
      nodes: [{ id, x, y, z }],
    });
  }, []);

  const removeNode = useCallback((id: string) => {
    workerRef.current?.postMessage({
      type: 'removeNode',
      nodeId: id,
    });
  }, []);

  const reheat = useCallback(() => {
    workerRef.current?.postMessage({ type: 'update' });
  }, []);

  return { addNode, removeNode, reheat };
}
