import { encrypt } from './encryption';
import { prisma } from './prisma';

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
    const { encrypted, iv } = encrypt(payload.mt5InvestorPassword);

    const client = await prisma.copyTradingClient.create({
      data: {
        clientRef: payload.clientRef,
        mt5AccountNumber: payload.mt5AccountNumber,
        brokerServer: payload.brokerServer,
        mt5InvestorPasswordEnc: encrypted,
        mt5InvestorPasswordIv: iv,
        equityAtStart: payload.startingEquity,
        currentEquity: payload.startingEquity,
        isActive: true,
        connectionHealth: 'disconnected',
      },
    });

    return { success: true, clientId: client.id };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
