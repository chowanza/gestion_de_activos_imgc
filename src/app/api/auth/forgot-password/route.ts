import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Find user by email and check if they are admin
    // Use findFirst because 'email' may not be declared unique in the Prisma schema
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña' },
        { status: 200 }
      );
    }

    // Check if user is admin (normalize casing)
    const role = (user.role || '').toString().toLowerCase();
    if (role !== 'admin') {
      return NextResponse.json(
        { message: 'Solo los administradores pueden restablecer su contraseña por email' },
        { status: 403 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save reset token
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Send email
    try {
      await emailService.sendPasswordResetEmail(user.email!, resetToken);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json(
      { message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}