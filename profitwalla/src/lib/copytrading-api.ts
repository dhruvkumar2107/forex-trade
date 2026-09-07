import type { PushClientPayload } from './types';

const COPY_TRADING_API = process.env.COPY_TRADING_API_URL || 'http://localhost:3001';
const API_SECRET = process.env.INTER_SYSTEM_API_SECRET;

export async function pushClientToCopyTrading(payload: PushClientPayload): Promise<{ success: boolean; clientId?: string; error?: string }> {
  const response = await fetch(`${COPY_TRADING_API}/api/clients/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': API_SECRET || '',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    return { success: false, error: result.error || 'Failed to push client' };
  }

  return { success: true, clientId: result.data?.id };
}
