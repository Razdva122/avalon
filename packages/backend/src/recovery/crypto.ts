import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'crypto';

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const privateKey = (value: string, key: Buffer) => createHmac('sha256', key).update(value).digest('hex');

export function encrypt(value: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const bytes = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString('base64');
}

export function decrypt(value: string, key: Buffer): string {
  const bytes = Buffer.from(value, 'base64');
  const cipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
  cipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString('utf8');
}
