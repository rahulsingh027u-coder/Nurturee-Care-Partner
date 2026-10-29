import { getRedis } from './redis';

// Simple rate limiter using Redis
// Returns true if request is allowed, false if rate limited
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const redis = await getRedis();
    const redisKey = `rate:${key}`;
    const current = await redis.incr(redisKey);
    
    if (current === 1) {
      await redis.expire(redisKey, windowSeconds);
    }
    
    const ttl = await redis.ttl(redisKey);
    const remaining = Math.max(0, maxRequests - current);
    
    return {
      allowed: current <= maxRequests,
      remaining,
      resetAt: Date.now() + (ttl * 1000),
    };
  } catch {
    // If Redis is down, allow the request (fail open)
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 };
  }
}

// Pre-configured rate limits
export const RATE_LIMITS = {
  // Auth endpoints: 5 requests per 30 seconds per IP
  auth: (ip: string) => rateLimit(`auth:${ip}`, 5, 30),
  // OTP send: 3 requests per 60 seconds per phone
  otpSend: (phone: string) => rateLimit(`otp:send:${phone}`, 3, 60),
  // OTP verify: 10 requests per 5 minutes per phone
  otpVerify: (phone: string) => rateLimit(`otp:verify:${phone}`, 10, 300),
  // API general: 100 requests per minute per IP
  api: (ip: string) => rateLimit(`api:${ip}`, 100, 60),
};

// Get client IP from request
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}
