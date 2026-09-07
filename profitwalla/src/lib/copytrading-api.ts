const COPYTRADING_API_URL = process.env.COPYTRADING_API_URL || 'https://copytrading-murex.vercel.app';
const API_SECRET = process.env.INTER_SYSTEM_API_SECRET;

export async function pushClientToCopyTrading(payload: {
  clientRef: string;
  mt5AccountNumber: string;
  brokerServer: string;
  mt5InvestorPassword: string;
  startingEquity: number;
  fullName: string;
}): Promise<{ success: boolean; clientId?: string; error?: string }> {
  try {
    const res = await fetch(`${COPYTRADING_API_URL}/api/clients/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': API_SECRET || '',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }

    return { success: true, clientId: data.data?.id };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
