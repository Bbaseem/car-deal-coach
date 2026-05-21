import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  reset: number;
  configured: boolean;
};

let limiter: Ratelimit | null = null;
let initialized = false;

function init(): Ratelimit | null {
  if (initialized) return limiter;
  initialized = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      prefix: 'cdc:chat',
      analytics: false,
    });
    return limiter;
  } catch {
    return null;
  }
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const lim = init();
  if (!lim) {
    return { ok: true, remaining: Number.POSITIVE_INFINITY, reset: 0, configured: false };
  }
  const res = await lim.limit(identifier);
  return {
    ok: res.success,
    remaining: res.remaining,
    reset: res.reset,
    configured: true,
  };
}

export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'unknown';
}
