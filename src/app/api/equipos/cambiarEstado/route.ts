import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
import { TODOS_ESTADOS, esEstadoValido, requiereEmpleado } from '@/lib/estados-equipo';

export async function POST(request: NextRequest) {
  const user = await getServerUser(request);

  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { equipoId, tipoEquipo, nuevoEstado, motivo, targetEmpleadoId, ubicacionId } = body;

    if (!equipoId || !tipoEquipo || !nuevoEstado || !motivo) {
      console.log('Missing required fields:', { equipoId, tipoEquipo, nuevoEstado, motivo });
      return NextResponse.json({ 
        message: 'Todos los campos son requeridos',
        received: { equipoId, tipoEquipo, nuevoEstado, motivo }
      }, { status: 400 });
    }

    if (!['computador', 'dispositivo'].includes(tipoEquipo)) {
      return NextResponse.json({ message: 'Tipo de equipo inválido' }, { status: 400 });
    }

    if (!esEstadoValido(nuevoEstado)) {
      return NextResponse.json({ message: 'Estado inválido' }, { status: 400 });
    }

    // Verificar que el equipo existe
    console.log(`Buscando ${tipoEquipo} con ID: ${equipoId}`);
    let equipo;
    if (tipoEquipo === 'computador') {
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
          },
          asignaciones: {
            where: { activo: true },
            include: {
              targetEmpleado: true
            }
          }
        },
      });
    } else {
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
          },
          asignaciones: {
            where: { activo: true },
            include: {
              targetEmpleado: true
            }
          }
        },
      });
    }
    
    console.log('Equipo encontrado:', equipo ? 'Sí' : 'No');
    if (equipo) {
      console.log('Estado actual:', equipo.estado);
      console.log('Asignaciones activas:', equipo.asignaciones?.length || 0);
    }

    if (!equipo) {
      return NextResponse.json({ message: 'Equipo no encontrado' }, { status: 404 });
    }

    // Validaciones de lógica de negocio
    const estadoActual = equipo.estado;
    
    // Validaciones de lógica de negocio
    const tieneEmpleadoAsignado = equipo.asignaciones?.some(a => a.targetEmpleado && a.activo);
    
    // Si se quiere cambiar a ASIGNADO, debe tener empleado (actual o nuevo)
    if (nuevoEstado === 'ASIGNADO' && !tieneEmpleadoAsignado && !targetEmpleadoId) {
      return NextResponse.json({ 
        message: 'No se puede cambiar a estado ASIGNADO sin tener un empleado asignado.' 
      }, { status: 400 });
    }

    // Si se quiere cambiar a un estado no asignado y está asignado, permitir el cambio
    // (esto desasignará implícitamente el equipo)
    if (nuevoEstado !== 'ASIGNADO' && tieneEmpleadoAsignado) {
      console.log(`Cambiando equipo de ASIGNADO a ${nuevoEstado} - esto desasignará el empleado`);
    }

    // Preparar datos de actualización
    const updateData: any = { estado: nuevoEstado };
    
    // Las asignaciones de empleado y ubicación se manejan en AsignacionesEquipos
    // No se actualizan directamente en el equipo

    console.log('Datos de actualización:', updateData);

    // Actualizar el estado del equipo
    console.log(`Actualizando ${tipoEquipo} con ID: ${equipoId}`);
    let equipoActualizado;
    try {
      if (tipoEquipo === 'computador') {
        console.log('Actualizando computador...');
        equipoActualizado = await prisma.computador.update({
          where: { id: equipoId },
          data: updateData,
        });
        console.log('Computador actualizado exitosamente');
      } else {
        console.log('Actualizando dispositivo...');
        equipoActualizado = await prisma.dispositivo.update({
          where: { id: equipoId },
          data: updateData,
        });
        console.log('Dispositivo actualizado exitosamente');
      }
    } catch (updateError) {
      console.error('Error en actualización de equipo:', updateError);
      throw updateError;
    }

    // Registrar en el historial de modificaciones (solo para computadores)
    if (tipoEquipo === 'computador') {
      console.log('Registrando en historial de modificaciones...');
      try {
        await prisma.historialModificaciones.create({
          data: {
            computadorId: equipoId,
            campo: 'estado',
            valorAnterior: estadoActual,
            valorNuevo: nuevoEstado,
          },
        });
        console.log('Historial de computador registrado exitosamente');
      } catch (historialError) {
        console.error('Error registrando historial:', historialError);
        // No fallar por error de historial, solo logear
      }
    }

    // Crear registro en Asignaciones para cambios de estado
    console.log('Creando registro de asignación...');
    console.log('Estado actual:', estadoActual);
    console.log('Nuevo estado:', nuevoEstado);
    console.log('Target empleado ID:', targetEmpleadoId);
    console.log('Tiene empleado asignado actualmente:', tieneEmpleadoAsignado);
    try {
      let actionType = 'CAMBIO_ESTADO';
      let targetType = 'SISTEMA';
      let targetEmpleadoIdFinal = null;
      let notes = `Cambio de estado de ${estadoActual} a ${nuevoEstado}`;

      // PRIORIDAD 1: Si es una nueva asignación (independientemente del estado actual)
      if (nuevoEstado === 'ASIGNADO' && targetEmpleadoId) {
        console.log('Detectada nueva asignación');
        actionType = 'Assignment';
        targetType = 'Usuario';
        targetEmpleadoIdFinal = targetEmpleadoId;
        notes = `Asignación automática por cambio de estado a ${nuevoEstado}`;
        
        // Desactivar asignaciones anteriores si las hay
        console.log('Desactivando asignaciones anteriores...');
        await prisma.asignacionesEquipos.updateMany({
          where: {
            [tipoEquipo === 'computador' ? 'computadorId' : 'dispositivoId']: equipoId,
            activo: true
          },
          data: { activo: false }
        });
        console.log('Asignaciones anteriores desactivadas');
      }
      // PRIORIDAD 2: Detectar si es una devolución (de ASIGNADO a otro estado)
      else if (estadoActual === 'ASIGNADO' && nuevoEstado !== 'ASIGNADO' && !targetEmpleadoId) {
        console.log('Detectada devolución');
        actionType = 'Return';
        targetType = 'Usuario';
        // Obtener el empleado asignado de las asignaciones activas
        const empleadoAsignado = equipo.asignaciones?.find(a => a.targetEmpleado && a.activo)?.targetEmpleado;
        targetEmpleadoIdFinal = empleadoAsignado?.id || null;
        notes = `Devolución automática por cambio de estado de ${estadoActual} a ${nuevoEstado}`;
      }
      // PRIORIDAD 3: Si no es ni asignación ni devolución, es un cambio de estado
      else {
        console.log('Detectado cambio de estado general');
        actionType = 'CAMBIO_ESTADO';
        targetType = 'SISTEMA';
        targetEmpleadoIdFinal = null;
        notes = `Cambio de estado de ${estadoActual} a ${nuevoEstado}`;
      }

      const nuevaAsignacion = await prisma.asignacionesEquipos.create({
        data: {
          date: new Date(),
          actionType: actionType,
          targetType: targetType,
          targetEmpleadoId: targetEmpleadoIdFinal,
          itemType: tipoEquipo === 'computador' ? 'Computador' : 'Dispositivo',
          computadorId: tipoEquipo === 'computador' ? equipoId : null,
          dispositivoId: tipoEquipo === 'dispositivo' ? equipoId : null,
          motivo: motivo,
          notes: notes,
          ubicacionId: ubicacionId || null, // Agregar ubicación
          activo: actionType === 'Assignment' ? true : false, // Solo las asignaciones están activas
        },
      });
      console.log('Registro de asignación creado exitosamente');
      console.log('Nueva asignación:', {
        id: nuevaAsignacion.id,
        actionType: nuevaAsignacion.actionType,
        targetType: nuevaAsignacion.targetType,
        targetEmpleadoId: nuevaAsignacion.targetEmpleadoId,
        activo: nuevaAsignacion.activo
      });
    } catch (asignacionError) {
      console.error('Error creando registro de asignación:', asignacionError);
      // No fallar por error de asignación, solo logear
    }

    // Log de auditoría
    try {
      await AuditLogger.logUpdate(
        tipoEquipo,
        equipoId,
        `Estado cambiado de ${estadoActual} a ${nuevoEstado}. Motivo: ${motivo}`,
        user?.id as string
      );
      console.log('Log de auditoría registrado exitosamente');
    } catch (auditError) {
      console.error('Error en log de auditoría:', auditError);
      // No fallar por error de auditoría
    }

    return NextResponse.json({
      message: 'Estado del equipo actualizado exitosamente',
      equipo: equipoActualizado,
    }, { status: 200 });

  } catch (error) {
    console.error('Error al cambiar estado del equipo:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      message: 'Error al cambiar estado del equipo',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
