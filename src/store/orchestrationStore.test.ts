import { describe, it, expect, beforeEach } from 'vitest';
import { useOrchestrationStore } from './orchestrationStore';

describe('orchestrationStore', () => {
  beforeEach(() => {
    // Reset to initial state
    const initial = useOrchestrationStore.getState();
    useOrchestrationStore.setState({
      ...initial,
      streamBuffers: {},
      isOrchestrating: false,
    });
  });

  it('should initialize with mock metrics', () => {
    const { metrics } = useOrchestrationStore.getState();
    expect(metrics.totalTokens).toBeGreaterThan(0);
    expect(metrics.activeAgents).toBeGreaterThan(0);
  });

  it('should initialize with mock logs', () => {
    const { logs } = useOrchestrationStore.getState();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].level).toBeDefined();
  });

  it('should push and accumulate tokens in stream buffer', () => {
    const { pushToken } = useOrchestrationStore.getState();

    pushToken('agent-1', 'Hello');
    pushToken('agent-1', ' World');

    const { streamBuffers } = useOrchestrationStore.getState();
    expect(streamBuffers['agent-1']).toBe('Hello World');
  });

  it('should clear a stream buffer', () => {
    const { pushToken, clearStream } = useOrchestrationStore.getState();

    pushToken('agent-1', 'test');
    clearStream('agent-1');

    const { streamBuffers } = useOrchestrationStore.getState();
    expect(streamBuffers['agent-1']).toBeUndefined();
  });

  it('should increment tokens and update total', () => {
    const initialTokens = useOrchestrationStore.getState().metrics.totalTokens;

    useOrchestrationStore.getState().incrementTokens(100);

    expect(useOrchestrationStore.getState().metrics.totalTokens).toBe(initialTokens + 100);
  });

  it('should add message and update metrics', () => {
    const { addMessage, metrics } = useOrchestrationStore.getState();
    const initialMessages = metrics.totalMessages;
    const initialTokens = metrics.totalTokens;

    addMessage({
      id: 'msg-1',
      sourceAgentId: 'agent-1',
      targetAgentId: 'agent-2',
      content: 'Hello from agent 1',
      tokensUsed: 42,
      timestamp: new Date().toISOString(),
      metadata: {},
    });

    const updated = useOrchestrationStore.getState();
    expect(updated.messages).toHaveLength(1);
    expect(updated.metrics.totalMessages).toBe(initialMessages + 1);
    expect(updated.metrics.totalTokens).toBe(initialTokens + 42);
  });

  it('should push logs and cap at 500', () => {
    const { pushLog, clearLogs } = useOrchestrationStore.getState();
    clearLogs();

    // Push 510 logs
    for (let i = 0; i < 510; i++) {
      pushLog({
        timestamp: new Date().toISOString(),
        level: 'info',
        source: 'test',
        message: `Log entry ${i}`,
      });
    }

    const { logs } = useOrchestrationStore.getState();
    expect(logs.length).toBeLessThanOrEqual(500);
    // Most recent should be the last one pushed
    expect(logs[logs.length - 1].message).toContain('509');
  });
});
