import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerUser } from '@/lib/auth-server';
import { AuditLogger } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fecha, notas, evidenciaFotos, equipmentId, equipmentType } = body;

    if (!fecha || !notas || !equipmentId || !equipmentType) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verify equipment exists
    let equipment;
    if (equipmentType === 'computador') {
      equipment = await prisma.computador.findUnique({
        where: { id: equipmentId },
        select: { id: true, serial: true }
      });
    } else {
      equipment = await prisma.dispositivo.findUnique({
        where: { id: equipmentId },
        select: { id: true, serial: true }
      });
    }

    if (!equipment) {
      return NextResponse.json(
        { message: 'Equipo no encontrado' },
        { status: 404 }
      );
    }

    // Get employee associated with the user
    const empleado = await prisma.empleado.findFirst({
      where: {
        email: (user as { email?: string }).email
      },
      select: { id: true }
    });

    // Create intervention record
    const intervention = await prisma.intervencionesEquipos.create({
      data: {
        fecha: new Date(fecha),
        notas: notas.trim(),
        evidenciaFotos: evidenciaFotos || null,
        computadorId: equipmentType === 'computador' ? equipmentId : null,
        dispositivoId: equipmentType === 'dispositivo' ? equipmentId : null,
        empleadoId: empleado?.id || null
      }
    });

    // Log to audit
    await AuditLogger.logCreate(
      'Intervención',
      intervention.id,
      `Intervención registrada en ${equipmentType === 'computador' ? 'computador' : 'dispositivo'} ${equipment.serial}`,
      (user as { id?: string }).id,
      {
        equipmentType,
        equipmentId,
        equipmentSerial: equipment.serial,
        fecha: intervention.fecha.toISOString(),
        notas: intervention.notas,
        evidenciaFotos: intervention.evidenciaFotos,
        imagenesCount: evidenciaFotos ? evidenciaFotos.split(',').length : 0
      }
    );

    return NextResponse.json({
      message: 'Intervención registrada exitosamente',
      intervention: {
        id: intervention.id,
        fecha: intervention.fecha,
        notas: intervention.notas,
        evidenciaFotos: intervention.evidenciaFotos
      }
    });

  } catch (error) {
    console.error('Error creating intervention:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get('equipmentId');
    const equipmentType = searchParams.get('equipmentType');

    if (!equipmentId || !equipmentType) {
      return NextResponse.json(
        { message: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const whereClause = equipmentType === 'computador' 
      ? { computadorId: equipmentId }
      : { dispositivoId: equipmentId };

    const interventions = await prisma.intervencionesEquipos.findMany({
      where: whereClause,
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    return NextResponse.json({
      interventions: interventions.map(intervention => ({
        id: intervention.id,
        fecha: intervention.fecha,
        notas: intervention.notas,
        evidenciaFotos: intervention.evidenciaFotos,
        empleado: intervention.empleado,
        createdAt: intervention.createdAt,
        updatedAt: intervention.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

