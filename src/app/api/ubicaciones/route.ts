export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

export async function GET() {
  try {
    const ubicaciones = await prisma.ubicacion.findMany({
      include: {
        asignacionesEquipos: {
          include: {
            computador: {
              select: {
                id: true
              }
            },
            dispositivo: {
              select: {
                id: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        },
        _count: {
          select: {
            asignacionesEquipos: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(ubicaciones);
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    return NextResponse.json({ message: 'Error al obtener ubicaciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    
    if (!user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, descripcion, direccion, piso, sala } = body;

    // Validar campos requeridos
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json({ message: 'El nombre es requerido' }, { status: 400 });
    }

    // Verificar si ya existe una ubicación con el mismo nombre
    const ubicacionExistente = await prisma.ubicacion.findFirst({
      where: {
        nombre: nombre.trim()
      }
    });

    if (ubicacionExistente) {
      return NextResponse.json({ message: 'Ya existe una ubicación con ese nombre' }, { status: 409 });
    }

    // Crear la nueva ubicación
    const nuevaUbicacion = await prisma.ubicacion.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        direccion: direccion?.trim() || null,
        piso: piso?.trim() || null,
        sala: sala?.trim() || null
      }
    });

    // Registrar en auditoría
    await AuditLogger.logCreate(
      'ubicacion',
      nuevaUbicacion.id,
      `Ubicación "${nombre}" creada`,
      user.id as string,
      {
        ubicacionCreada: {
          nombre: nuevaUbicacion.nombre,
          descripcion: nuevaUbicacion.descripcion,
          direccion: nuevaUbicacion.direccion,
          piso: nuevaUbicacion.piso,
          sala: nuevaUbicacion.sala
        }
      }
    );

    return NextResponse.json(nuevaUbicacion, { status: 201 });

  } catch (error) {
    console.error('Error al crear ubicación:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}