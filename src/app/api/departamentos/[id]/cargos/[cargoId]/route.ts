import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerUser } from '@/lib/auth-server';
import { AuditLogger } from '@/lib/audit-logger';
import { requirePermission } from '@/lib/role-middleware';

// PUT - Actualizar un cargo específico
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cargoId: string }> }
) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: departamentoId, cargoId } = await params;
    const body = await request.json();
    const { nombre, descripcion } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { message: 'El nombre del cargo es obligatorio' },
        { status: 400 }
      );
    }

    // Verificar que el cargo existe y pertenece al departamento
    const cargoExistente = await prisma.cargo.findFirst({
      where: {
        id: cargoId,
        departamentoCargos: {
          some: {
            departamentoId
          }
        }
      },
      include: {
        departamentoCargos: {
          include: {
            departamento: true
          }
        }
      }
    });

    if (!cargoExistente) {
      return NextResponse.json(
        { message: 'Cargo no encontrado en este departamento' },
        { status: 404 }
      );
    }

    // Verificar si ya existe otro cargo con el mismo nombre en este departamento
    const cargoConMismoNombre = await prisma.cargo.findFirst({
      where: {
        id: { not: cargoId },
        nombre: nombre.trim(),
        departamentoCargos: {
          some: {
            departamentoId
          }
        }
      }
    });

    if (cargoConMismoNombre) {
      return NextResponse.json(
        { message: 'Ya existe otro cargo con este nombre en el departamento' },
        { status: 400 }
      );
    }

    // Obtener datos anteriores para auditoría
    const datosAnteriores = {
      nombre: cargoExistente.nombre,
      descripcion: cargoExistente.descripcion
    };

    // Actualizar el cargo
    const cargoActualizado = await prisma.cargo.update({
      where: { id: cargoId },
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null
      }
    });

    // Log de auditoría
    await AuditLogger.logUpdate(
      'Cargo',
      cargoId,
      `Cargo "${datosAnteriores.nombre}" actualizado en departamento "${cargoExistente.departamentoCargos[0]?.departamento.nombre}"`,
      user.id as string,
      { 
        datosAnteriores,
        datosNuevos: {
          nombre: cargoActualizado.nombre,
          descripcion: cargoActualizado.descripcion
        },
        departamentoId,
        departamentoNombre: cargoExistente.departamentoCargos[0]?.departamento.nombre
      }
    );

    return NextResponse.json({
      message: 'Cargo actualizado exitosamente',
      cargo: cargoActualizado
    });

  } catch (error) {
    console.error('Error al actualizar cargo:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un cargo específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cargoId: string }> }
) {
  try {
    const deny = await requirePermission('canDelete')(request as any);
    if (deny) return deny;
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: departamentoId, cargoId } = await params;

    // Verificar que el cargo existe y pertenece al departamento
    const cargoExistente = await prisma.cargo.findFirst({
      where: {
        id: cargoId,
        departamentoCargos: {
          some: {
            departamentoId
          }
        }
      },
      include: {
        departamentoCargos: {
          include: {
            departamento: true
          }
        },
        empleadoOrganizaciones: {
          where: {
            activo: true
          }
        }
      }
    });

    if (!cargoExistente) {
      return NextResponse.json(
        { message: 'Cargo no encontrado en este departamento' },
        { status: 404 }
      );
    }

    // Verificar si hay empleados activos con este cargo
    if (cargoExistente.empleadoOrganizaciones.length > 0) {
      return NextResponse.json(
        { message: 'No se puede eliminar el cargo porque hay empleados activos asignados a él' },
        { status: 400 }
      );
    }

    // Eliminar el cargo y la relación con el departamento
    await prisma.$transaction(async (tx) => {
      // Eliminar la relación departamento-cargo
      await tx.departamentoCargo.deleteMany({
        where: {
          departamentoId,
          cargoId
        }
      });

      // Eliminar el cargo
      await tx.cargo.delete({
        where: { id: cargoId }
      });
    });

    // Log de auditoría
    await AuditLogger.logDelete(
      'Cargo',
      cargoId,
      `Cargo "${cargoExistente.nombre}" eliminado del departamento "${cargoExistente.departamentoCargos[0]?.departamento.nombre}"`,
      user.id as string,
      { 
        nombre: cargoExistente.nombre,
        descripcion: cargoExistente.descripcion,
        departamentoId,
        departamentoNombre: cargoExistente.departamentoCargos[0]?.departamento.nombre
      }
    );

    return NextResponse.json({
      message: 'Cargo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar cargo:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

