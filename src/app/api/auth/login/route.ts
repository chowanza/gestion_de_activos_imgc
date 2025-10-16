export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { encrypt } from '@/lib/auth';
import { AuditLogger } from '@/lib/audit-logger';


// Esquema de validación con Zod
const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Datos inválidos', errors: validation.error.errors }, { status: 400 });
    }

    const { username, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }
    
    // Crear el token JWT
    const session = await encrypt({
      sub: user.id,
      role: user.role as 'user' | 'admin',
      username: user.username,
    });

    // Registrar login en auditoría
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    await AuditLogger.logLogin(user.id, ipAddress, userAgent);

  // Crear la respuesta con la cookie de sesión
  const response = NextResponse.json({ message: 'Login exitoso' }, { status: 200 });
  // Add Secure flag only when running in production AND the request is actually HTTPS.
    const forwardedProto = (req.headers.get('x-forwarded-proto') || '').toLowerCase();
    const reqProto = (req as any).nextUrl?.protocol || '';
    const isHttps = forwardedProto === 'https' || String(reqProto).toLowerCase() === 'https:';
    // Also consider NEXT_PUBLIC_URL as a signal (useful when IIS/TLS terminates before proxy)
    const publicUrl = String(process.env.NEXT_PUBLIC_URL || '').toLowerCase();
    const publicUrlIsHttps = publicUrl.startsWith('https://');
    // COOKIE_SECURE env var overrides behavior:
    // - if COOKIE_SECURE === 'true' -> always set Secure
    // - if COOKIE_SECURE === 'false' -> never set Secure
    // - otherwise -> set Secure when NODE_ENV=production and (request is HTTPS or NEXT_PUBLIC_URL is https)
    const cookieSecureEnv = String(process.env.COOKIE_SECURE || '').toLowerCase();
    let secureFlag = '';
    if (cookieSecureEnv === 'true') {
      secureFlag = ' Secure;';
    } else if (cookieSecureEnv === 'false') {
      secureFlag = '';
    } else {
      secureFlag = (process.env.NODE_ENV === 'production' && (isHttps || publicUrlIsHttps)) ? ' Secure;' : '';
    }
    const cookieString = `session=${session}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax;${secureFlag}`;
    if (String(process.env.COOKIE_DEBUG).toLowerCase() === 'true') {
      console.log('[COOKIE_DEBUG] Set-Cookie:', cookieString);
      console.log('[COOKIE_DEBUG] Request headers:', Array.from(req.headers.entries()));
    }
    response.headers.append('Set-Cookie', cookieString);
  return response;

  } catch (error) {
    console.error('[LOGIN_API_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}