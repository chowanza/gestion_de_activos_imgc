export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth-server';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

// POST: llamado desde el frontend (fetch) para cerrar sesión.
// GET: permite logout por navegación directa si se necesitara.
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

    // 2. Devuelve respuesta JSON simple
    const response = NextResponse.json({ message: 'Logout exitoso' }, { status: 200 });

    // Determine whether to set the Secure flag for deletion (same logic as login)
    // Determinar si la cookie debe marcarse como secure o no (igual que en login)
    const forwardedProto = req.headers.get('x-forwarded-proto') || req.headers.get('x-forwarded-protocol');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || '';
    const isSecureRequest = !!forwardedProto && forwardedProto.toLowerCase().startsWith('https');
    const appUrlIsHttps = appUrl.toLowerCase().startsWith('https');
    let setSecure = isSecureRequest || appUrlIsHttps;

    const cookieForce = process.env.COOKIE_FORCE_SECURE; // 'true' | 'false' | undefined
    if (cookieForce === 'true' || cookieForce === 'false') {
      setSecure = cookieForce === 'true';
    }

    console.log('[LOGOUT] setSecure=', setSecure, 'appUrl=', appUrl);

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

    // Borrar cookie host-only (sin domain explícito) y con domain canónico.
    // 1) Host-only (por si se creó sin Domain)
    response.cookies.set(baseCookieOptions);
    // 2) Con Domain=sga.imgcve (tal como se ve en tu captura)
    const canonicalDomain = new URL(appUrl || 'http://sga.imgcve').hostname || 'sga.imgcve';
    response.cookies.set({ ...baseCookieOptions, domain: canonicalDomain });
    // 3) Variante no-secure por si acaso
    response.cookies.set({ ...baseCookieOptions, secure: false });
    response.cookies.set({ ...baseCookieOptions, domain: canonicalDomain, secure: false });

    return response;
  } catch (error) {
    console.error('[LOGOUT_ERROR]', error);
    return NextResponse.json({ message: 'Error al cerrar sesión' }, { status: 500 });
  }
}

// GET simple: reutiliza la lógica del POST pero devuelve redirect a '/'
export async function GET(req: NextRequest) {
  const res = await POST(req);
  // Si el resultado es JSON 200, redirigimos a la raíz.
  const canonicalBase = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL;
  const targetUrl = canonicalBase ? new URL('/', canonicalBase) : new URL('/', req.url);
  const redirect = NextResponse.redirect(targetUrl);
  // Copiar cabeceras Set-Cookie del POST al redirect para no perder el borrado
  const setCookieHeaders = (res.headers as any).getSetCookie?.() || res.headers.get('set-cookie');
  if (setCookieHeaders) {
    if (Array.isArray(setCookieHeaders)) {
      for (const c of setCookieHeaders) redirect.headers.append('Set-Cookie', c);
    } else {
      redirect.headers.set('Set-Cookie', setCookieHeaders as string);
    }
  }
  return redirect;
}
