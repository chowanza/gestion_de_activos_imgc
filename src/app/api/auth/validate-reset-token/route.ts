import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: 'Token es requerido' },
        { status: 400 }
      );
    }

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { message: 'Token expirado' },
        { status: 400 }
      );
    }

    // Note: allow tokens for any role. Token creation is restricted to admins elsewhere.

    return NextResponse.json(
      { message: 'Token válido' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error validating reset token:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}