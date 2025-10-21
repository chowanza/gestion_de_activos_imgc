export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth-server';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    // Obtener información del usuario antes de eliminar la sesión
    const user = await getServerUser(req);
    
    // 1. Elimina la sesión (set-cookie con max-age=0 o expires pasado)
    await deleteSession();

    // Registrar logout en auditoría
    if (user) {
      const ipAddress = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown') as string;
      const userAgent = (req.headers.get('user-agent') || 'unknown') as string;
      
      await AuditLogger.logLogout(user.id as string, ipAddress, userAgent);
    }

    // 2. Devuelve respuesta JSON con cookie eliminada
    const response = NextResponse.json(
      { message: 'Logout exitoso' },
      { status: 200 }
    );

    // Determine whether to set the Secure flag for deletion (same logic as login)
    const forwardedProto = req.headers.get('x-forwarded-proto') || req.headers.get('x-forwarded-protocol');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || '';
    const isSecureRequest = !!forwardedProto && forwardedProto.toLowerCase().startsWith('https');
    const appUrlIsHttps = appUrl.toLowerCase().startsWith('https');
    let setSecure = isSecureRequest || appUrlIsHttps;

    // Allow overriding the secure cookie behavior via env var for intranet setups
    const cookieForce = process.env.COOKIE_FORCE_SECURE; // 'true' | 'false' | undefined
    if (cookieForce === 'true' || cookieForce === 'false') {
      setSecure = cookieForce === 'true';
    }

    // Debug logs to help troubleshoot production issues
    console.log('[LOGOUT] x-forwarded-proto=', forwardedProto, 'appUrl=', appUrl, 'cookieForce=', cookieForce, 'setSecure=', setSecure);

    // Determine hostname for optional domain-scoped deletion
    const hostHeader = req.headers.get('host') || '';
    const hostname = hostHeader.split(':')[0] || '';

    // Explicitly set an expired cookie with the same attributes so browsers delete correctly
    const baseCookieOptions = {
      name: 'session',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'lax' as const,
      secure: Boolean(setSecure),
    };

    response.cookies.set(baseCookieOptions);

    // If hostname looks like a domain name (not an IP), also send a domain-scoped deletion
    const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(':');
    if (!isIp && hostname) {
      console.log('[LOGOUT] hostname for domain cookie:', hostname);
      // Send a second Set-Cookie with domain explicitly set to cover domain-scoped cookies
      response.cookies.set({
        ...baseCookieOptions,
        domain: hostname,
      });
    } else {
      console.log('[LOGOUT] skipping domain cookie (hostname is IP or empty):', hostname);
    }

    return response;
  } catch (error) {
    console.error('[LOGOUT_ERROR]', error);
    return NextResponse.json(
      { message: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
