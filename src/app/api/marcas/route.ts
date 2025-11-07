import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
import { requirePermission, requireAnyPermission } from '@/lib/role-middleware';

export async function GET(request: NextRequest) {
  const deny = await requirePermission('canView')(request as any);
  if (deny) return deny;
  try {
    const user = await getServerUser(request);
    
    const marcas = await prisma.marca.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });
    // Registrar navegación/listado de marcas (una entrada por petición)
    try {
      if (user) {
        await AuditLogger.logNavigation(
          '/api/marcas',
          `Listado de marcas (${marcas.length})`,
          (user as any).id
        );
      }
    } catch (auditErr) {
      console.warn('No se pudo registrar auditoría de listado de marcas:', auditErr);
    }
    return NextResponse.json(marcas, { status: 200 });
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const deny = await requireAnyPermission(['canCreate','canManageEmpresas','canManageComputadores','canManageDispositivos'])(request as any);
  if (deny) return deny;
  try {
    const user = await getServerUser(request);
    const body = await request.json();
    const { nombre } = body;

    if (!nombre) {
      return NextResponse.json(
        { message: 'El nombre de la marca es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una marca con el mismo nombre (case-insensitive)
    const allMarcas = await prisma.marca.findMany();
    
    const existingMarca = allMarcas.find(m => 
      m.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (existingMarca) {
      return NextResponse.json(
        { message: 'Ya existe una marca con ese nombre' },
        { status: 400 }
      );
    }

    const marca = await prisma.marca.create({
      data: {
        nombre
      }
    });

    // Registrar creación
    if (user) {
      await AuditLogger.logCreate(
        'marca',
        marca.id,
        `Usuario ${user.username} creó la marca: ${marca.nombre}`,
        user.id as string,
        { nombre: marca.nombre }
      );
    }

    return NextResponse.json(marca, { status: 201 });
  } catch (error) {
    console.error('Error al crear marca:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}