import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getUserIdFromRequest } from '@/lib/role-middleware';
import { randomBytes } from 'crypto';
import { AuditLogger } from '@/lib/audit-logger';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Only admin users may create password reset tokens for others (policy: admin -> can reset viewer/editor)
    const requesterId = await getUserIdFromRequest(request as any);
    if (!requesterId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    const requester = await prisma.user.findUnique({ where: { id: requesterId }, select: { role: true } });
    if (!requester) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    if ((requester.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }
    const id = request.nextUrl.pathname.split('/')[3];

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });

    // Only allow admin to create reset tokens for viewer or editor roles
    const targetRole = (user.role || '').toLowerCase();
    if (!['viewer', 'editor'].includes(targetRole)) {
      return NextResponse.json({ error: 'Solo se permiten recuperaciones de contraseña para roles viewer o editor' }, { status: 403 });
    }

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.create({ data: { token, userId: id, expiresAt } });

    // Audit log: admin requested password recovery for a user
    try {
      await AuditLogger.logUpdate('usuario', id, `Token de recuperación de contraseña creado por admin (${requesterId})`, requesterId, {
        targetRole: user.role
      });
    } catch (e) {
      // don't fail the operation if audit logging fails
      console.warn('Audit log failed for password reset creation', e);
    }

    // Try to send email if SMTP is configured and user has an email
    let emailSent = false;
    if (user.email && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await emailService.sendPasswordResetEmail(user.email, token);
        emailSent = true;
      } catch (e) {
        console.warn('Failed to send password reset email, token will be returned to caller', e);
      }
    }

    // If email was sent, don't return the token in the response. Otherwise include it so admin
    // can copy it manually (useful in environments without SMTP configured).
    const emailPresent = Boolean(user.email);
    if (emailSent) {
      return NextResponse.json({ message: 'Token creado y enviado por correo', emailPresent }, { status: 201 });
    }

    return NextResponse.json({ message: 'Token creado', token, emailPresent }, { status: 201 });
  } catch (error) {
    console.error('Error creating password reset token', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
