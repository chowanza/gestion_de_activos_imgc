import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const ubicaciones = await prisma.ubicacion.findMany({
      include: {
        _count: {
          select: {
            computadores: true,
            dispositivos: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(ubicaciones);
  } catch (error) {
    console.error('Error fetching ubicaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion, direccion, piso, sala } = body;

    // Validaciones
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una ubicación con el mismo nombre
    const existingUbicacion = await prisma.ubicacion.findFirst({
      where: {
        nombre: {
          equals: nombre.trim(),
        }
      }
    });

    if (existingUbicacion) {
      return NextResponse.json(
        { error: 'Ya existe una ubicación con este nombre' },
        { status: 400 }
      );
    }

    const ubicacion = await prisma.ubicacion.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        direccion: direccion?.trim() || null,
        piso: piso?.trim() || null,
        sala: sala?.trim() || null
      }
    });

    return NextResponse.json(ubicacion, { status: 201 });
  } catch (error) {
    console.error('Error creating ubicacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
