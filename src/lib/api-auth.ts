import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from './auth-server';

export type SessionUser = any;

/**
 * Require an authenticated session. Returns the session object or
 * returns a NextResponse (401) which the caller should return.
 */
export async function requireAuth(request: NextRequest): Promise<SessionUser | NextResponse> {
  const session = await getServerUser(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  return session;
}

export function isAdminSession(session: SessionUser | null | undefined): boolean {
  if (!session) return false;
  // support different casings and dev override flag
  const role = (session.role || session?.user?.role || '').toString().toLowerCase();
  if (role === 'admin') return true;
  if ((session as any).isSuperAdmin) return true;
  return false;
}

/**
 * Require admin session. Returns session or a NextResponse (401/403).
 */
export async function requireAdmin(request: NextRequest): Promise<SessionUser | NextResponse> {
  const session = await getServerUser(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  return session;
}

export default {
  requireAuth,
  requireAdmin,
  isAdminSession,
};
