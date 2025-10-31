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
      // Log invalid payload (bad request)
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const ua = req.headers.get('user-agent') || 'unknown';
      await AuditLogger.logLoginFailed('unknown', 'invalid-data', ip, ua);
      return NextResponse.json({ message: 'Datos inválidos', errors: validation.error.errors }, { status: 400 });
    }

    const { username, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const ua = req.headers.get('user-agent') || 'unknown';
      await AuditLogger.logLoginFailed(username, 'user-not-found', ip, ua);
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const ua = req.headers.get('user-agent') || 'unknown';
      await AuditLogger.logLoginFailed(username, 'invalid-password', ip, ua);
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

    // Create the response and set the cookie using NextResponse.cookies API
    const response = NextResponse.json({ message: 'Login exitoso' }, { status: 200 });

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

    console.log('[LOGIN] x-forwarded-proto=', forwardedProto, 'appUrl=', appUrl, 'cookieForce=', cookieForce, 'setSecure=', setSecure);

    // Use NextResponse.cookies.set for correctness across environments
    response.cookies.set({
      name: 'session',
      value: session,
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: Boolean(setSecure),
    });

    return response;

  } catch (error) {
    console.error('[LOGIN_API_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}