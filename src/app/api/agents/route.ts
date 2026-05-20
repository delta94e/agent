import { NextRequest } from 'next/server';
import { z } from 'zod';

// Schema validation
const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  model: z.enum(['gpt-4o', 'gpt-4-turbo', 'gemini-2.5-pro', 'claude-opus-4']),
  systemPrompt: z.string().min(1).max(10000),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(128000).default(4096),
  config: z.record(z.string(), z.unknown()).optional().default({}),
});

// In-memory store (replace with Supabase when configured)
const agents: Array<Record<string, unknown>> = [];

const AGENT_COLORS = ['#00f5ff', '#8b5cf6', '#ff006e', '#10b981', '#f59e0b', '#3b82f6'];
const AGENT_ICONS = ['🤖', '📊', '🛡️', '🎯', '📝', '🔬', '💡', '🧠'];

/**
 * GET /api/agents — List all agents
 */
export async function GET() {
  // TODO: Replace with Supabase query when configured
  // const agents = await fetchAgents();
  return Response.json({ agents, count: agents.length });
}

/**
 * POST /api/agents — Create a new agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateAgentSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, model, systemPrompt, temperature, maxTokens, config } = parsed.data;

    const agent = {
      id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      model,
      system_prompt: systemPrompt,
      temperature,
      max_tokens: maxTokens,
      status: 'idle',
      config,
      color: AGENT_COLORS[agents.length % AGENT_COLORS.length],
      icon: AGENT_ICONS[agents.length % AGENT_ICONS.length],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // TODO: Replace with Supabase insert
    // const { data, error } = await supabase.from('agents').insert(agent).select().single();
    agents.push(agent);

    return Response.json({ agent }, { status: 201 });
  } catch (err) {
    console.error('POST /api/agents error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents — Delete an agent by ID (via query param)
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'Missing agent ID' }, { status: 400 });
  }

  // TODO: Replace with Supabase delete
  const idx = agents.findIndex((a) => a.id === id);
  if (idx === -1) {
    return Response.json({ error: 'Agent not found' }, { status: 404 });
  }

  agents.splice(idx, 1);

  return Response.json({ success: true });
}
