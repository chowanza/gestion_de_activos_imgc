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

  // 3. Elimina la cookie de sesión
    const forwardedProto = (req.headers.get('x-forwarded-proto') || '').toLowerCase();
    const reqProto = (req as any).nextUrl?.protocol || '';
    const isHttps = forwardedProto === 'https' || String(reqProto).toLowerCase() === 'https:';
    const publicUrl = String(process.env.NEXT_PUBLIC_URL || '').toLowerCase();
    const publicUrlIsHttps = publicUrl.startsWith('https://');
    const cookieSecureEnv = String(process.env.COOKIE_SECURE || '').toLowerCase();
    let secureFlag = '';
    if (cookieSecureEnv === 'true') {
      secureFlag = ' Secure;';
    } else if (cookieSecureEnv === 'false') {
      secureFlag = '';
    } else {
      secureFlag = (process.env.NODE_ENV === 'production' && (isHttps || publicUrlIsHttps)) ? ' Secure;' : '';
    }
    const cookieString = `session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;${secureFlag}`;
    if (String(process.env.COOKIE_DEBUG).toLowerCase() === 'true') {
      console.log('[COOKIE_DEBUG] Clear-Cookie:', cookieString);
      console.log('[COOKIE_DEBUG] Request headers:', Array.from(req.headers.entries()));
    }
    response.headers.append('Set-Cookie', cookieString);
    return response;
  } catch (error) {
    console.error('[LOGOUT_ERROR]', error);
    return NextResponse.json(
      { message: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
