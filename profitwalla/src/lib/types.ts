export type ClientStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'pushed';

export interface PushClientPayload {
  clientRef: string;
  mt5AccountNumber: string;
  brokerServer: string;
  serverName?: string;
  mt5InvestorPassword: string;
  startingEquity: number;
  fullName: string;
}
