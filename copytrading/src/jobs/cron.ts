import cron from 'node-cron';
import { reconcile } from './reconcile';
import { healthCheck } from './healthcheck';

console.log('[Cron] Starting scheduled jobs...');

// Run health check every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('[Cron] Running health check...');
  try {
    await healthCheck();
  } catch (error) {
    console.error('[Cron] Health check failed:', error);
  }
});

// Run reconciliation every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('[Cron] Running reconciliation...');
  try {
    await reconcile();
  } catch (error) {
    console.error('[Cron] Reconciliation failed:', error);
  }
});

console.log('[Cron] Scheduled jobs started (health: */5, reconcile: */15)');
