import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const ubicaciones = await prisma.ubicacion.findMany({
      include: {
        asignacionesEquipos: {
          where: {
            activo: true
          },
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