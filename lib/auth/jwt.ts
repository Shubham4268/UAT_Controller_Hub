import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/config/env';

const SECRET = new TextEncoder().encode(env.JWT_SECRET);
const ALG = 'HS256';

export async function signJWT(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN || '24h') // Configurable expiry
    .sign(SECRET);
}

export async function verifyJWT<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as T;
  } catch {
    return null;
  }
}
