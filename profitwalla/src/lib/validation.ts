import { z } from 'zod';

export const clientFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  mobile: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  occupation: z.string().min(2, 'Occupation is required').max(100),
  mt5AccountNumber: z.string().regex(/^\d{5,15}$/, 'MT5 account number must be 5-15 digits'),
  mt5InvestorPassword: z.string().min(1, 'Investor password is required'),
  brokerServer: z.string().min(1, 'Broker server is required'),
  startingEquity: z.number().min(100, 'Minimum starting equity is $100').max(10000000),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(1, 'State is required'),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the risk disclosure and consent' }),
  }),
});

export type ClientFormInput = z.infer<typeof clientFormSchema>;

export const otpRequestSchema = z.object({
  mobile: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian mobile number'),
});

export const otpVerifySchema = z.object({
  mobile: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminUpdateClientSchema = z.object({
  status: z.enum(['submitted', 'reviewing', 'approved', 'rejected', 'connected']).optional(),
  adminNotes: z.string().max(2000).optional(),
});

export const pushToCopyTradingSchema = z.object({
  clientId: z.string().uuid(),
});

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
