import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
import { ESTADOS_EQUIPO } from '@/lib/estados-equipo';
import { requireAnyPermission } from '@/lib/role-middleware';

export async function POST(request: NextRequest) {
  // Permission: must be allowed to assign or manage assignments/equipment
  const deny = await requireAnyPermission(['canAssign','canManageAsignaciones','canManageComputadores','canManageDispositivos'])(request as any);
  if (deny) return deny;

  const user = await getServerUser(request);

  try {
    const { empleadoId, equipoId, tipoEquipo, motivo, ubicacionId } = await request.json();

    if (!empleadoId || !equipoId || !tipoEquipo || !motivo) {
      return NextResponse.json({ message: 'Todos los campos son requeridos' }, { status: 400 });
    }

    if (!['computador', 'dispositivo'].includes(tipoEquipo)) {
      return NextResponse.json({ message: 'Tipo de equipo inválido' }, { status: 400 });
    }

    // Verificar que el empleado existe y obtener su organización
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId },
      include: {
        organizaciones: {
          where: { activo: true },
          include: {
            empresa: true,
            departamento: true,
            cargo: true
          }
        }
      }
    });

    if (!empleado) {
      return NextResponse.json({ message: 'Empleado no encontrado' }, { status: 404 });
    }

    // Verificar que el equipo existe y está disponible
    let equipo;
    if (tipoEquipo === 'computador') {
      // Verificar si ya tiene una asignación activa
      const asignacionExistente = await prisma.asignacionesEquipos.findFirst({
        where: {
          computadorId: equipoId,
          activo: true
        }
      });

      if (asignacionExistente) {
        return NextResponse.json({ message: 'El computador ya está asignado' }, { status: 400 });
      }

      equipo = await prisma.computador.findUnique({
        where: { id: equipoId },
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
      });
    } else {
      // Verificar si ya tiene una asignación activa
      const asignacionExistente = await prisma.asignacionesEquipos.findFirst({
        where: {
          dispositivoId: equipoId,
          activo: true
        }
      });

      if (asignacionExistente) {
        return NextResponse.json({ message: 'El dispositivo ya está asignado' }, { status: 400 });
      }

      equipo = await prisma.dispositivo.findUnique({
        where: { id: equipoId },
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
      });
    }

    if (!equipo) {
      return NextResponse.json({ message: 'Equipo no encontrado' }, { status: 404 });
    }

    if (![ESTADOS_EQUIPO.OPERATIVO, ESTADOS_EQUIPO.EN_MANTENIMIENTO].includes(equipo.estado as any)) {
      return NextResponse.json({ message: 'El equipo no está disponible para asignar' }, { status: 400 });
    }

    // Determinar la ubicación a usar
    let ubicacionFinalId = null;
    
    if (ubicacionId) {
      // Verificar que la ubicación proporcionada existe
      const ubicacionVerificada = await prisma.ubicacion.findUnique({
        where: { id: ubicacionId }
      });
      
      if (ubicacionVerificada) {
        ubicacionFinalId = ubicacionId;
      }
    }
    
    // Si no se proporcionó ubicación o no existe, usar la ubicación por defecto
    if (!ubicacionFinalId) {
      const ubicacionPorDefecto = await prisma.ubicacion.findFirst({
        orderBy: {
          nombre: 'asc'
        }
      });
      ubicacionFinalId = ubicacionPorDefecto?.id || null;
    }

    // Crear la asignación en la tabla AsignacionesEquipos
    const nuevaAsignacion = await prisma.asignacionesEquipos.create({
      data: {
        computadorId: tipoEquipo === 'computador' ? equipoId : null,
        dispositivoId: tipoEquipo === 'dispositivo' ? equipoId : null,
        targetEmpleadoId: empleadoId,
        actionType: 'Assignment',
        targetType: 'Usuario',
        itemType: tipoEquipo === 'computador' ? 'Computador' : 'Dispositivo',
        date: new Date(),
        motivo: motivo,
        ubicacionId: ubicacionFinalId,
        activo: true
      }
    });

    // Actualizar el estado del equipo a ASIGNADO
    let equipoActualizado;
    if (tipoEquipo === 'computador') {
      equipoActualizado = await prisma.computador.update({
        where: { id: equipoId },
        data: {
          estado: ESTADOS_EQUIPO.ASIGNADO,
        },
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
        },
      });
    } else {
      equipoActualizado = await prisma.dispositivo.update({
        where: { id: equipoId },
        data: {
          estado: ESTADOS_EQUIPO.ASIGNADO,
        },
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
        },
      });
    }

    // La asignación ya está registrada en AsignacionesEquipos

    // Log de auditoría
    await AuditLogger.logUpdate(
      tipoEquipo,
      equipoId,
      `${tipoEquipo === 'computador' ? 'Computador' : 'Dispositivo'} asignado a ${empleado.nombre} ${empleado.apellido}`,
      user?.id as string
    );

    return NextResponse.json({
      message: `${tipoEquipo === 'computador' ? 'Computador' : 'Dispositivo'} asignado exitosamente`,
      equipo: equipoActualizado,
    }, { status: 200 });

  } catch (error) {
    console.error('Error al asignar equipo:', error);
    return NextResponse.json({ message: 'Error al asignar equipo' }, { status: 500 });
  }
}
