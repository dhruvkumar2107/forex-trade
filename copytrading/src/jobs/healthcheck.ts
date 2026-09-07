import { prisma } from '../lib/prisma';
import { metaApiService } from '../lib/metaapi';

async function healthCheck() {
  console.log('[HealthCheck] Starting health check...');

  const clients = await prisma.copyTradingClient.findMany({
    where: { isActive: true },
  });

  let healthy = 0;
  let degraded = 0;
  let disconnected = 0;

  for (const client of clients) {
    if (!client.metaApiAccountId) {
      disconnected++;
      continue;
    }

    try {
      const info = await metaApiService.getAccountInfo(client.metaApiAccountId);
      const health = info ? 'healthy' : 'disconnected';

      await prisma.copyTradingClient.update({
        where: { id: client.id },
        data: { connectionHealth: health, lastHealthCheckAt: new Date() },
      });

      if (health === 'healthy') {
        healthy++;
        // Update equity
        if (info) {
          await prisma.copyTradingClient.update({
            where: { id: client.id },
            data: {
              currentEquity: info.equity,
              totalPnL: info.equity - (client.equityAtStart || 0),
            },
          });
        }
      } else {
        disconnected++;
        await prisma.copyTradeAlert.create({
          data: {
            clientId: client.id,
            type: 'connection_drop',
            severity: 'warning',
            message: `Connection to MT5 account lost`,
          },
        });
      }
    } catch (error) {
      degraded++;
      console.error(`[HealthCheck] Error for ${client.clientRef}:`, error);
    }
  }

  console.log(`[HealthCheck] Complete: ${healthy} healthy, ${degraded} degraded, ${disconnected} disconnected`);
}

if (require.main === module) {
  healthCheck()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export { healthCheck };
