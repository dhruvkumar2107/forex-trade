import cron from 'node-cron';
import { reconciliation } from '../lib/reconciliation';
import { connectionMonitor } from '../lib/connection-monitor';
import { idempotency } from '../lib/idempotency';

console.log('[Cron] Starting scheduled jobs...');

// Run health check every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('[Cron] Running connection health check...');
  try {
    const report = await connectionMonitor.checkAllClients();
    console.log(`[Cron] Health check complete: ${report.healthy} healthy, ${report.degraded} degraded, ${report.disconnected} disconnected`);
  } catch (error) {
    console.error('[Cron] Health check failed:', error);
  }
});

// Run reconciliation every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('[Cron] Running reconciliation...');
  try {
    const report = await reconciliation.runFullReconciliation();
    console.log(`[Cron] Reconciliation complete: ${report.matched} matched, ${report.mismatches} mismatches`);
  } catch (error) {
    console.error('[Cron] Reconciliation failed:', error);
  }
});

// Clean up stale idempotency locks every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log('[Cron] Cleaning up stale idempotency locks...');
  try {
    const cleaned = await idempotency.cleanupStale();
    if (cleaned > 0) {
      console.log(`[Cron] Cleaned ${cleaned} stale locks`);
    }
  } catch (error) {
    console.error('[Cron] Idempotency cleanup failed:', error);
  }
});

console.log('[Cron] Scheduled jobs started (health: */5, reconcile: */15, idempotency cleanup: */10)');
