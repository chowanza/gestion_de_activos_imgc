import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { requirePermission, requireAnyPermission } from '@/lib/role-middleware';

// GET /api/cargos/[id] - Obtener cargo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deny = await requirePermission('canView')(request as any);
    if (deny) return deny;

    const cargo = await prisma.cargo.findUnique({
      where: { id },
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
      }
    });

    if (!cargo) {
      return NextResponse.json(
        { error: 'Cargo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(cargo);
  } catch (error) {
    console.error('Error fetching cargo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/cargos/[id] - Actualizar cargo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deny = await requireAnyPermission(['canUpdate','canManageDepartamentos'])(request as any);
    if (deny) return deny;
    const body = await request.json();
    const { nombre, descripcion } = body;

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const cargo = await prisma.cargo.update({
      where: { id },
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

    // Registrar en auditoría
    await AuditLogger.logUpdate(
      'cargo',
      id,
      `Cargo "${cargo.nombre}" actualizado`,
      undefined // TODO: Obtener userId del token/sesión
    );

    return NextResponse.json(cargo);
  } catch (error: any) {
    console.error('Error updating cargo:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Cargo no encontrado' },
        { status: 404 }
      );
    }
    
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

// DELETE /api/cargos/[id] - Eliminar cargo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deny = await requireAnyPermission(['canDelete','canManageDepartamentos'])(request as any);
    if (deny) return deny;

    // Verificar si el cargo tiene empleados asignados
    const empleadosCount = await prisma.empleadoEmpresaDepartamentoCargo.count({
      where: { cargoId: id }
    });

    if (empleadosCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el cargo porque tiene empleados asignados' },
        { status: 400 }
      );
    }

    // Obtener datos del cargo antes de eliminarlo para auditoría
    const cargo = await prisma.cargo.findUnique({
      where: { id },
      select: { nombre: true }
    });

    await prisma.cargo.delete({
      where: { id }
    });

    // Registrar en auditoría
    await AuditLogger.logDelete(
      'cargo',
      id,
      `Cargo "${cargo?.nombre}" eliminado`,
      undefined // TODO: Obtener userId del token/sesión
    );

    return NextResponse.json({ message: 'Cargo eliminado correctamente' });
  } catch (error: any) {
    console.error('Error deleting cargo:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Cargo no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


