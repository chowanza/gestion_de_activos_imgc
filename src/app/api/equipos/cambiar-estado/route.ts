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
    
    const { equipoId, tipoEquipo, nuevoEstado, motivo } = body;

    if (!equipoId || !tipoEquipo || !nuevoEstado || !motivo) {
      console.log('Missing required fields:', { equipoId, tipoEquipo, nuevoEstado, motivo });
      return NextResponse.json({ message: 'Todos los campos son requeridos' }, { status: 400 });
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
    // Si se quiere cambiar a ASIGNADO, debe tener empleado
    if (nuevoEstado === 'ASIGNADO' && !equipo.empleadoId) {
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
    
    // Si el nuevo estado no es ASIGNADO, desasignar el empleado
    if (nuevoEstado !== 'ASIGNADO') {
      updateData.empleadoId = null;
    }

    console.log('Datos de actualización:', updateData);

    // Actualizar el estado del equipo
    console.log(`Actualizando ${tipoEquipo} con ID: ${equipoId}`);
    let equipoActualizado;
    if (tipoEquipo === 'computador') {
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
    } else {
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
    }

    // Registrar en el historial de modificaciones
    console.log('Registrando en historial de modificaciones...');
    if (tipoEquipo === 'computador') {
      await prisma.historialModificaciones.create({
        data: {
          computadorId: equipoId,
          campo: 'estado',
          valorAnterior: estadoActual,
          valorNuevo: nuevoEstado,
          motivo: motivo,
        },
      });
    } else {
      await prisma.historialModificaciones.create({
        data: {
          dispositivoId: equipoId,
          campo: 'estado',
          valorAnterior: estadoActual,
          valorNuevo: nuevoEstado,
          motivo: motivo,
        },
      });
    }
    console.log('Historial registrado exitosamente');

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
    return NextResponse.json({ message: 'Error al cambiar estado del equipo' }, { status: 500 });
  }
}
