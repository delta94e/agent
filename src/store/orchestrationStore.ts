import { create } from 'zustand';
import type { LogEntry, Message, SystemMetrics } from '@/types';

interface OrchestrationStore {
  // Streaming
  streamBuffers: Record<string, string>;
  isOrchestrating: boolean;

  // Messages
  messages: Message[];

  // Metrics
  metrics: SystemMetrics;

  // Logs
  logs: LogEntry[];

  // Actions
  pushToken: (agentId: string, token: string) => void;
  clearStream: (agentId: string) => void;
  setOrchestrating: (value: boolean) => void;

  addMessage: (message: Message) => void;
  updateMetrics: (updates: Partial<SystemMetrics>) => void;
  incrementTokens: (count: number) => void;

  pushLog: (entry: Omit<LogEntry, 'id'>) => void;
  clearLogs: () => void;
}

const LOG_MAX = 500;

const MOCK_LOGS: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    level: 'info',
    source: 'orchestrator',
    message: 'System initialized with 5 agents',
  },
  {
    id: 'log-2',
    timestamp: new Date().toISOString(),
    level: 'info',
    source: 'coach',
    message: 'Connected to GPT-4o endpoint',
  },
  {
    id: 'log-3',
    timestamp: new Date().toISOString(),
    level: 'debug',
    source: 'aggregator',
    message: 'WebSocket handshake complete',
  },
  {
    id: 'log-4',
    timestamp: new Date().toISOString(),
    level: 'info',
    source: 'coach',
    message: 'Streaming response → aggregator | 127 tokens',
  },
  {
    id: 'log-5',
    timestamp: new Date().toISOString(),
    level: 'warn',
    source: 'monitor',
    message: 'Token rate approaching threshold (>500/min)',
  },
];

export const useOrchestrationStore = create<OrchestrationStore>((set) => ({
  streamBuffers: {},
  isOrchestrating: false,
  messages: [],
  metrics: {
    totalTokens: 12847,
    tokenRate: 2847,
    activeAgents: 3,
    totalMessages: 34,
    avgLatencyMs: 1200,
    errorRate: 0.08,
  },
  logs: MOCK_LOGS,

  pushToken: (agentId, token) =>
    set((state) => ({
      streamBuffers: {
        ...state.streamBuffers,
        [agentId]: (state.streamBuffers[agentId] || '') + token,
      },
    })),

  clearStream: (agentId) =>
    set((state) => {
      const newBuffers = { ...state.streamBuffers };
      delete newBuffers[agentId];
      return { streamBuffers: newBuffers };
    }),

  setOrchestrating: (value) => set({ isOrchestrating: value }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      metrics: {
        ...state.metrics,
        totalMessages: state.metrics.totalMessages + 1,
        totalTokens: state.metrics.totalTokens + message.tokensUsed,
      },
    })),

  updateMetrics: (updates) =>
    set((state) => ({
      metrics: { ...state.metrics, ...updates },
    })),

  incrementTokens: (count) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        totalTokens: state.metrics.totalTokens + count,
      },
    })),

  pushLog: (entry) =>
    set((state) => {
      const newLog: LogEntry = { ...entry, id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
      const logs = [...state.logs, newLog];
      // Cap at LOG_MAX
      if (logs.length > LOG_MAX) {
        logs.splice(0, logs.length - LOG_MAX);
      }
      return { logs };
    }),

  clearLogs: () => set({ logs: [] }),
}));
