import { connectionMonitor } from '../lib/connection-monitor';

/**
 * Standalone health check job.
 * Can be run via: npm run jobs:healthcheck
 */
async function healthCheck() {
  console.log('[HealthCheck] Starting...');

  try {
    const report = await connectionMonitor.checkAllClients();

    console.log('[HealthCheck] Results:');
    console.log(`  Total clients: ${report.totalClients}`);
    console.log(`  Healthy: ${report.healthy}`);
    console.log(`  Degraded: ${report.degraded}`);
    console.log(`  Disconnected: ${report.disconnected}`);
    console.log(`  Errors: ${report.errors}`);

    for (const result of report.results) {
      if (result.state !== 'connected') {
        console.log(`  [!] Client ${result.clientId}: ${result.state} (score: ${result.healthScore})`);
      }
    }

    console.log('[HealthCheck] Complete');
  } catch (error) {
    console.error('[HealthCheck] Failed:', error);
  }
}

// Self-executing if run directly
if (require.main === module) {
  healthCheck()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { healthCheck };
