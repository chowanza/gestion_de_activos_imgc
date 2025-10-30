export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getUserIdFromRequest } from '@/lib/role-middleware';
import { AuditLogger } from '@/lib/audit-logger';

export async function GET(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    const deny = await requirePermission('canManageUsers')(request as any);
    if (deny) return deny;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'user no encontrado' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipo' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];

    const deny = await requirePermission('canManageUsers')(request as any);
    if (deny) return deny;

    const body = await request.json();
    // Validate allowed fields and hash password if present
    const { z } = await import('zod');
    const schema = z.object({
      username: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.enum(['admin','editor','viewer']).optional(),
      password: z.string().min(6).optional()
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Datos inválidos', errors: parsed.error.errors }, { status: 400 });
    }

    const updateData: any = {};
    if (parsed.data.username) updateData.username = parsed.data.username;
    if (parsed.data.email) updateData.email = parsed.data.email;
    if (parsed.data.role) updateData.role = parsed.data.role.toString().toLowerCase();
    if (parsed.data.password) {
      const bcrypt = await import('bcrypt');
      updateData.password = await bcrypt.hash(parsed.data.password, 10);
    }

    const updatedUser = await prisma.user.update({ where: { id }, data: updateData });
    // Audit log: if password was changed, log that an admin updated the password (do NOT store the password)
    if (parsed.data.password) {
      try {
        const requesterId = await getUserIdFromRequest(request as any);
        await AuditLogger.logUpdate('usuario', id, `Contraseña actualizada por admin (${requesterId})`, requesterId || undefined, { changedPassword: true });
      } catch (e) {
        console.warn('Audit log failed for password update', e);
      }
    }
    // Return non-sensitive representation
    const safeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role
    };
    return NextResponse.json(safeUser, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar equipo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];

    const deny = await requirePermission('canManageUsers')(request as any);
    if (deny) return deny;

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: 'user eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar user' }, { status: 500 });
  }
}
