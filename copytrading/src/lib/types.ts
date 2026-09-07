export type CopyMode = 'fixed_ratio' | 'equity_proportional' | 'fixed_lot';
export type ConnectionHealth = 'healthy' | 'degraded' | 'disconnected' | 'error';

export const DEFAULT_SYMBOL_WHITELIST = [
  'XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'AUDUSD',
  'USDJPY', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY'
];
