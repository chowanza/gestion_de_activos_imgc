import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth-server';

export async function POST() {
  try {
    // 1. Elimina la sesión (set-cookie con max-age=0 o expires pasado)
    await deleteSession();

    // 2. Devuelve respuesta JSON con cookie eliminada
    const response = NextResponse.json(
      { message: 'Logout exitoso' },
      { status: 200 }
    );

    // 3. Elimina la cookie de sesión
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expira inmediatamente
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[LOGOUT_ERROR]', error);
    return NextResponse.json(
      { message: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
