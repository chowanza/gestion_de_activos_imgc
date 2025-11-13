export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  const headerCookie = req.headers.get('cookie') || '';
  const host = req.headers.get('host') || '';
  const xfp = req.headers.get('x-forwarded-proto') || req.headers.get('x-forwarded-protocol') || '';
  const ua = req.headers.get('user-agent') || '';
  const all = req.cookies.getAll().map(c => ({ name: c.name, value: c.value?.slice(0, 16) + '…', rawLen: c.value?.length || 0 }));
  const user = await getServerUser(req);

  const res = NextResponse.json({
    host,
    forwardedProto: xfp,
    user: user ? { id: (user as any).id, role: (user as any).role, username: (user as any).username } : null,
    cookiesHeader: headerCookie,
    cookiesParsed: all,
  }, { status: 200 });

  res.headers.set('Cache-Control', 'no-store');
  return res;
}
