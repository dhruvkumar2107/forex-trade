import { z } from 'zod';

export const pushClientSchema = z.object({
  clientRef: z.string().uuid(),
  mt5AccountNumber: z.string(),
  brokerServer: z.string(),
  mt5InvestorPassword: z.string(),
  startingEquity: z.number(),
  fullName: z.string(),
});

export const updateCopyConfigSchema = z.object({
  copyMode: z.enum(['fixed_ratio', 'equity_proportional', 'fixed_lot']).optional(),
  lotRatio: z.number().min(0.01).max(100).optional(),
  maxDrawdownPercent: z.number().min(1).max(100).optional(),
  symbolWhitelist: z.array(z.string()).optional(),
  isPaused: z.boolean().optional(),
});

export const staffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
