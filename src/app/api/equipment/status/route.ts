import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { requireAnyPermission } from '@/lib/role-middleware';
import { sanitizeStringOrNull } from '@/lib/sanitize';
import { getServerUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    // Require update/manage permissions for equipment status changes
    const deny = await requireAnyPermission(['canUpdate','canManageComputadores','canManageDispositivos','canManageAsignaciones','canAssign'])(request as any);
    if (deny) return deny;
    const user = await getServerUser(request);
    const body = await request.json();
    const { 
      equipmentId, 
      equipmentType, 
      newStatus, 
      assignmentData 
    } = body;


    if (!equipmentId || !equipmentType || !newStatus) {
      return NextResponse.json(
        { message: 'Faltan parámetros requeridos' }, 
        { status: 400 }
      );
    }

    // Normalizar estado a valores canónicos del sistema
    const normalizeStatus = (status: string) => {
      const s = (status || '').toString().trim().toUpperCase();
      if (['ASIGNADO', 'ASIGNAR'].includes(s)) return 'ASIGNADO';
      if (['OPERATIVO'].includes(s)) return 'OPERATIVO';
      if (['MANTENIMIENTO', 'EN MANTENIMIENTO', 'EN_MANTENIMIENTO'].includes(s)) return 'EN_MANTENIMIENTO';
      if (['RESGUARDO', 'EN RESGUARDO', 'EN_RESGUARDO'].includes(s)) return 'EN_RESGUARDO';
      if (['DE BAJA', 'DE_BAJA'].includes(s)) return 'DE_BAJA';
      return s; // fallback
    };
    const nuevoEstadoCanonico = normalizeStatus(newStatus);

    // Obtener el equipo actual (y su asignación activa si existe)
    const equipment = equipmentType === 'Computador' 
      ? await prisma.computador.findUnique({
          where: { id: equipmentId },
          include: {
            asignaciones: {
              where: { activo: true },
              include: {
                targetEmpleado: {
                  include: {
                    organizaciones: {
                      where: { activo: true },
                      include: {
                        cargo: true,
                        departamento: {
                          include: {
                            empresaDepartamentos: {
                              include: { empresa: true }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                ubicacion: true
              }
            },
            computadorModelos: {
              include: {
                modeloEquipo: {
                  include: {
                    marcaModelos: {
                      include: { marca: true }
                    }
                  }
                }
              }
            }
          }
        })
      : await prisma.dispositivo.findUnique({
          where: { id: equipmentId },
          include: {
            asignaciones: {
              where: { activo: true },
              include: {
                targetEmpleado: {
                  include: {
                    organizaciones: {
                      where: { activo: true },
                      include: {
                        cargo: true,
                        departamento: {
                          include: {
                            empresaDepartamentos: {
                              include: { empresa: true }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                ubicacion: true
              }
            },
            dispositivoModelos: {
              include: {
                modeloEquipo: {
                  include: {
                    marcaModelos: {
                      include: { marca: true }
                    }
                  }
                }
              }
            }
          }
        });

    if (!equipment) {
      return NextResponse.json(
        { message: 'Equipo no encontrado' }, 
        { status: 404 }
      );
    }

    // Validaciones de negocio para estados
    const asignacionActivaActual = equipment.asignaciones?.[0] || null;
    if (nuevoEstadoCanonico === 'ASIGNADO') {
      const targetEmpleadoId = assignmentData?.targetEmpleadoId;
      if (!targetEmpleadoId) {
        return NextResponse.json({ message: 'No se puede asignar sin especificar targetEmpleadoId' }, { status: 400 });
      }
    }

    // Ejecutar actualización en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1) Actualizar estado del equipo (sin tocar relaciones directas)
      const updatedEquipment = equipmentType === 'Computador'
        ? await tx.computador.update({
            where: { id: equipmentId },
            data: { estado: nuevoEstadoCanonico },
            include: {
              asignaciones: {
                where: { activo: true },
                include: {
                  targetEmpleado: {
                    include: {
                      organizaciones: {
                        where: { activo: true },
                        include: {
                          cargo: true,
                          departamento: {
                            include: {
                              empresaDepartamentos: { include: { empresa: true } }
                            }
                          }
                        }
                      }
                    }
                  },
                  ubicacion: true
                }
              },
              computadorModelos: {
                include: {
                  modeloEquipo: { include: { marcaModelos: { include: { marca: true } } } }
                }
              }
            }
          })
        : await tx.dispositivo.update({
            where: { id: equipmentId },
            data: { estado: nuevoEstadoCanonico },
            include: {
              asignaciones: {
                where: { activo: true },
                include: {
                  targetEmpleado: {
                    include: {
                      organizaciones: {
                        where: { activo: true },
                        include: {
                          cargo: true,
                          departamento: {
                            include: {
                              empresaDepartamentos: { include: { empresa: true } }
                            }
                          }
                        }
                      }
                    }
                  },
                  ubicacion: true
                }
              },
              dispositivoModelos: {
                include: {
                  modeloEquipo: { include: { marcaModelos: { include: { marca: true } } } }
                }
              }
            }
          });

      // 2) Manejo de asignaciones activas según el nuevo estado
      const actorId = (user as any)?.id || (user as any)?.sub || null;
      const evidenciaSanitized = sanitizeStringOrNull(assignmentData?.evidenciaFotos);
      const ubicacionId = assignmentData?.ubicacionId || null;
      const motivo = assignmentData?.motivo || `Cambio de estado a ${nuevoEstadoCanonico}`;
      const notas = assignmentData?.notas || null;

      // Helper para crear registro en asignaciones
      const crearRegistro = async (data: {
        actionType: 'ASIGNACION' | 'DEVOLUCION' | 'CAMBIO_ESTADO';
        targetEmpleadoId?: string | null;
        activo: boolean;
      }) => {
        return tx.asignacionesEquipos.create({
          data: {
            date: new Date(),
            actionType: data.actionType,
            targetType: data.targetEmpleadoId ? 'Usuario' : 'SISTEMA',
            targetEmpleadoId: data.targetEmpleadoId ?? null,
            itemType: equipmentType,
            computadorId: equipmentType === 'Computador' ? equipmentId : null,
            dispositivoId: equipmentType === 'Dispositivo' ? equipmentId : null,
            motivo,
            notes: notas,
            evidenciaFotos: evidenciaSanitized,
            gerenteId: actorId,
            ubicacionId,
            activo: data.activo
          }
        });
      };

      // a) Si es un estado NO asignado (OPERATIVO/EN_RESGUARDO/DE_BAJA/EN_MANTENIMIENTO), desactivar asignaciones activas
      const esNoAsignado = ['OPERATIVO','EN_RESGUARDO','DE_BAJA','EN_MANTENIMIENTO'].includes(nuevoEstadoCanonico);
      if (esNoAsignado) {
        if (asignacionActivaActual) {
          await tx.asignacionesEquipos.updateMany({
            where: {
              [equipmentType === 'Computador' ? 'computadorId' : 'dispositivoId']: equipmentId,
              activo: true
            },
            data: { activo: false }
          });

          const actionType = equipment.estado === 'ASIGNADO' ? 'DEVOLUCION' : 'CAMBIO_ESTADO';
          await crearRegistro({
            actionType,
            targetEmpleadoId: asignacionActivaActual.targetEmpleadoId,
            activo: false
          });
        } else {
          // No había asignación activa, solo registrar cambio de estado
          await crearRegistro({ actionType: 'CAMBIO_ESTADO', targetEmpleadoId: null, activo: false });
        }
      }

      // b) Si es ASIGNADO, desactivar previas y crear nueva activa
      if (nuevoEstadoCanonico === 'ASIGNADO') {
        await tx.asignacionesEquipos.updateMany({
          where: {
            [equipmentType === 'Computador' ? 'computadorId' : 'dispositivoId']: equipmentId,
            activo: true
          },
          data: { activo: false }
        });

        await crearRegistro({
          actionType: 'ASIGNACION',
          targetEmpleadoId: assignmentData?.targetEmpleadoId || null,
          activo: true
        });
      }

      // c) Ya cubierto por esNoAsignado: EN_MANTENIMIENTO también desactiva asignaciones

      return { updatedEquipment };
    });

    // Registrar en auditoría
    await AuditLogger.logUpdate(
      equipmentType.toLowerCase(),
      equipmentId,
      `Estado cambiado a ${nuevoEstadoCanonico}`,
      user?.id as string,
      {
        estadoAnterior: equipment.estado,
        estadoNuevo: nuevoEstadoCanonico,
        motivo: assignmentData?.motivo,
        notas: assignmentData?.notas
      }
    );

    return NextResponse.json({
      success: true,
      equipment: result.updatedEquipment
    });

  } catch (error) {
    console.error('Error actualizando estado del equipo:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}


