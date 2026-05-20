import { create } from 'zustand';
import type { Agent, Connection, Position3D, AgentStatus } from '@/types';
import { tokens } from '@/theme/tokens';

const AGENT_COLORS = [
  tokens.colors.accentCyan,
  tokens.colors.accentViolet,
  tokens.colors.accentMagenta,
  tokens.colors.accentEmerald,
  tokens.colors.accentAmber,
  tokens.colors.accentBlue,
];

const AGENT_ICONS = ['🤖', '📊', '🛡️', '🎯', '📝', '🔬', '💡', '🧠'];

// ---- Mock Data ----
function createMockAgents(): Agent[] {
  return [
    {
      id: 'agent-1',
      name: 'Orchestrator',
      model: 'gpt-4o',
      systemPrompt: 'You are the central orchestrator. Route tasks to specialized agents.',
      temperature: 0.5,
      maxTokens: 4096,
      status: 'active',
      position: { x: 0, y: 0, z: 0 },
      config: {},
      createdAt: new Date().toISOString(),
      color: AGENT_COLORS[0],
      icon: '🎯',
    },
    {
      id: 'agent-2',
      name: 'Data Aggregator',
      model: 'gemini-2.5-pro',
      systemPrompt: 'Collect and synthesize data from multiple sources.',
      temperature: 0.3,
      maxTokens: 8192,
      status: 'processing',
      position: { x: -5, y: 3, z: -2 },
      config: {},
      createdAt: new Date().toISOString(),
      color: AGENT_COLORS[1],
      icon: '📊',
    },
    {
      id: 'agent-3',
      name: 'Safety Monitor',
      model: 'claude-opus-4',
      systemPrompt: 'Monitor all agent outputs for policy violations.',
      temperature: 0.1,
      maxTokens: 2048,
      status: 'idle',
      position: { x: 5, y: 3, z: -2 },
      config: {},
      createdAt: new Date().toISOString(),
      color: AGENT_COLORS[2],
      icon: '🛡️',
    },
    {
      id: 'agent-4',
      name: 'Coach',
      model: 'gpt-4o',
      systemPrompt: 'Provide personalized coaching feedback.',
      temperature: 0.7,
      maxTokens: 4096,
      status: 'active',
      position: { x: -4, y: -4, z: 1 },
      config: {},
      createdAt: new Date().toISOString(),
      color: AGENT_COLORS[3],
      icon: '🤖',
    },
    {
      id: 'agent-5',
      name: 'Summarizer',
      model: 'gpt-4-turbo',
      systemPrompt: 'Create concise summaries of conversations and data.',
      temperature: 0.4,
      maxTokens: 2048,
      status: 'idle',
      position: { x: 4, y: -4, z: 1 },
      config: {},
      createdAt: new Date().toISOString(),
      color: AGENT_COLORS[4],
      icon: '📝',
    },
  ];
}

function createMockConnections(): Connection[] {
  return [
    { id: 'conn-1', sourceAgentId: 'agent-1', targetAgentId: 'agent-2', connectionType: 'message', isActive: true },
    { id: 'conn-2', sourceAgentId: 'agent-1', targetAgentId: 'agent-3', connectionType: 'message', isActive: true },
    { id: 'conn-3', sourceAgentId: 'agent-1', targetAgentId: 'agent-4', connectionType: 'message', isActive: true },
    { id: 'conn-4', sourceAgentId: 'agent-1', targetAgentId: 'agent-5', connectionType: 'data', isActive: false },
    { id: 'conn-5', sourceAgentId: 'agent-2', targetAgentId: 'agent-4', connectionType: 'data', isActive: false },
    { id: 'conn-6', sourceAgentId: 'agent-3', targetAgentId: 'agent-5', connectionType: 'control', isActive: false },
  ];
}

// ---- Store ----
interface AgentStore {
  agents: Agent[];
  connections: Connection[];
  positions: Record<string, Position3D>;

  addAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'position' | 'color' | 'icon'>) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  setStatus: (id: string, status: AgentStatus) => void;
  updatePosition: (id: string, pos: Position3D) => void;
  updatePositionsBatch: (positions: Record<string, Position3D>) => void;

  addConnection: (sourceId: string, targetId: string, type?: Connection['connectionType']) => void;
  removeConnection: (id: string) => void;
  setConnectionActive: (id: string, active: boolean) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => {
  const mockAgents = createMockAgents();
  const initialPositions: Record<string, Position3D> = {};
  mockAgents.forEach((a) => {
    initialPositions[a.id] = a.position;
  });

  return {
    agents: mockAgents,
    connections: createMockConnections(),
    positions: initialPositions,

    addAgent: (agentData) => {
      const id = `agent-${Date.now()}`;
      const agentCount = get().agents.length;
      const newAgent: Agent = {
        ...agentData,
        id,
        createdAt: new Date().toISOString(),
        position: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
          z: (Math.random() - 0.5) * 5,
        },
        color: AGENT_COLORS[agentCount % AGENT_COLORS.length],
        icon: AGENT_ICONS[agentCount % AGENT_ICONS.length],
      };
      set((state) => ({
        agents: [...state.agents, newAgent],
        positions: { ...state.positions, [id]: newAgent.position },
      }));
    },

    removeAgent: (id) =>
      set((state) => {
        const remainingPositions = { ...state.positions };
        delete remainingPositions[id];
        return {
          agents: state.agents.filter((a) => a.id !== id),
          connections: state.connections.filter(
            (c) => c.sourceAgentId !== id && c.targetAgentId !== id
          ),
          positions: remainingPositions,
        };
      }),

    updateAgent: (id, updates) =>
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      })),

    setStatus: (id, status) =>
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? { ...a, status } : a)),
      })),

    updatePosition: (id, pos) =>
      set((state) => ({
        positions: { ...state.positions, [id]: pos },
      })),

    updatePositionsBatch: (positions) =>
      set((state) => ({
        positions: { ...state.positions, ...positions },
      })),

    addConnection: (sourceId, targetId, type = 'message') => {
      const id = `conn-${Date.now()}`;
      set((state) => ({
        connections: [
          ...state.connections,
          {
            id,
            sourceAgentId: sourceId,
            targetAgentId: targetId,
            connectionType: type,
            isActive: false,
          },
        ],
      }));
    },

    removeConnection: (id) =>
      set((state) => ({
        connections: state.connections.filter((c) => c.id !== id),
      })),

    setConnectionActive: (id, active) =>
      set((state) => ({
        connections: state.connections.map((c) =>
          c.id === id ? { ...c, isActive: active } : c
        ),
      })),
  };
});
