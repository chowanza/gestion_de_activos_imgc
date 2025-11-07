import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
import { requirePermission, requireAnyPermission } from '@/lib/role-middleware';
export const dynamic = 'force-dynamic';

// Listar tipos de equipos, opcionalmente por categoría (COMPUTADORA | DISPOSITIVO)
export async function GET(request: NextRequest) {
  const deny = await requirePermission('canView')(request as any);
  if (deny) return deny;
  try {
    const url = new URL(request.url);
    const categoria = url.searchParams.get('categoria') || undefined;

    const where: any = {};
    if (categoria) where.categoria = categoria;

    const tipos = await prisma.tipoEquipo.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }]
    });

    try {
      const user = await getServerUser(request);
      if (user) {
        await AuditLogger.logNavigation(
          '/api/tipos-equipos',
          `Listado de tipos (${tipos.length})${categoria ? ' - ' + categoria : ''}`,
          (user as any).id
        );
      }
    } catch (auditErr) {
      console.warn('No se pudo registrar auditoría de listado de tipos:', auditErr);
    }

    return NextResponse.json(tipos, { status: 200 });
  } catch (error) {
    console.error('Error al obtener tipos de equipos:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Crear tipo de equipo
export async function POST(request: NextRequest) {
  const deny = await requireAnyPermission(['canCreate','canManageComputadores','canManageDispositivos','canManageEmpresas'])(request as any);
  if (deny) return deny;
  try {
    const user = await getServerUser(request);
    const body = await request.json();
    const { nombre, categoria } = body || {};

    if (!nombre || !categoria) {
      return NextResponse.json(
        { message: 'Nombre y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Evitar duplicados (compuesto por categoria+nombre, case-insensitive manual)
    const existentes = await prisma.tipoEquipo.findMany({ where: { categoria } });
    const yaExiste = existentes.some(t => t.nombre.toLowerCase() === String(nombre).toLowerCase());
    if (yaExiste) {
      return NextResponse.json(
        { message: 'Ya existe un tipo con ese nombre en la categoría seleccionada' },
        { status: 400 }
      );
    }

    const tipo = await prisma.tipoEquipo.create({
      data: { nombre, categoria }
    });

    if (user) {
      await AuditLogger.logCreate(
        'tipoEquipo',
        tipo.id,
        `Creó tipo de equipo: ${categoria}/${nombre}`,
        (user as any).id,
        { nombre, categoria }
      );
    }

    return NextResponse.json(tipo, { status: 201 });
  } catch (error) {
    console.error('Error al crear tipo de equipo:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


