import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    const { searchParams } = new URL(request.url);
    const empleadoId = searchParams.get('empleadoId');

    if (!empleadoId) {
      return NextResponse.json(
        { message: 'ID de empleado es requerido' },
        { status: 400 }
      );
    }

    // Obtener historial de asignaciones del empleado
    const historial = await prisma.asignaciones.findMany({
      where: {
        targetEmpleadoId: empleadoId,
      },
      include: {
        computador: {
          include: {
            modelo: {
              include: {
                marca: true
              }
            }
          }
        },
        dispositivo: {
          include: {
            modelo: {
              include: {
                marca: true
              }
            }
          }
        },
        gerenteEmpleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        ubicacion: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Formatear los datos para el frontend
    const historialFormateado = historial.map(asignacion => {
      let itemInfo = null;
      let itemType = 'Desconocido';

      if (asignacion.computador) {
        itemInfo = {
          id: asignacion.computador.id,
          serial: asignacion.computador.serial,
          modelo: asignacion.computador.modelo.nombre,
          marca: asignacion.computador.modelo.marca.nombre,
          tipo: 'Computador'
        };
        itemType = 'Computador';
      } else if (asignacion.dispositivo) {
        itemInfo = {
          id: asignacion.dispositivo.id,
          serial: asignacion.dispositivo.serial,
          modelo: asignacion.dispositivo.modelo.nombre,
          marca: asignacion.dispositivo.modelo.marca.nombre,
          tipo: 'Dispositivo'
        };
        itemType = 'Dispositivo';
      }

      return {
        id: asignacion.id,
        fecha: asignacion.date,
        accion: asignacion.actionType,
        motivo: asignacion.motivo,
        notas: asignacion.notes,
        gerente: asignacion.gerenteEmpleado 
          ? `${asignacion.gerenteEmpleado.nombre} ${asignacion.gerenteEmpleado.apellido}`
          : asignacion.gerente,
        localidad: asignacion.ubicacion?.nombre || null,
        item: itemInfo,
        itemType: itemType,
        createdAt: asignacion.createdAt,
        updatedAt: asignacion.updatedAt
      };
    });

    // Registrar acceso al historial
    if (user) {
      await AuditLogger.logView(
        'historial-asignaciones',
        empleadoId,
        `Usuario ${user.username} accedió al historial de asignaciones del empleado ${empleadoId}`,
        user.id as string
      );
    }

    return NextResponse.json(historialFormateado, { status: 200 });
  } catch (error) {
    console.error('Error al obtener historial de asignaciones:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}