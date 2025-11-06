export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
import { requireAnyPermission, requirePermission } from '@/lib/role-middleware';

// Obtener todos los tipos únicos de equipos
export async function GET(request: NextRequest) {
  try {
    const deny = await requirePermission('canView')(request as any);
    if (deny) return deny;

    const { searchParams } = new URL(request.url);
    const categoria = (searchParams.get('categoria') || '').toUpperCase();

    // Si existe el cliente para TipoEquipo, usarlo; si no, fallback a modelos
    const clientAny = prisma as any;
    if (clientAny.tipoEquipo) {
      const where: any = {};
      if (categoria === 'COMPUTADORA' || categoria === 'DISPOSITIVO') {
        where.categoria = categoria;
      }
      const tiposDb = await clientAny.tipoEquipo.findMany({ where, orderBy: { nombre: 'asc' } });
      if (tiposDb && tiposDb.length > 0) {
        const list = (tiposDb as Array<{ nombre: string }>).map(t => t.nombre);
        return NextResponse.json(list, { status: 200 });
      }
    }

    // Fallback: si la tabla está vacía, devolver los distintos de modelos (compatibilidad)
    const tiposModelos = await prisma.modeloEquipo.findMany({
      select: { tipo: true },
      distinct: ['tipo']
    });
    return NextResponse.json(tiposModelos.map(t => t.tipo).sort(), { status: 200 });
  } catch (error) {
    console.error('Error al obtener tipos de equipos:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Agregar un nuevo tipo de equipo (actualizando un modelo existente o creando uno nuevo)
export async function POST(request: NextRequest) {
  try {
    // Require create or manage equipment permissions to add tipos
  const deny = await requireAnyPermission(['canCreate','canManageComputadores','canManageDispositivos'])(request as any);
    if (deny) return deny;

    const user = await getServerUser(request);
    const body = await request.json();
    const nombre = (body.nombre || body.tipo || '').trim();
    const categoria = (body.categoria || '').toUpperCase();

    if (!nombre) {
      return NextResponse.json({ message: 'El nombre del tipo es requerido' }, { status: 400 });
    }
    if (categoria !== 'COMPUTADORA' && categoria !== 'DISPOSITIVO') {
      return NextResponse.json({ message: 'Categoría inválida' }, { status: 400 });
    }

    const clientAny = prisma as any;
    if (clientAny.tipoEquipo) {
      // Unicidad por categoría
      const exists = await clientAny.tipoEquipo.findFirst({ where: { nombre, categoria } });
      if (exists) {
        return NextResponse.json({ message: 'Ya existe un tipo con ese nombre en la categoría seleccionada' }, { status: 400 });
      }
      const tipo = await clientAny.tipoEquipo.create({ data: { nombre, categoria } });
      if (user) {
        await AuditLogger.logCreate('tipo-equipo', tipo.id, `Creó tipo "${nombre}" (${categoria})`, user.id as string, { nombre, categoria });
      }
      return NextResponse.json({ id: tipo.id, nombre: tipo.nombre, categoria: tipo.categoria }, { status: 201 });
    }

    // Fallback robusto: si el cliente no expone TipoEquipo aún, usar SQL crudo (SQL Server)
    const existing: Array<{ count: number }> = await prisma.$queryRaw(
      Prisma.sql`SELECT COUNT(1) AS count FROM [dbo].[TipoEquipo] WHERE [nombre] = ${nombre} AND [categoria] = ${categoria}`
    );
    if (existing?.[0]?.count > 0) {
      return NextResponse.json({ message: 'Ya existe un tipo con ese nombre en la categoría seleccionada' }, { status: 400 });
    }
    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO [dbo].[TipoEquipo] ([nombre],[categoria],[activo],[createdAt],[updatedAt]) VALUES (${nombre}, ${categoria}, 1, GETDATE(), GETDATE())`
    );
    if (user) {
      await AuditLogger.logCreate('tipo-equipo', 'raw-sql', `Creó tipo "${nombre}" (${categoria}) [fallback SQL]`, user.id as string, { nombre, categoria });
    }
    return NextResponse.json({ nombre, categoria }, { status: 201 });
  } catch (error) {
    console.error('Error al crear tipo de equipo:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}




