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
    
    const { equipoId, tipoEquipo, nuevoEstado, motivo, targetEmpleadoId } = body;

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
          modelo: {
            include: {
              marca: true,
            },
          },
          empleado: true,
        },
      });
    } else {
      equipo = await prisma.dispositivo.findUnique({
        where: { id: equipoId },
        include: {
          modelo: {
            include: {
              marca: true,
            },
          },
          empleado: true,
        },
      });
    }
    
    console.log('Equipo encontrado:', equipo ? 'Sí' : 'No');
    if (equipo) {
      console.log('Estado actual:', equipo.estado);
      console.log('Empleado asignado:', equipo.empleadoId);
    }

    if (!equipo) {
      return NextResponse.json({ message: 'Equipo no encontrado' }, { status: 404 });
    }

    // Validaciones de lógica de negocio
    const estadoActual = equipo.estado;
    
    // Validaciones de lógica de negocio
    // Si se quiere cambiar a ASIGNADO, debe tener empleado (actual o nuevo)
    if (nuevoEstado === 'ASIGNADO' && !equipo.empleadoId && !targetEmpleadoId) {
      return NextResponse.json({ 
        message: 'No se puede cambiar a estado ASIGNADO sin tener un empleado asignado.' 
      }, { status: 400 });
    }

    // Si se quiere cambiar a un estado no asignado y está asignado, permitir el cambio
    // (esto desasignará implícitamente el equipo)
    if (nuevoEstado !== 'ASIGNADO' && equipo.empleadoId) {
      console.log(`Cambiando equipo de ASIGNADO a ${nuevoEstado} - esto desasignará el empleado`);
    }

    // Preparar datos de actualización
    const updateData: any = { estado: nuevoEstado };
    
    // Manejar asignación de empleado
    if (nuevoEstado === 'ASIGNADO') {
      // Si se proporciona un empleado específico, asignarlo
      if (targetEmpleadoId) {
        updateData.empleadoId = targetEmpleadoId;
      }
      // Si no se proporciona empleado pero ya tiene uno, mantenerlo
    } else {
      // Si el nuevo estado no es ASIGNADO, desasignar el empleado
      updateData.empleadoId = null;
    }

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
          include: {
            modelo: {
              include: {
                marca: true,
              },
            },
            empleado: true,
          },
        });
        console.log('Computador actualizado exitosamente');
      } else {
        console.log('Actualizando dispositivo...');
        equipoActualizado = await prisma.dispositivo.update({
          where: { id: equipoId },
          data: updateData,
          include: {
            modelo: {
              include: {
                marca: true,
              },
            },
            empleado: true,
          },
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

    // Si se está asignando a un empleado, crear registro en Asignaciones
    if (nuevoEstado === 'ASIGNADO' && targetEmpleadoId) {
      console.log('Creando registro de asignación...');
      try {
        await prisma.asignaciones.create({
          data: {
            date: new Date(),
            actionType: 'Assignment',
            targetType: 'Usuario',
            targetEmpleadoId: targetEmpleadoId,
            itemType: tipoEquipo === 'computador' ? 'Computador' : 'Dispositivo',
            computadorId: tipoEquipo === 'computador' ? equipoId : null,
            dispositivoId: tipoEquipo === 'dispositivo' ? equipoId : null,
            motivo: motivo,
            notes: `Asignación automática por cambio de estado a ${nuevoEstado}`,
            gerente: 'Sistema',
          },
        });
        console.log('Registro de asignación creado exitosamente');
      } catch (asignacionError) {
        console.error('Error creando registro de asignación:', asignacionError);
        // No fallar por error de asignación, solo logear
      }
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
      stack: error instanceof Error ? error.stack : undefined,
      body: body
    });
    return NextResponse.json({ 
      message: 'Error al cambiar estado del equipo',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
