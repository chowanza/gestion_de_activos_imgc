export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/role-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require view permission for ubicacion details
  const checkView = await requirePermission('canView')(request);
  if (checkView instanceof NextResponse) return checkView;

  try {
    const { id } = await params;

    const ubicacion = await prisma.ubicacion.findUnique({
      where: { id },
      include: {
        asignacionesEquipos: {
          include: {
            computador: {
              include: {
                computadorModelos: {
                  include: {
                    modeloEquipo: {
                      include: {
                        marcaModelos: {
                          include: {
                            marca: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            dispositivo: {
              include: {
                dispositivoModelos: {
                  include: {
                    modeloEquipo: {
                      include: {
                        marcaModelos: {
                          include: {
                            marca: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            targetEmpleado: {
              include: {
                organizaciones: {
                  where: {
                    activo: true
                  },
                  include: {
                    departamento: true,
                    empresa: true
                  }
                }
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!ubicacion) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(ubicacion);
  } catch (error) {
    console.error('Error fetching ubicacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require permission to manage departamentos/ubicaciones
    const check = await requirePermission('canManageDepartamentos')(request);
    if (check instanceof NextResponse) return check;

    const { id } = await params;
    const body = await request.json();
    const { nombre, descripcion, direccion, piso, sala } = body;

    // Validaciones
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Verificar si la ubicación existe
    const existingUbicacion = await prisma.ubicacion.findUnique({
      where: { id }
    });

    if (!existingUbicacion) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si ya existe otra ubicación con el mismo nombre
    const duplicateUbicacion = await prisma.ubicacion.findFirst({
      where: {
        nombre: {
          equals: nombre.trim(),
        },
        id: {
          not: id
        }
      }
    });

    if (duplicateUbicacion) {
      return NextResponse.json(
        { error: 'Ya existe otra ubicación con este nombre' },
        { status: 400 }
      );
    }

    const ubicacion = await prisma.ubicacion.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        direccion: direccion?.trim() || null,
        piso: piso?.trim() || null,
        sala: sala?.trim() || null
      }
    });

    return NextResponse.json(ubicacion);
  } catch (error) {
    console.error('Error updating ubicacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require permission to manage departamentos/ubicaciones
    const check = await requirePermission('canManageDepartamentos')(request);
    if (check instanceof NextResponse) return check;

    const { id } = await params;

    // Verificar si la ubicación existe
    const ubicacion = await prisma.ubicacion.findUnique({
      where: { id },
      include: {
        asignacionesEquipos: {
          where: { activo: true }
        }
      }
    });

    if (!ubicacion) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si tiene equipos asignados
    const totalEquipos = ubicacion.asignacionesEquipos.length;
    if (totalEquipos > 0) {
      return NextResponse.json(
        { 
          error: `No se puede eliminar la ubicación porque tiene ${totalEquipos} equipo(s) asignado(s). Primero reasigne o elimine los equipos.` 
        },
        { status: 400 }
      );
    }

    await prisma.ubicacion.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Ubicación eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting ubicacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
