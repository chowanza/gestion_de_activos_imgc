import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET_KEY!;
const encodedKey = new TextEncoder().encode(secretKey);

export interface UserJwtPayload {
  sub: string;
  role: 'user' | 'admin';
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
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string): Promise<UserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify<UserJwtPayload>(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}