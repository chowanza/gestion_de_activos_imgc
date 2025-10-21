import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 6 caracteres' },
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

    // Check if user is still admin
    if (resetToken.user.role !== 'Admin') {
      return NextResponse.json(
        { message: 'Usuario no autorizado' },
        { status: 403 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password in a transaction
    await prisma.$transaction([
      // Update password
      prisma.user.update({
        where: { id: resetToken.user.id },
        data: { password: hashedPassword },
      }),
      // Delete used token
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
      // Delete any other reset tokens for this user
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.user.id },
      }),
    ]);

    return NextResponse.json(
      { message: 'Contraseña restablecida exitosamente' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}