export type ClientStatus = 'submitted' | 'reviewing' | 'approved' | 'connected' | 'rejected';

export interface Client {
  id: string;
  fullName: string;
  mobile: string;
  mobileVerified: boolean;
  occupation: string;
  mt5AccountNumber: string;
  mt5InvestorPasswordEnc: string;
  mt5InvestorPasswordIv: string;
  brokerServer: string;
  startingEquity: number;
  city: string;
  state: string;
  consentGiven: boolean;
  consentTimestamp: Date;
  status: ClientStatus;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  pushedToCopyTrading: boolean;
  pushedAt: Date | null;
}

export interface CreateClientInput {
  fullName: string;
  mobile: string;
  occupation: string;
  mt5AccountNumber: string;
  mt5InvestorPassword: string;
  brokerServer: string;
  startingEquity: number;
  city: string;
  state: string;
  consentGiven: boolean;
}

export interface CopyTradingClient {
  id: string;
  clientRef: string;
  mt5AccountNumber: string;
  brokerServer: string;
  mt5InvestorPasswordEnc: string;
  mt5InvestorPasswordIv: string;
  metaApiAccountId: string | null;
  copyMode: CopyMode;
  lotScaling: LotScalingMode;
  lotRatio: number;
  maxDrawdownPercent: number;
  symbolWhitelist: string[];
  isActive: boolean;
  isPaused: boolean;
  connectionHealth: ConnectionHealth;
  lastTradeSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CopyMode = 'fixed_ratio' | 'equity_proportional' | 'fixed_lot';
export type LotScalingMode = 'fixed_ratio' | 'equity_proportional' | 'fixed_lot';
export type ConnectionHealth = 'healthy' | 'degraded' | 'disconnected' | 'error';

export interface PushClientPayload {
  clientRef: string;
  mt5AccountNumber: string;
  brokerServer: string;
  mt5InvestorPassword: string;
  startingEquity: number;
  fullName: string;
}

export interface TradeEvent {
  id: string;
  masterTradeId: string;
  clientId: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  closePrice: number | null;
  sl: number | null;
  tp: number | null;
  profit: number | null;
  status: 'open' | 'closed' | 'modified' | 'error';
  executionLatencyMs: number | null;
  error: string | null;
  createdAt: Date;
}

export interface BrokerServer {
  name: string;
  provider: string;
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Puducherry', 'Chandigarh', 'Andaman and Nicobar Islands',
  'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep'
] as const;

export const POPULAR_BROKER_SERVERS: BrokerServer[] = [
  { name: 'Exness-MT5Real', provider: 'Exness' },
  { name: 'Exness-MT5Trial', provider: 'Exness' },
  { name: 'ICMarketsSC-MT5', provider: 'IC Markets' },
  { name: 'FPMarkets-MT5', provider: 'FP Markets' },
  { name: 'Pepperstone-MT5', provider: 'Pepperstone' },
  { name: 'XMGlobal-MT5', provider: 'XM' },
  { name: 'Tickmill-MT5', provider: 'Tickmill' },
  { name: 'RoboForex-MT5', provider: 'RoboForex' },
  { name: 'HotForex-MT5', provider: 'HotForex' },
  { name: 'FXTM-MT5', provider: 'FXTM' },
  { name: 'OctaFX-MT5', provider: 'OctaFX' },
  { name: 'Alpari-MT5', provider: 'Alpari' },
  { name: 'InstaForex-MT5', provider: 'InstaForex' },
  { name: 'AdmiralMarkets-MT5', provider: 'Admiral Markets' },
  { name: 'Axiory-MT5', provider: 'Axiory' },
];

export const DEFAULT_SYMBOL_WHITELIST = [
  'XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'AUDUSD',
  'USDJPY', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY'
];
