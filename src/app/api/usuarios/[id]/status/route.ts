import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/')[3];
    const body = await request.json();
    const { accion, fecha, motivo } = body; // accion: 'activar' | 'desactivar'

    // Obtener usuario de la sesión
    const user = await getServerUser(request);

    // Verificar que el empleado existe
    const empleado = await prisma.empleado.findUnique({
      where: { id }
    });

    if (!empleado) {
      return NextResponse.json({ message: 'Empleado no encontrado' }, { status: 404 });
    }

    // Preparar datos para actualización
    const updateData: any = {};
    
    if (accion === 'desactivar') {
      updateData.fechaDesincorporacion = fecha;
    } else if (accion === 'activar') {
      updateData.fechaDesincorporacion = null; // Limpiar fecha de desincorporación
    }

    // Actualizar empleado y crear registro de historial en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar empleado
      const updatedEmpleado = await tx.empleado.update({
        where: { id },
        data: updateData,
        include: {
          departamento: {
            include: {
              empresa: true
            }
          },
          cargo: true,
          computadores: {
            include: {
              modelo: {
                include: {
                  marca: true
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
              }
            }
          }
        }
      });

      // Crear registro en historial
      await tx.empleadoStatusHistory.create({
        data: {
          empleadoId: id,
          accion,
          fecha,
          motivo: motivo || null
        }
      });

      return updatedEmpleado;
    });

    // Agregar estado calculado
    const empleadoConEstado = {
      ...result,
      estado: result.fechaDesincorporacion ? 'Inactivo' : 'Activo',
      fotoPerfil: result.fotoPerfil,
    };

    return NextResponse.json(empleadoConEstado, { status: 200 });

  } catch (error) {
    console.error('Error al cambiar estado del empleado:', error);
    return NextResponse.json(
      { message: 'Error al cambiar estado del empleado' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/')[3];

    // Obtener historial de cambios de estado
    const historial = await prisma.empleadoStatusHistory.findMany({
      where: { empleadoId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(historial, { status: 200 });

  } catch (error) {
    console.error('Error al obtener historial de estado:', error);
    return NextResponse.json(
      { message: 'Error al obtener historial de estado' },
      { status: 500 }
    );
  }
}
