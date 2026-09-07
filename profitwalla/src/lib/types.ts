export type ClientStatus = 'submitted' | 'reviewing' | 'approved' | 'connected' | 'rejected';

export interface PushClientPayload {
  clientRef: string;
  mt5AccountNumber: string;
  brokerServer: string;
  mt5InvestorPassword: string;
  startingEquity: number;
  fullName: string;
}
