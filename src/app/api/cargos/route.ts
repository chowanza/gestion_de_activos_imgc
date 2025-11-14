import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
import { requirePermission, requireAnyPermission } from '@/lib/role-middleware';

// GET /api/cargos - Obtener todos los cargos
export async function GET(request: NextRequest) {
  const deny = await requirePermission('canView')(request as any);
  if (deny) return deny;
  try {
    const { searchParams } = new URL(request.url);
    const departamentoId = searchParams.get('departamentoId');

    const where = departamentoId ? { 
      departamentoCargos: {
        some: {
          departamentoId
        }
      }
    } : {};

    const cargos = await prisma.cargo.findMany({
      where,
      include: {
        departamentoCargos: {
          include: {
            departamento: true
          }
        },
        empleadoOrganizaciones: {
          include: {
            empleado: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(cargos, { status: 200 });
  } catch (error) {
    console.error('Error fetching cargos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/cargos - Crear nuevo cargo
export async function POST(request: NextRequest) {
  try {
    const deny = await requireAnyPermission(['canCreate','canManageDepartamentos'])(request as any);
    if (deny) return deny;

    const user = await getServerUser(request as any);
    const body = await request.json();
    const { nombre, descripcion, departamentoId } = body;

    if (!nombre || !departamentoId) {
      return NextResponse.json(
        { error: 'El nombre y departamento son requeridos' },
        { status: 400 }
      );
    }

    const cargo = await prisma.cargo.create({
      data: {
        nombre,
        descripcion: descripcion || null
      },
      include: {
        departamentoCargos: {
          include: {
            departamento: true
          }
        }
      }
    });

    // Crear la relación con el departamento si se proporciona
    if (departamentoId) {
      await prisma.departamentoCargo.create({
        data: {
          departamentoId,
          cargoId: cargo.id
        }
      });
    }

    // Registrar en auditoría
    await AuditLogger.logCreate(
      'cargo',
      cargo.id,
      `Cargo "${cargo.nombre}" creado`,
      (user as any)?.id || 'system'
    );

    return NextResponse.json(cargo, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cargo:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un cargo con este nombre en el departamento' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

