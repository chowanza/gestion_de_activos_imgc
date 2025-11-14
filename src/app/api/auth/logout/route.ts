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
  // GET ahora también puede recibir la URL del cliente para un borrado preciso.
  const clientUrl = req.nextUrl.searchParams.get('clientUrl') || undefined;
  return handleLogout(req, /*redirect*/ true, clientUrl);
}

async function handleLogout(req: NextRequest, redirectToRoot: boolean, clientUrl?: string) {
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
    const canonicalBase = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL;
    const targetUrl = canonicalBase ? new URL('/', canonicalBase) : new URL('/', req.url);
    const response = redirectToRoot
      ? NextResponse.redirect(targetUrl)
      : NextResponse.json({ message: 'Logout exitoso' }, { status: 200 });

    // Ask compatible browsers to clear cookies for this origin as a safety net
    try {
      response.headers.set('Clear-Site-Data', '"cookies"');
    } catch {}

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

    // Determinar el host de la cookie a borrar
    let targetHost = '';
    if (clientUrl) {
      try {
        targetHost = new URL(clientUrl).hostname;
        console.log(`[LOGOUT] Using hostname from clientUrl: ${targetHost}`);
      } catch {
        // Fallback si la URL del cliente es inválida
        targetHost = (req.headers.get('host') || '').split(':')[0];
        console.log(`[LOGOUT] Fallback to request host: ${targetHost}`);
      }
    } else {
      targetHost = (req.headers.get('host') || '').split(':')[0];
      console.log(`[LOGOUT] Using hostname from request: ${targetHost}`);
    }

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

    // Additionally, attempt to delete potential legacy path-scoped cookies
    // Some older sessions may have been set with Path=/api or other paths
    const legacyPaths = ['/', '/api', '/app', '/dashboard'];
    for (const p of legacyPaths) {
      try {
        response.cookies.set({ ...baseCookieOptions, path: p });
        response.cookies.set({ ...baseCookieOptions, path: p, secure: false });
      } catch {}
    }

    // If hostname looks like a domain name (not an IP), also send a domain-scoped deletion
    const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(':');
    if (!isIp && hostname) {
      console.log('[LOGOUT] hostname for domain cookie:', hostname);
      // Send domain-scoped deletions for multiple legacy paths
      const domainsToClear = [hostname];
      // Additionally, attempt deletion at the parent domain (e.g., imgcve)
      const firstDot = hostname.indexOf('.');
      if (firstDot > 0) {
        const parentDomain = hostname.slice(firstDot + 1);
        if (parentDomain) domainsToClear.push(parentDomain);
      }
      for (const d of domainsToClear) {
        // Hostname without leading dot is standard; browsers treat it equivalently
        for (const p of legacyPaths) {
          try {
            response.cookies.set({ ...baseCookieOptions, domain: d, path: p });
            response.cookies.set({ ...baseCookieOptions, domain: d, path: p, secure: false });
          } catch {}
        }
      }
    } else {
      console.log('[LOGOUT] skipping domain cookie (hostname is IP or empty):', hostname);
    }

    // Borrado de cookies usando el 'targetHost'
    const domainsToClear = [targetHost];
    const firstDot = targetHost.indexOf('.');
    if (firstDot > 0 && !/^\d+\.\d+\.\d+\.\d+$/.test(targetHost)) {
      const parentDomain = targetHost.slice(firstDot + 1);
      if (parentDomain) domainsToClear.push(parentDomain);
    }

    for (const d of domainsToClear) {
      // Hostname without leading dot is standard; browsers treat it equivalently
      for (const p of legacyPaths) {
        try {
          response.cookies.set({ ...baseCookieOptions, domain: d, path: p });
          response.cookies.set({ ...baseCookieOptions, domain: d, path: p, secure: false });
        } catch {}
      }
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
