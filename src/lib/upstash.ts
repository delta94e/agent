import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default redis;

// ---- Metrics Keys ----
const METRICS_PREFIX = 'maop:metrics';
const SESSION_PREFIX = 'maop:session';

/**
 * Increment total token count.
 */
export async function incrementTokenCount(count: number) {
  return redis.incrby(`${METRICS_PREFIX}:total_tokens`, count);
}

/**
 * Get current total token count.
 */
export async function getTokenCount(): Promise<number> {
  const count = await redis.get<number>(`${METRICS_PREFIX}:total_tokens`);
  return count ?? 0;
}

/**
 * Track token rate using a sliding window (last 60s).
 * Records a token event with timestamp, then counts recent events.
 */
export async function recordTokenEvent(tokens: number) {
  const now = Date.now();
  const key = `${METRICS_PREFIX}:token_rate`;

  // Add event to sorted set with timestamp as score
  await redis.zadd(key, { score: now, member: `${now}:${tokens}` });

  // Remove events older than 60s
  await redis.zremrangebyscore(key, 0, now - 60000);

  // Set TTL so key auto-expires
  await redis.expire(key, 120);
}

/**
 * Get token rate (tokens/min) from the sliding window.
 */
export async function getTokenRate(): Promise<number> {
  const now = Date.now();
  const key = `${METRICS_PREFIX}:token_rate`;

  // Get all events in last 60s
  const events = await redis.zrange(key, now - 60000, now, { byScore: true });

  let total = 0;
  for (const event of events) {
    const parts = String(event).split(':');
    total += parseInt(parts[1] || '0', 10);
  }

  return total;
}

/**
 * Store session metrics snapshot.
 */
export async function saveSessionMetrics(
  sessionId: string,
  metrics: Record<string, unknown>
) {
  const key = `${SESSION_PREFIX}:${sessionId}`;
  await redis.set(key, JSON.stringify(metrics));
  await redis.expire(key, 86400); // 24h TTL
}

/**
 * Get session metrics.
 */
export async function getSessionMetrics(
  sessionId: string
): Promise<Record<string, unknown> | null> {
  const data = await redis.get<string>(`${SESSION_PREFIX}:${sessionId}`);
  return data ? JSON.parse(data) : null;
}
