import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ubicacion = await prisma.ubicacion.findUnique({
      where: { id },
      include: {
        computadores: {
          include: {
            modelo: {
              include: {
                marca: true
              }
            },
            empleado: {
              include: {
                departamento: {
                  include: {
                    empresa: true
                  }
                }
              }
            }
          }
        },
        dispositivos: {
          include: {
            modelo: {
              include: {
                marca: true
              }
            },
            empleado: {
              include: {
                departamento: {
                  include: {
                    empresa: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            computadores: true,
            dispositivos: true
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
          mode: 'insensitive'
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
    const { id } = await params;

    // Verificar si la ubicación existe
    const ubicacion = await prisma.ubicacion.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            computadores: true,
            dispositivos: true
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

    // Verificar si tiene equipos asignados
    const totalEquipos = ubicacion._count.computadores + ubicacion._count.dispositivos;
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
