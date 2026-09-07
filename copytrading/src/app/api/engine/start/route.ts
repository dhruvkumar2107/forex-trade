import { NextRequest } from 'next/server';
import { verifyInterSystemAuth, apiSuccess, apiError, apiInternalError } from '@/lib/api';
import { copyEngine } from '@/lib/copy-engine';

export async function POST(request: NextRequest) {
  if (!verifyInterSystemAuth(request)) {
    return apiError('Unauthorized', 401);
  }

  try {
    await copyEngine.startMasterListener();
    return apiSuccess({ message: 'Copy engine started' });
  } catch (error) {
    console.error('[Engine Start Error]', error);
    return apiInternalError();
  }
}
