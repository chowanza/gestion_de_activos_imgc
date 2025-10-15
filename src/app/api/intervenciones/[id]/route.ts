import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser(request);
  if (!user) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { fecha, notas, evidenciaFotos } = await request.json();

    if (!fecha || !notas || !id) {
      return NextResponse.json({ message: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Verificar que la intervención existe
    const existingIntervention = await prisma.intervencionesEquipos.findUnique({
      where: { id },
      include: {
        computador: { select: { serial: true } },
        dispositivo: { select: { serial: true } }
      }
    });

    if (!existingIntervention) {
      return NextResponse.json({ message: 'Intervención no encontrada' }, { status: 404 });
    }

    // Actualizar la intervención
    const updatedIntervention = await prisma.intervencionesEquipos.update({
      where: { id },
      data: {
        fecha: new Date(fecha),
        notas,
        evidenciaFotos,
      },
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    // Log de auditoría
    const equipmentType = existingIntervention.computadorId ? 'computador' : 'dispositivo';
    const equipmentSerial = existingIntervention.computador?.serial || existingIntervention.dispositivo?.serial || 'Desconocido';

    await AuditLogger.logUpdate(
      'IntervencionEquipo',
      id,
      `Intervención actualizada para ${equipmentType} ${equipmentSerial}`,
      (user as { id?: string }).id,
      {
        equipmentType,
        equipmentSerial,
        fecha,
        notas,
        evidenciaFotos: evidenciaFotos ? 'Sí' : 'No',
      }
    );

    return NextResponse.json(updatedIntervention, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar intervención:', error);
    return NextResponse.json({ message: 'Error interno del servidor al actualizar intervención' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser(request);
  if (!user) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verificar que la intervención existe
    const existingIntervention = await prisma.intervencionesEquipos.findUnique({
      where: { id },
      include: {
        computador: { select: { serial: true } },
        dispositivo: { select: { serial: true } }
      }
    });

    if (!existingIntervention) {
      return NextResponse.json({ message: 'Intervención no encontrada' }, { status: 404 });
    }

    // Eliminar la intervención
    await prisma.intervencionesEquipos.delete({
      where: { id },
    });

    // Log de auditoría
    const equipmentType = existingIntervention.computadorId ? 'computador' : 'dispositivo';
    const equipmentSerial = existingIntervention.computador?.serial || existingIntervention.dispositivo?.serial || 'Desconocido';

    await AuditLogger.logDelete(
      'IntervencionEquipo',
      id,
      `Intervención eliminada para ${equipmentType} ${equipmentSerial}`,
      (user as { id?: string }).id,
      {
        equipmentType,
        equipmentSerial,
      }
    );

    return NextResponse.json({ message: 'Intervención eliminada exitosamente' }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar intervención:', error);
    return NextResponse.json({ message: 'Error interno del servidor al eliminar intervención' }, { status: 500 });
  }
}
