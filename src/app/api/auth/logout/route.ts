export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth-server';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  // Use same core logic as GET; POST kept for XHR usage
  return handleLogout(req, /*redirect*/ false);
}

export async function GET(req: NextRequest) {
  // Support direct navigation to /api/auth/logout and redirect to '/'
  return handleLogout(req, /*redirect*/ true);
}

async function handleLogout(req: NextRequest, redirectToRoot: boolean) {
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

    // 2. Devuelve respuesta con cookie eliminada
    // Prefer redirect to canonical app URL if configured to avoid localhost/IP mismatches
    // and land on explicit login page instead of root.
    const canonicalBase = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL;
    const targetUrl = canonicalBase ? new URL('/login', canonicalBase) : new URL('/login', req.url);
    const response = redirectToRoot
      ? NextResponse.redirect(targetUrl)
      : NextResponse.json({ message: 'Logout exitoso' }, { status: 200 });

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
      expires: new Date(0),
      sameSite: 'lax' as const,
      secure: Boolean(setSecure),
    };

    // Delete with computed secure flag (matches how it was likely set)
    response.cookies.set(baseCookieOptions);
    // Also use the delete helper (host-only, Path=/) as a defensive measure
    response.cookies.delete('session');
    // Also send a non-secure deletion to cover environments where the cookie
    // may have been set without the Secure flag (reverse proxies can vary)
    response.cookies.set({ ...baseCookieOptions, secure: false });

    // If hostname looks like a domain name (not an IP), also send a domain-scoped deletion
    const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(':');
    if (!isIp && hostname) {
      console.log('[LOGOUT] hostname for domain cookie:', hostname);
      // Send a second Set-Cookie with domain explicitly set to cover domain-scoped cookies
      response.cookies.set({
        ...baseCookieOptions,
        domain: hostname,
      });
      // And a non-secure variant for domain scope as well
      response.cookies.set({
        ...baseCookieOptions,
        domain: hostname,
        secure: false,
      });

      // Additionally, attempt deletion at the parent domain (e.g., imgcve) in case older cookies
      // were set with a wider scope. This is safe if parent is a suffix of the current hostname.
      const firstDot = hostname.indexOf('.');
      if (firstDot > 0) {
        const parentDomain = hostname.slice(firstDot + 1);
        if (parentDomain) {
          response.cookies.set({
            ...baseCookieOptions,
            domain: parentDomain,
          });
          response.cookies.set({
            ...baseCookieOptions,
            domain: parentDomain,
            secure: false,
          });
        }
      }
    } else {
      console.log('[LOGOUT] skipping domain cookie (hostname is IP or empty):', hostname);
    }

    return response;
  } catch (error) {
    console.error('[LOGOUT_ERROR]', error);
    if (redirectToRoot) {
      const canonicalBase = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL;
      const fallbackUrl = canonicalBase ? new URL('/', canonicalBase) : new URL('/', req.url);
      return NextResponse.redirect(fallbackUrl);
    }
    return NextResponse.json({ message: 'Error al cerrar sesión' }, { status: 500 });
  }
}
