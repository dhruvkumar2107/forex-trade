export type CopyMode = 'fixed_lot' | 'fixed_ratio' | 'equity_proportional';

export type ConnectionHealth =
  | 'connected' | 'degraded' | 'disconnected' | 'auth_failed'
  | 'stale' | 'reconnecting' | 'error' | 'unknown';

export type CtClientStatus =
  | 'pending' | 'under_review' | 'approved' | 'configured'
  | 'connecting' | 'connected' | 'healthy' | 'copying'
  | 'paused' | 'risk_paused' | 'disconnected' | 'error'
  | 'suspended' | 'disabled' | 'closed';

export type TradeState =
  | 'detected' | 'validating' | 'risk_check' | 'queued'
  | 'executing' | 'broker_acknowledged' | 'verified' | 'reconciled'
  | 'rejected' | 'risk_blocked' | 'broker_error' | 'timeout'
  | 'retrying' | 'partial' | 'mismatch' | 'manual_review' | 'failed';

export type DrawdownLevel = 'normal' | 'warning' | 'high_risk' | 'paused' | 'emergency';

export const DEFAULT_SYMBOL_WHITELIST = [
  'XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'AUDUSD',
];

export const CONNECTION_HEALTH_LABELS: Record<string, string> = {
  connected: 'Connected',
  degraded: 'Degraded',
  disconnected: 'Disconnected',
  auth_failed: 'Auth Failed',
  stale: 'Stale',
  reconnecting: 'Reconnecting',
  error: 'Error',
  unknown: 'Unknown',
};

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  configured: 'Configured',
  connecting: 'Connecting',
  connected: 'Connected',
  healthy: 'Healthy',
  copying: 'Copying',
  paused: 'Paused',
  risk_paused: 'Risk Paused',
  disconnected: 'Disconnected',
  error: 'Error',
  suspended: 'Suspended',
  disabled: 'Disabled',
  closed: 'Closed',
};

export const COPY_MODE_LABELS: Record<string, string> = {
  fixed_lot: 'Fixed Lot',
  fixed_ratio: 'Fixed Ratio',
  equity_proportional: 'Equity Proportional',
};

export const TRADE_STATE_LABELS: Record<string, string> = {
  detected: 'Detected',
  validating: 'Validating',
  risk_check: 'Risk Check',
  queued: 'Queued',
  executing: 'Executing',
  broker_acknowledged: 'Broker Ack',
  verified: 'Verified',
  reconciled: 'Reconciled',
  rejected: 'Rejected',
  risk_blocked: 'Risk Blocked',
  broker_error: 'Broker Error',
  timeout: 'Timeout',
  retrying: 'Retrying',
  partial: 'Partial',
  mismatch: 'Mismatch',
  manual_review: 'Manual Review',
  failed: 'Failed',
};
