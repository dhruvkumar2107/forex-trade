import { prisma } from './prisma';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const windowStart = new Date(Date.now() - config.windowMs);

  const count = await prisma.rateLimitEntry.count({
    where: {
      key,
      createdAt: { gte: windowStart },
    },
  });

  if (count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: config.windowMs };
  }

  await prisma.rateLimitEntry.create({
    data: { key },
  });

  return { allowed: true, remaining: config.maxRequests - count - 1, resetIn: config.windowMs };
}

export const RATE_LIMITS = {
  otpRequest: { windowMs: 60000, maxRequests: 3 },
  otpVerify: { windowMs: 300000, maxRequests: 10 },
  clientSubmit: { windowMs: 300000, maxRequests: 5 },
  statusCheck: { windowMs: 60000, maxRequests: 30 },
} as const;
