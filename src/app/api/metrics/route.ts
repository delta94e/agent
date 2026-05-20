/**
 * GET /api/metrics — Get current system metrics.
 * 
 * In production, reads from Upstash Redis.
 * Falls back to mock data when Redis is not configured.
 */
export async function GET() {
  try {
    // Check if Upstash is configured
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { getTokenCount, getTokenRate } = await import('@/lib/upstash');

      const [totalTokens, tokenRate] = await Promise.all([
        getTokenCount(),
        getTokenRate(),
      ]);

      return Response.json({
        totalTokens,
        tokenRate,
        activeAgents: 0, // Would come from agent status tracking
        totalMessages: 0,
        avgLatencyMs: 0,
        errorRate: 0,
        source: 'redis',
      });
    }

    // Fallback: return mock metrics
    return Response.json({
      totalTokens: 12847,
      tokenRate: 2847,
      activeAgents: 3,
      totalMessages: 34,
      avgLatencyMs: 1200,
      errorRate: 0.08,
      source: 'mock',
    });
  } catch (err) {
    console.error('GET /api/metrics error:', err);
    return Response.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
