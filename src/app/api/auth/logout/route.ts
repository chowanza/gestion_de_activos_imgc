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

    // Borrar la cookie "session" usando exactamente los mismos atributos
    // que se usan en el login (host-only, path=/, sameSite=lax) y
    // variando solo el flag secure para cubrir ambos escenarios.

    // 1) Host-only, usar exactamente el mismo flag secure que en login
    response.cookies.set({
      name: 'session',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      sameSite: 'lax',
      secure: Boolean(setSecure),
    });

    return response;
  } catch (error) {
    console.error('[LOGOUT_ERROR]', error);
    return NextResponse.json({ message: 'Error al cerrar sesión' }, { status: 500 });
  }
}

// GET simple: reutiliza la lógica del POST pero devuelve redirect a '/'
export async function GET(req: NextRequest) {
  try {
    // Obtener usuario para auditoría antes de eliminar la cookie
    const user = await getServerUser(req);

    if (user) {
      const ipAddress = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown') as string;
      const userAgent = (req.headers.get('user-agent') || 'unknown') as string;
      await AuditLogger.logLogout(user.id as string, ipAddress, userAgent);
    }

    // Determinar flags para el borrado (igual que en POST/login)
    const forwardedProto = req.headers.get('x-forwarded-proto') || req.headers.get('x-forwarded-protocol');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || '';
    const isSecureRequest = !!forwardedProto && forwardedProto.toLowerCase().startsWith('https');
    const appUrlIsHttps = appUrl.toLowerCase().startsWith('https');
    let setSecure = isSecureRequest || appUrlIsHttps;
    const cookieForce = process.env.COOKIE_FORCE_SECURE; // 'true' | 'false' | undefined
    if (cookieForce === 'true' || cookieForce === 'false') {
      setSecure = cookieForce === 'true';
    }

    const canonicalBase = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL;
    const targetUrl = canonicalBase ? new URL('/', canonicalBase) : new URL('/', req.url);
    const redirect = NextResponse.redirect(targetUrl);

    // Establecer directamente el Set-Cookie de borrado en el redirect
    redirect.cookies.set({
      name: 'session',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      sameSite: 'lax',
      secure: Boolean(setSecure),
    });

    return redirect;
  } catch (error) {
    console.error('[LOGOUT_GET_ERROR]', error);
    // Si algo falla, caer al flujo POST y luego redirigir como contingencia
    const res = await POST(req);
    const canonicalBase = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL;
    const targetUrl = canonicalBase ? new URL('/', canonicalBase) : new URL('/', req.url);
    const redirect = NextResponse.redirect(targetUrl);
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
}
