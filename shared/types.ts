// ============================================================
// SHARED TYPES — PROFITWALLA + COPY TRADING
// ============================================================

// --- Client Onboarding (Profitwalla) ---
export type ClientOnboardingStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'pushed';

export interface Client {
  id: string;
  fullName: string;
  mobile: string;
  mobileVerified: boolean;
  occupation: string | null;
  business: string | null;
  mt5AccountNumber: string;
  mt5InvestorPasswordEnc: string;
  mt5InvestorPasswordIv: string;
  brokerServer: string;
  serverName: string | null;
  startingEquity: number;
  city: string;
  state: string;
  consentGiven: boolean;
  consentTimestamp: Date | null;
  status: ClientOnboardingStatus;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  pushedToCopyTrading: boolean;
  pushedAt: Date | null;
  copyTradingClientId: string | null;
}

export interface CreateClientInput {
  fullName: string;
  mobile: string;
  occupation: string;
  business?: string;
  mt5AccountNumber: string;
  mt5InvestorPassword: string;
  brokerServer: string;
  serverName?: string;
  startingEquity: number;
  city: string;
  state: string;
  consentGiven: boolean;
}

// --- Copy Trading Client ---
export type CtClientStatus =
  | 'pending' | 'under_review' | 'approved' | 'configured'
  | 'connecting' | 'connected' | 'healthy' | 'copying'
  | 'paused' | 'risk_paused' | 'disconnected' | 'error'
  | 'suspended' | 'disabled' | 'closed';

export type CopyMode = 'fixed_lot' | 'fixed_ratio' | 'equity_proportional';

export type ConnectionHealth =
  | 'connected' | 'degraded' | 'disconnected' | 'auth_failed'
  | 'stale' | 'reconnecting' | 'error' | 'unknown';

export type DrawdownLevel = 'normal' | 'warning' | 'high_risk' | 'paused' | 'emergency';

export interface CopyTradingClient {
  id: string;
  clientRef: string;
  mt5AccountNumber: string;
  brokerServer: string;
  metaApiAccountId: string | null;
  metaApiConnectionId: string | null;

  status: CtClientStatus;
  previousStatus: CtClientStatus | null;
  statusChangedAt: Date | null;
  statusChangeReason: string | null;
  statusChangedBy: string | null;

  copyMode: CopyMode;
  lotRatio: number;
  fixedLotSize: number | null;
  minLot: number;
  maxLot: number;
  lotStep: number;
  allowedSymbols: string[];

  maxDrawdownPercent: number;
  maxDailyLossPercent: number;
  maxAccountLossPercent: number;
  maxExposurePercent: number;
  maxOpenPositions: number;
  maxSymbolExposurePercent: number;
  maxLeverage: number;
  maxSlippagePoints: number;
  minEquity: number;

  equityAtStart: number | null;
  currentEquity: number | null;
  currentBalance: number | null;
  totalPnL: number;
  dailyPnL: number;
  drawdownLevel: DrawdownLevel;
  currentDrawdownPercent: number;
  peakEquity: number | null;

  connectionHealth: ConnectionHealth;
  lastHeartbeat: Date | null;
  lastTradeSyncAt: Date | null;
  lastHealthCheckAt: Date | null;
  healthScore: number;
  latencyMs: number | null;

  tradesCopied: number;
  tradesFailed: number;
  tradesRejected: number;

  createdAt: Date;
  updatedAt: Date;
}

// --- Trade State Machine ---
export type TradeState =
  | 'detected' | 'validating' | 'risk_check' | 'queued'
  | 'executing' | 'broker_acknowledged' | 'verified' | 'reconciled'
  | 'rejected' | 'risk_blocked' | 'broker_error' | 'timeout'
  | 'retrying' | 'partial' | 'mismatch' | 'manual_review' | 'failed';

// --- Master Position ---
export type MasterPositionState = 'open' | 'modified' | 'partial_closed' | 'closed' | 'error' | 'unknown';

export interface MasterPosition {
  id: string;
  masterAccountId: string;
  metaApiPositionId: string;
  symbol: string;
  direction: string;
  volume: number;
  openPrice: number;
  sl: number | null;
  tp: number | null;
  profit: number | null;
  state: MasterPositionState;
  lastDetectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// --- Copy Execution ---
export type RiskDecisionValue = 'approved' | 'rejected';

export interface CopyExecution {
  id: string;
  clientId: string;
  masterPositionId: string | null;

  symbol: string;
  masterSymbol: string | null;
  direction: string;
  requestedVolume: number;
  actualVolume: number | null;
  requestedPrice: number | null;
  actualEntryPrice: number | null;
  masterEntryPrice: number | null;

  requestedSl: number | null;
  requestedTp: number | null;
  actualSl: number | null;
  actualTp: number | null;

  state: TradeState;
  previousState: TradeState | null;

  signalTime: Date;
  queueTime: Date | null;
  executionStartTime: Date | null;
  brokerResponseTime: Date | null;
  brokerRequestId: string | null;
  verificationTime: Date | null;
  completionTime: Date | null;

  internalLatencyMs: number | null;
  brokerLatencyMs: number | null;
  totalLatencyMs: number | null;

  slippagePoints: number | null;
  slippagePercent: number | null;

  riskDecision: RiskDecisionValue | null;
  riskRule: string | null;
  riskMessage: string | null;

  retryCount: number;
  maxRetries: number;

  error: string | null;

  idempotencyKey: string | null;

  reconciled: boolean;
  reconciledAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// --- Risk ---
export type ReconciliationStatus =
  | 'matched' | 'missing' | 'extra' | 'volume_mismatch'
  | 'price_mismatch' | 'sl_mismatch' | 'tp_mismatch'
  | 'status_mismatch' | 'unknown' | 'manual_review';

export type ReconciliationResolution =
  | 'pending' | 'auto_resolved' | 'manually_resolved' | 'escalated' | 'ignored';

// --- Incident ---
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentState = 'detected' | 'acknowledged' | 'investigating' | 'contained' | 'resolved' | 'closed';

// --- Staff ---
export type StaffRole = 'super_admin' | 'admin' | 'risk_manager' | 'operations' | 'staff' | 'viewer';

// --- Permissions ---
export const STAFF_PERMISSIONS = [
  'VIEW_CLIENT', 'ADD_CLIENT', 'ACTIVATE_CLIENT',
  'CHANGE_RISK', 'CHANGE_COPY_MODE', 'PAUSE_CLIENT', 'RESUME_CLIENT',
  'MANAGE_SYMBOLS', 'MANAGE_MASTER', 'VIEW_CREDENTIAL_STATUS', 'REVEAL_CREDENTIAL',
  'VIEW_AUDIT', 'TRIGGER_RECONCILIATION', 'EMERGENCY_STOP',
  'VIEW_DASHBOARD', 'VIEW_TRADES', 'VIEW_ALERTS',
  'MANAGE_STAFF', 'VIEW_INCIDENTS', 'MANAGE_INCIDENTS',
] as const;

export type StaffPermission = typeof STAFF_PERMISSIONS[number];

// --- Push Payload ---
export interface PushClientPayload {
  clientRef: string;
  mt5AccountNumber: string;
  brokerServer: string;
  serverName?: string;
  mt5InvestorPassword: string;
  startingEquity: number;
  fullName: string;
}

// --- Indian States ---
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

// --- Broker Servers ---
export interface BrokerServer {
  name: string;
  provider: string;
}

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

// --- Default Symbol Whitelist ---
export const DEFAULT_SYMBOL_WHITELIST = [
  'XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'AUDUSD',
];
