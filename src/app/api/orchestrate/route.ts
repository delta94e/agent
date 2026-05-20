import { NextRequest } from 'next/server';
import { z } from 'zod';
import { callLLM, streamLLM } from '@/lib/llm';
import type { LLMModel } from '@/types';

const OrchestrateSchema = z.object({
  agents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      model: z.enum(['gpt-4o', 'gpt-4-turbo', 'gemini-2.5-pro', 'claude-opus-4']),
      systemPrompt: z.string(),
      temperature: z.number().optional(),
      maxTokens: z.number().optional(),
    })
  ),
  connections: z.array(
    z.object({
      sourceId: z.string(),
      targetId: z.string(),
    })
  ),
  userMessage: z.string().min(1),
  stream: z.boolean().optional().default(false),
});

/**
 * POST /api/orchestrate — Run multi-agent orchestration
 *
 * Non-streaming: Executes the agent pipeline and returns complete results.
 * Streaming: Returns SSE stream with token events for real-time visualization.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = OrchestrateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { agents, connections, userMessage, stream } = parsed.data;

    // Find the "root" agent (one with no incoming connections)
    const targetIds = new Set(connections.map((c) => c.targetId));
    const rootAgent = agents.find((a) => !targetIds.has(a.id)) ?? agents[0];

    if (!rootAgent) {
      return Response.json({ error: 'No agents provided' }, { status: 400 });
    }

    if (stream) {
      // ---- SSE Streaming Mode ----
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          const send = (event: Record<string, unknown>) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          };

          try {
            // Process root agent first
            send({ type: 'status', agentId: rootAgent.id, status: 'processing' });

            const gen = streamLLM({
              model: rootAgent.model as LLMModel,
              systemPrompt: rootAgent.systemPrompt,
              userMessage,
              temperature: rootAgent.temperature,
              maxTokens: rootAgent.maxTokens,
            });

            let fullContent = '';
            for await (const chunk of gen) {
              if (chunk.content) {
                fullContent += chunk.content;
                send({ type: 'token', agentId: rootAgent.id, content: chunk.content });
              }
            }

            send({ type: 'status', agentId: rootAgent.id, status: 'active' });

            // Route to connected agents
            const downstreamConnections = connections.filter((c) => c.sourceId === rootAgent.id);
            for (const conn of downstreamConnections) {
              const targetAgent = agents.find((a) => a.id === conn.targetId);
              if (!targetAgent) continue;

              send({ type: 'status', agentId: targetAgent.id, status: 'processing' });
              send({
                type: 'route',
                from: rootAgent.id,
                to: targetAgent.id,
                tokens: fullContent.length,
              });

              const result = await callLLM({
                model: targetAgent.model as LLMModel,
                systemPrompt: targetAgent.systemPrompt,
                userMessage: fullContent,
                temperature: targetAgent.temperature,
                maxTokens: targetAgent.maxTokens,
              });

              send({ type: 'token', agentId: targetAgent.id, content: result.content });
              send({
                type: 'metric',
                totalTokens: result.tokensUsed,
                latencyMs: result.latencyMs,
              });
              send({ type: 'status', agentId: targetAgent.id, status: 'active' });
            }

            send({ type: 'done' });
          } catch (err) {
            send({
              type: 'error',
              agentId: rootAgent.id,
              message: err instanceof Error ? err.message : 'Unknown error',
            });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // ---- Non-streaming Mode ----
    const results: Record<string, { content: string; tokensUsed: number; latencyMs: number }> = {};

    // Call root agent
    const rootResult = await callLLM({
      model: rootAgent.model as LLMModel,
      systemPrompt: rootAgent.systemPrompt,
      userMessage,
      temperature: rootAgent.temperature,
      maxTokens: rootAgent.maxTokens,
    });
    results[rootAgent.id] = rootResult;

    // Route to downstream agents
    const downstreamConnections = connections.filter((c) => c.sourceId === rootAgent.id);
    await Promise.all(
      downstreamConnections.map(async (conn) => {
        const targetAgent = agents.find((a) => a.id === conn.targetId);
        if (!targetAgent) return;

        const result = await callLLM({
          model: targetAgent.model as LLMModel,
          systemPrompt: targetAgent.systemPrompt,
          userMessage: rootResult.content,
          temperature: targetAgent.temperature,
          maxTokens: targetAgent.maxTokens,
        });
        results[targetAgent.id] = result;
      })
    );

    const totalTokens = Object.values(results).reduce((sum, r) => sum + r.tokensUsed, 0);
    const avgLatency =
      Object.values(results).reduce((sum, r) => sum + r.latencyMs, 0) / Object.keys(results).length;

    return Response.json({
      results,
      metrics: {
        totalTokens,
        avgLatencyMs: Math.round(avgLatency),
        agentsUsed: Object.keys(results).length,
      },
    });
  } catch (err) {
    console.error('POST /api/orchestrate error:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
