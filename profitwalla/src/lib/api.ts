import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function apiUnauthorized() {
  return apiError('Unauthorized', 401);
}

export function apiForbidden() {
  return apiError('Forbidden', 403);
}

export function apiNotFound() {
  return apiError('Not found', 404);
}

export function apiInternalError(message = 'Internal server error') {
  return apiError(message, 500);
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export function verifyInterSystemAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-api-secret');
  const secret = process.env.INTER_SYSTEM_API_SECRET;
  if (!authHeader || !secret) return false;

  const a = Buffer.from(authHeader);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
