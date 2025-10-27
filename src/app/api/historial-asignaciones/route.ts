import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
import { requirePermission } from '@/lib/role-middleware';

export async function GET(request: NextRequest) {
  try {
    const deny = await requirePermission('canView')(request as any);
    if (deny) return deny;
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
    const historial = await prisma.asignacionesEquipos.findMany({
      where: {
        targetEmpleadoId: empleadoId,
      },
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
        gerenteEmpleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
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
        const computadorModelo = asignacion.computador.computadorModelos[0];
        itemInfo = {
          id: asignacion.computador.id,
          serial: asignacion.computador.serial,
          modelo: computadorModelo?.modeloEquipo?.nombre || 'Sin modelo',
          marca: computadorModelo?.modeloEquipo?.marcaModelos[0]?.marca?.nombre || 'Sin marca',
          tipo: 'Computador'
        };
        itemType = 'Computador';
      } else if (asignacion.dispositivo) {
        const dispositivoModelo = asignacion.dispositivo.dispositivoModelos[0];
        itemInfo = {
          id: asignacion.dispositivo.id,
          serial: asignacion.dispositivo.serial,
          modelo: dispositivoModelo?.modeloEquipo?.nombre || 'Sin modelo',
          marca: dispositivoModelo?.modeloEquipo?.marcaModelos[0]?.marca?.nombre || 'Sin marca',
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
          : 'Sin gerente',
        localidad: asignacion.ubicacionId || 'Sin ubicación',
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