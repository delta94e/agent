// MAOP Type Definitions

export type AgentStatus = 'idle' | 'processing' | 'active' | 'error';
export type ConnectionType = 'message' | 'data' | 'control';
export type LLMModel = 'gpt-4o' | 'gpt-4-turbo' | 'gemini-2.5-pro' | 'claude-opus-4';
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Agent {
  id: string;
  name: string;
  model: LLMModel;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  status: AgentStatus;
  position: Position3D;
  config: Record<string, unknown>;
  createdAt: string;
  color: string;
  icon: string;
}

export interface Connection {
  id: string;
  sourceAgentId: string;
  targetAgentId: string;
  connectionType: ConnectionType;
  isActive: boolean;
}

export interface Message {
  id: string;
  sourceAgentId: string;
  targetAgentId: string;
  content: string;
  tokensUsed: number;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
}

export interface AgentMetrics {
  agentId: string;
  totalTokens: number;
  messageCount: number;
  avgLatencyMs: number;
  uptime: string;
}

export interface SystemMetrics {
  totalTokens: number;
  tokenRate: number;
  activeAgents: number;
  totalMessages: number;
  avgLatencyMs: number;
  errorRate: number;
}

// Worker message types
export interface WorkerInput {
  type: 'init' | 'update' | 'addNode' | 'removeNode' | 'addLink' | 'removeLink';
  nodes?: Array<{ id: string; x?: number; y?: number; z?: number }>;
  links?: Array<{ source: string; target: string }>;
}

export interface WorkerOutput {
  type: 'positions' | 'tick' | 'settled';
  positions: Record<string, Position3D>;
  alpha?: number;
}

// Stream event types from orchestration API
export type StreamEvent =
  | { type: 'token'; agentId: string; content: string }
  | { type: 'status'; agentId: string; status: AgentStatus }
  | { type: 'route'; from: string; to: string; tokens: number }
  | { type: 'metric'; totalTokens: number; latencyMs: number }
  | { type: 'error'; agentId: string; message: string }
  | { type: 'done' };
