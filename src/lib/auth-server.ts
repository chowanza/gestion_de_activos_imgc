'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/auth';

export async function createSession(userId: string, role: 'user' | 'admin') {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      role: true
    }
  });
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ 
    sub: userId, 
    role, 
    username: user.username || '',
    exp: expires.getTime() / 1000 
  });

  (await cookies()).set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_URL?.startsWith('https'),
    path: '/',
  });

  return session;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  
  const { decrypt } = await import('@/lib/auth');
  return decrypt(session);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}