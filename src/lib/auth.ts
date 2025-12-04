import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET_KEY || 'default-secret-key-for-development-only-change-in-production';
const encodedKey = new TextEncoder().encode(secretKey);

export interface UserJwtPayload {
  sub: string;
  role: 'admin' | 'editor' | 'viewer' | 'user';
  username: string;
  avatar?: string;
  jti?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export async function encrypt(payload: UserJwtPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(encodedKey);
}

export async function decrypt(session: string): Promise<UserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify<UserJwtPayload>(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      // Session expired, this is expected behavior after 7 days
      // console.log('Session expired');
      return null;
    }
    console.error('Failed to verify session:', error);
    return null;
  }
}