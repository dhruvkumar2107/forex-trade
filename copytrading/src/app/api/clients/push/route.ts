import { NextRequest } from 'next/server';
import { verifyInterSystemAuth, apiSuccess, apiError, apiInternalError } from '@/lib/api';
import { copyEngine } from '@/lib/copy-engine';
import { pushClientSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Verify inter-system auth
  if (!verifyInterSystemAuth(request)) {
    return apiError('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const parsed = pushClientSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    const client = await copyEngine.addClient(parsed.data);

    return apiSuccess({ id: client.id, message: 'Client added to copy trading system' }, 201);
  } catch (error) {
    console.error('[Push Client Error]', error);
    return apiInternalError();
  }
}
