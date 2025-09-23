import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
import { ESTADOS_EQUIPO } from '@/lib/estados-equipo';

export async function POST(request: NextRequest) {
  const user = await getServerUser(request);

  try {
    const { empleadoId, equipoId, tipoEquipo, motivo } = await request.json();

    if (!empleadoId || !equipoId || !tipoEquipo || !motivo) {
      return NextResponse.json({ message: 'Todos los campos son requeridos' }, { status: 400 });
    }

    if (!['computador', 'dispositivo'].includes(tipoEquipo)) {
      return NextResponse.json({ message: 'Tipo de equipo inválido' }, { status: 400 });
    }

    // Verificar que el empleado existe
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId },
      select: { id: true, nombre: true, apellido: true }
    });

    if (!empleado) {
      return NextResponse.json({ message: 'Empleado no encontrado' }, { status: 404 });
    }

    // Verificar que el equipo existe y está disponible
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
        },
      });
    }

    if (!equipo) {
      return NextResponse.json({ message: 'Equipo no encontrado' }, { status: 404 });
    }

    if (![ESTADOS_EQUIPO.OPERATIVO, ESTADOS_EQUIPO.EN_MANTENIMIENTO].includes(equipo.estado as any)) {
      return NextResponse.json({ message: 'El equipo no está disponible para asignar' }, { status: 400 });
    }

    if (equipo.empleadoId) {
      return NextResponse.json({ message: 'El equipo ya está asignado' }, { status: 400 });
    }

    // Asignar el equipo
    let equipoActualizado;
    if (tipoEquipo === 'computador') {
      equipoActualizado = await prisma.computador.update({
        where: { id: equipoId },
        data: {
          empleadoId: empleadoId,
          estado: ESTADOS_EQUIPO.ASIGNADO,
        },
        include: {
          modelo: {
            include: {
              marca: true,
            },
          },
        },
      });
    } else {
      equipoActualizado = await prisma.dispositivo.update({
        where: { id: equipoId },
        data: {
          empleadoId: empleadoId,
          estado: ESTADOS_EQUIPO.ASIGNADO,
        },
        include: {
          modelo: {
            include: {
              marca: true,
            },
          },
        },
      });
    }

    // Registrar en el historial de asignaciones
    await prisma.historialAsignacion.create({
      data: {
        empleadoId: empleadoId,
        equipoId: equipoId,
        tipoEquipo: tipoEquipo,
        accion: 'asignacion',
        motivo: motivo,
        usuarioId: user?.id,
      },
    });

    // Registrar en el historial de movimientos
    await prisma.historialMovimiento.create({
      data: {
        equipoId: equipoId,
        tipoEquipo: tipoEquipo,
        accion: 'asignacion',
        destino: empleado.nombre + ' ' + empleado.apellido,
        empresa: empleado.nombre + ' ' + empleado.apellido, // Usar nombre del empleado como empresa temporalmente
        motivo: motivo,
        gerente: user?.name || 'Sistema',
        usuarioId: user?.id,
      },
    });

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
