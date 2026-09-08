import { reconciliation } from '../lib/reconciliation';

/**
 * Standalone reconciliation job.
 * Can be run via: npm run jobs:reconcile
 */
async function reconcile() {
  console.log('[Reconcile] Starting full reconciliation...');

  try {
    const report = await reconciliation.runFullReconciliation();

    console.log('[Reconcile] Results:');
    console.log(`  Clients checked: ${report.clientsChecked}`);
    console.log(`  Total positions: ${report.totalPositions}`);
    console.log(`  Matched: ${report.matched}`);
    console.log(`  Mismatches: ${report.mismatches}`);

    for (const result of report.results) {
      if (result.mismatches > 0) {
        console.log(`  [!] Client ${result.clientId}: ${result.mismatches} mismatches (health: ${result.healthScore})`);
        for (const detail of result.details) {
          if (detail.status !== 'matched') {
            console.log(`      ${detail.symbol}: ${detail.status} - ${detail.details}`);
          }
        }
      }
    }

    console.log('[Reconcile] Complete');
  } catch (error) {
    console.error('[Reconcile] Failed:', error);
  }
}

// Self-executing if run directly
if (require.main === module) {
  reconcile()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { reconcile };
