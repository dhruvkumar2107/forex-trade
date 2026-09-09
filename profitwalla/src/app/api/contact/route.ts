import { NextRequest } from 'next/server';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendContactFormNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `contact:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, { maxRequests: 5, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return apiError('Too many requests. Please try again later.', 429);
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return apiError('All fields are required');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return apiError('Invalid email address');
    }

    // Send notification email to support
    await sendContactFormNotification(name, email, subject, message);

    return apiSuccess({ message: 'Message received. We will get back to you within 24 hours.' });
  } catch (error) {
    console.error('[Contact Error]', error);
    return apiInternalError();
  }
}
