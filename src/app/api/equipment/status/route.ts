import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
  try {
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

    // Obtener el equipo actual
    const equipment = equipmentType === 'Computador' 
      ? await prisma.computador.findUnique({
          where: { id: equipmentId },
        include: {
          empleado: {
            include: {
              departamento: {
                include: {
                  empresa: true
                }
              }
            }
          },
          modelo: { include: { marca: true } }
        }
        })
      : await prisma.dispositivo.findUnique({
          where: { id: equipmentId },
        include: {
          empleado: {
            include: {
              departamento: {
                include: {
                  empresa: true
                }
              }
            }
          },
          modelo: { include: { marca: true } }
        }
        });

    if (!equipment) {
      return NextResponse.json(
        { message: 'Equipo no encontrado' }, 
        { status: 404 }
      );
    }

    // Preparar datos para actualización
    const updateData: any = {
      estado: newStatus
    };

    // Actualizar relaciones según el nuevo estado
    if (newStatus === 'Asignado') {
      if (assignmentData.targetType === 'Usuario') {
        updateData.empleadoId = assignmentData.targetEmpleadoId;
        updateData.departamentoId = null;
      } else if (assignmentData.targetType === 'Departamento') {
        updateData.departamentoId = assignmentData.targetDepartamentoId;
        updateData.empleadoId = null;
      }
    } else if (newStatus === 'Mantenimiento') {
      // Mantener la asignación actual pero cambiar estado
      // No modificar empleadoId ni departamentoId
    } else if (newStatus === 'Resguardo') {
      // Desasignar del empleado/departamento
      updateData.empleadoId = null;
      updateData.departamentoId = null;
    }

    // Actualizar ubicación si se proporciona
    if (assignmentData.ubicacionId) {
      updateData.ubicacionId = assignmentData.ubicacionId;
    }

    // Ejecutar actualización en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar el equipo
      const updatedEquipment = equipmentType === 'Computador'
        ? await tx.computador.update({
            where: { id: equipmentId },
            data: updateData,
            include: {
              empleado: {
                include: {
                  departamento: {
                    include: { empresa: true }
                  }
                }
              },
              ubicacion: true,
              modelo: { include: { marca: true } }
            }
          })
        : await tx.dispositivo.update({
            where: { id: equipmentId },
            data: updateData,
            include: {
              empleado: {
                include: {
                  departamento: {
                    include: { empresa: true }
                  }
                }
              },
              ubicacion: true,
              modelo: { include: { marca: true } }
            }
          });

      // Crear registro en el historial de asignaciones
      const assignmentRecord = await tx.asignacionesEquipos.create({
        data: {
          actionType: assignmentData.actionType,
          motivo: assignmentData.motivo,
          notes: assignmentData.notas,
          evidenciaFotos: assignmentData.evidenciaFotos, // Agregar evidencia fotográfica
          ubicacionId: assignmentData.ubicacionId,
          gerenteId: assignmentData.gerenteId,
          targetType: assignmentData.targetType || 'Sistema',
          targetEmpleadoId: assignmentData.targetEmpleadoId,
          itemType: equipmentType,
          computadorId: equipmentType === 'Computador' ? equipmentId : null,
          dispositivoId: equipmentType === 'Dispositivo' ? equipmentId : null
        }
      });


      return { updatedEquipment, assignmentRecord };
    });

    // Registrar en auditoría
    await AuditLogger.logUpdate(
      equipmentType.toLowerCase(),
      equipmentId,
      `Estado cambiado a ${newStatus}`,
      undefined, // TODO: Obtener userId del token/sesión
      {
        estadoAnterior: equipment.estado,
        estadoNuevo: newStatus,
        motivo: assignmentData.motivo,
        notas: assignmentData.notas
      }
    );

    return NextResponse.json({
      success: true,
      equipment: result.updatedEquipment,
      assignment: result.assignmentRecord
    });

  } catch (error) {
    console.error('Error actualizando estado del equipo:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}


