export class CopyEngine {
  static getInstance(): CopyEngine {
    throw new Error('Copy engine belongs in the copytrading service');
  }

  async startMasterListener(): Promise<void> {
    throw new Error('Copy engine belongs in the copytrading service');
  }

  async addClient(): Promise<never> {
    throw new Error('Copy engine belongs in the copytrading service');
  }
}

export const copyEngine = CopyEngine.getInstance();
