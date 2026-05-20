import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from './agentStore';

describe('agentStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAgentStore.setState({
      agents: useAgentStore.getState().agents,
      connections: useAgentStore.getState().connections,
      positions: useAgentStore.getState().positions,
    });
  });

  it('should initialize with 5 mock agents', () => {
    const { agents } = useAgentStore.getState();
    expect(agents).toHaveLength(5);
    expect(agents[0].name).toBe('Orchestrator');
    expect(agents[1].name).toBe('Data Aggregator');
  });

  it('should initialize with 6 mock connections', () => {
    const { connections } = useAgentStore.getState();
    expect(connections).toHaveLength(6);
  });

  it('should add a new agent', () => {
    const { addAgent, agents } = useAgentStore.getState();
    const initialCount = agents.length;

    addAgent({
      name: 'Test Agent',
      model: 'gpt-4o',
      systemPrompt: 'You are a test agent.',
      temperature: 0.5,
      maxTokens: 4096,
      status: 'idle',
      config: {},
    });

    const updatedAgents = useAgentStore.getState().agents;
    expect(updatedAgents).toHaveLength(initialCount + 1);
    expect(updatedAgents[updatedAgents.length - 1].name).toBe('Test Agent');
  });

  it('should remove an agent and its connections', () => {
    const { removeAgent, agents, connections } = useAgentStore.getState();
    const agentToRemove = agents[0]; // Orchestrator — has connections

    const relatedConnections = connections.filter(
      (c) => c.sourceAgentId === agentToRemove.id || c.targetAgentId === agentToRemove.id
    );
    expect(relatedConnections.length).toBeGreaterThan(0);

    removeAgent(agentToRemove.id);

    const updated = useAgentStore.getState();
    expect(updated.agents.find((a) => a.id === agentToRemove.id)).toBeUndefined();
    expect(
      updated.connections.some(
        (c) => c.sourceAgentId === agentToRemove.id || c.targetAgentId === agentToRemove.id
      )
    ).toBe(false);
    // Position should also be removed
    expect(updated.positions[agentToRemove.id]).toBeUndefined();
  });

  it('should update agent status', () => {
    const { setStatus, agents } = useAgentStore.getState();
    const agent = agents[0];

    setStatus(agent.id, 'processing');
    const updated = useAgentStore.getState().agents.find((a) => a.id === agent.id);
    expect(updated?.status).toBe('processing');
  });

  it('should update positions in batch', () => {
    const { updatePositionsBatch, agents } = useAgentStore.getState();

    const newPositions = {
      [agents[0].id]: { x: 10, y: 20, z: 30 },
      [agents[1].id]: { x: -5, y: 0, z: 15 },
    };

    updatePositionsBatch(newPositions);

    const positions = useAgentStore.getState().positions;
    expect(positions[agents[0].id]).toEqual({ x: 10, y: 20, z: 30 });
    expect(positions[agents[1].id]).toEqual({ x: -5, y: 0, z: 15 });
  });

  it('should add and toggle connections', () => {
    const { addConnection, setConnectionActive, agents, connections } = useAgentStore.getState();
    const initialCount = connections.length;

    addConnection(agents[3].id, agents[4].id, 'data');

    const updated = useAgentStore.getState();
    expect(updated.connections).toHaveLength(initialCount + 1);

    const newConn = updated.connections[updated.connections.length - 1];
    expect(newConn.isActive).toBe(false);

    setConnectionActive(newConn.id, true);
    const toggled = useAgentStore.getState().connections.find((c) => c.id === newConn.id);
    expect(toggled?.isActive).toBe(true);
  });
});
