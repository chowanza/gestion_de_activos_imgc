import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.create({ data: { token, userId: id, expiresAt } });

    // NOTE: Real implementation should send email with the token.
    return NextResponse.json({ message: 'Token creado', token }, { status: 201 });
  } catch (error) {
    console.error('Error creating password reset token', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
