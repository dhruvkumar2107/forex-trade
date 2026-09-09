import crypto from 'crypto';

const SECRET = process.env.CLIENT_TOKEN_SECRET || 'fallback-dev-secret-change-in-production';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateClientToken(clientId: string): string {
  const expires = Date.now() + TOKEN_EXPIRY_MS;
  const payload = `${clientId}:${expires}`;
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export function verifyClientToken(token: string): { valid: boolean; clientId?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) return { valid: false };

    const [clientId, expiresStr, signature] = parts;
    const expires = parseInt(expiresStr, 10);

    if (Date.now() > expires) return { valid: false };

    const payload = `${clientId}:${expires}`;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false };
    }

    return { valid: true, clientId };
  } catch {
    return { valid: false };
  }
}
