import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { encrypt } from '@/lib/auth';


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

    // Crear la respuesta con la cookie de sesión
    const response = NextResponse.json({ message: 'Login exitoso' }, { status: 200 });
    
    // Establecer la cookie de sesión
    response.cookies.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('[LOGIN_API_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}