export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { requirePermission } from '@/lib/role-middleware';

export async function GET(request: NextRequest) {
  try {
    // Require manage users permission
    const deny = await requirePermission('canManageUsers')(request as any);
    if (deny) return deny;

    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true }
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require manage users permission
    const deny = await requirePermission('canManageUsers')(request as any);
    if (deny) return deny;

    const body = await request.json();
    const schema = z.object({
      username: z.string().min(1),
      email: z.string().email().optional(),
      password: z.string().min(6),
      role: z.enum(['admin', 'editor', 'user', 'viewer', 'assigner']).optional().default('user')
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Datos inválidos', errors: parsed.error.errors }, { status: 400 });
    }

    const { username, email, password, role } = parsed.data;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : [])
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'El usuario o email ya está registrado' },
        { status: 409 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario con role normalizado
    const newUser = await prisma.user.create({
      data: {
        username,
        email: email || null,
        role: role.toString().toLowerCase(),
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { 
        message: 'Usuario creado exitosamente', 
        user: { 
          id: newUser.id, 
          username: newUser.username,
          role: newUser.role
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[SIGNUP_ERROR]', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

