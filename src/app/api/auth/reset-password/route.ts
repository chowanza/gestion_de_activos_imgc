import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { AuditLogger } from '@/lib/audit-logger';

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

    // Note: allow resetting password for any role — token creation is already restricted to admins.
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password in a transaction
    await prisma.$transaction([
      // Update password
      prisma.user.update({
        where: { id: resetToken.user.id },
        data: { password: hashedPassword },
      }),
      // Delete any reset tokens for this user
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.user.id },
      }),
    ]);

    // Audit log: password was reset via token (attribute to the user)
    try {
      await AuditLogger.logUpdate('usuario', resetToken.user.id, `Contraseña restablecida mediante token`, resetToken.user.id, { method: 'reset-token' });
    } catch (e) {
      console.warn('Audit log failed for password reset', e);
    }

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