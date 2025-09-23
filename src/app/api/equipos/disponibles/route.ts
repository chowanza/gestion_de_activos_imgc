import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ESTADOS_EQUIPO } from '@/lib/estados-equipo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'computador' o 'dispositivo'

    if (!tipo || !['computador', 'dispositivo'].includes(tipo)) {
      return NextResponse.json({ message: 'Tipo de equipo requerido (computador o dispositivo)' }, { status: 400 });
    }

    let equipos;

    if (tipo === 'computador') {
      equipos = await prisma.computador.findMany({
        where: {
          estado: {
            in: [ESTADOS_EQUIPO.OPERATIVO, ESTADOS_EQUIPO.EN_MANTENIMIENTO]
          },
          empleadoId: null, // No asignado a ningún empleado
        },
        include: {
          modelo: {
            include: {
              marca: true,
            },
          },
        },
        orderBy: {
          modelo: {
            marca: {
              nombre: 'asc',
            },
          },
        },
      });
    } else {
      equipos = await prisma.dispositivo.findMany({
        where: {
          estado: {
            in: [ESTADOS_EQUIPO.OPERATIVO, ESTADOS_EQUIPO.EN_MANTENIMIENTO]
          },
          empleadoId: null, // No asignado a ningún empleado
        },
        include: {
          modelo: {
            include: {
              marca: true,
            },
          },
        },
        orderBy: {
          modelo: {
            marca: {
              nombre: 'asc',
            },
          },
        },
      });
    }

    return NextResponse.json(equipos, { status: 200 });
  } catch (error) {
    console.error('Error al obtener equipos disponibles:', error);
    return NextResponse.json({ message: 'Error al obtener equipos disponibles' }, { status: 500 });
  }
}
