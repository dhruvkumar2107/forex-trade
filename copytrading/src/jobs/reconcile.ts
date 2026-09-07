import { prisma } from '../lib/prisma';
import { metaApiService } from '../lib/metaapi';

const MASTER_ACCOUNT_ID = process.env.METAAPI_MASTER_ACCOUNT_ID;

async function reconcile() {
  console.log('[Reconcile] Starting reconciliation job...');

  const clients = await prisma.copyTradingClient.findMany({
    where: { isActive: true, metaApiAccountId: { not: null } },
  });

  for (const client of clients) {
    if (!client.metaApiAccountId) continue;

    try {
      // Get expected open trades from our DB
      const expectedTrades = await prisma.tradeEvent.findMany({
        where: { clientId: client.id, status: 'open' },
      });

      // Get actual open trades from MetaApi
      const actualTrades = await metaApiService.getOpenTrades(client.metaApiAccountId);

      const expectedIds = new Set(expectedTrades.map((t) => t.metaApiTradeId).filter(Boolean));
      const actualIds = new Set(actualTrades.map((t) => t.id));

      // Find mismatches
      const missingOnBroker = expectedTrades.filter((t) => t.metaApiTradeId && !actualIds.has(t.metaApiTradeId));
      const missingInDB = actualTrades.filter((t) => !expectedIds.has(t.id));

      const matchStatus = missingOnBroker.length === 0 && missingInDB.length === 0 ? 'match' : 'mismatch';

      let details = '';
      if (missingOnBroker.length > 0) {
        details += `Missing on broker: ${missingOnBroker.map((t) => t.masterTradeId).join(', ')}; `;
      }
      if (missingInDB.length > 0) {
        details += `Missing in DB: ${missingInDB.map((t) => t.id).join(', ')}; `;
      }

      // Log reconciliation result
      await prisma.reconciliationLog.create({
        data: {
          clientId: client.id,
          matchStatus,
          details: details || 'All trades match',
        },
      });

      if (matchStatus === 'mismatch') {
        console.log(`[Reconcile] Mismatch for client ${client.clientRef}: ${details}`);
      }
    } catch (error) {
      console.error(`[Reconcile] Error for client ${client.clientRef}:`, error);
      await prisma.reconciliationLog.create({
        data: {
          clientId: client.id,
          matchStatus: 'error',
          details: (error as Error).message,
        },
      });
    }
  }

  console.log('[Reconcile] Reconciliation job completed');
}

// Run if called directly
if (require.main === module) {
  reconcile()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export { reconcile };
