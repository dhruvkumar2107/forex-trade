export type CopyMode = 'fixed_lot' | 'fixed_ratio' | 'equity_proportional';

export type ConnectionHealth =
  | 'connected' | 'degraded' | 'disconnected' | 'auth_failed'
  | 'stale' | 'reconnecting' | 'error' | 'unknown';

export const DEFAULT_SYMBOL_WHITELIST = [
  'XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'AUDUSD',
];
