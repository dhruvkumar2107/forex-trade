import { z } from 'zod';

export const pushClientSchema = z.object({
  clientRef: z.string().uuid(),
  mt5AccountNumber: z.string().min(1),
  brokerServer: z.string().min(1),
  serverName: z.string().optional(),
  mt5InvestorPassword: z.string().min(1),
  startingEquity: z.number().positive(),
  fullName: z.string().min(1),
});

export const updateCopyConfigSchema = z.object({
  copyMode: z.enum(['fixed_ratio', 'equity_proportional', 'fixed_lot']).optional(),
  lotRatio: z.number().min(0.01).max(100).optional(),
  fixedLotSize: z.number().min(0.01).max(1000).optional(),
  minLot: z.number().min(0.01).optional(),
  maxLot: z.number().min(0.01).optional(),
  lotStep: z.number().min(0.01).optional(),
  maxDrawdownPercent: z.number().min(1).max(100).optional(),
  maxDailyLossPercent: z.number().min(1).max(100).optional(),
  maxAccountLossPercent: z.number().min(1).max(100).optional(),
  maxExposurePercent: z.number().min(1).max(100).optional(),
  maxOpenPositions: z.number().min(1).max(100).optional(),
  maxSymbolExposurePercent: z.number().min(1).max(100).optional(),
  maxLeverage: z.number().min(1).optional(),
  maxSlippagePoints: z.number().min(0).optional(),
  minEquity: z.number().min(0).optional(),
  allowedSymbols: z.array(z.string()).optional(),
  status: z.enum([
    'pending', 'under_review', 'approved', 'configured',
    'connecting', 'connected', 'healthy', 'copying',
    'paused', 'risk_paused', 'disconnected', 'error',
    'suspended', 'disabled', 'closed',
  ]).optional(),
});

export const staffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const activateKillSwitchSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  scope: z.enum(['global', 'per_client', 'per_symbol', 'per_strategy']),
  targetClientId: z.string().uuid().optional(),
  targetSymbol: z.string().optional(),
  targetStrategy: z.string().optional(),
  reason: z.string().min(1),
});

export const resolveReconciliationSchema = z.object({
  logId: z.string().uuid(),
  resolution: z.enum(['auto_resolved', 'manually_resolved', 'escalated', 'ignored']),
  notes: z.string().min(1),
});

export const updateRiskConfigSchema = z.object({
  maxDrawdownPercent: z.number().min(1).max(100).optional(),
  maxDailyLossPercent: z.number().min(1).max(100).optional(),
  maxAccountLossPercent: z.number().min(1).max(100).optional(),
  maxExposurePercent: z.number().min(1).max(100).optional(),
  maxOpenPositions: z.number().min(1).max(100).optional(),
  maxSymbolExposurePercent: z.number().min(1).max(100).optional(),
  maxLeverage: z.number().min(1).optional(),
  maxSlippagePoints: z.number().min(0).optional(),
  minEquity: z.number().min(0).optional(),
});
