import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/role-middleware';

export async function GET(request: NextRequest) {
  const deny = await requirePermission('canView')(request as any);
  if (deny) return deny;
  try {
    const { searchParams } = new URL(request.url);
    const id = request.nextUrl.pathname.split('/')[3];
    const itemType = searchParams.get('itemType') as 'computador' | 'dispositivo';

    console.log('API Historial Simple - Parámetros:', { id, itemType });

    if (!itemType || !['computador', 'dispositivo'].includes(itemType)) {
      return NextResponse.json({ error: 'Tipo de equipo inválido' }, { status: 400 });
    }

    // Obtener historial básico
    const asignaciones = await prisma.asignacionesEquipos.findMany({
      where: itemType === 'computador' ? { computadorId: id } : { dispositivoId: id },
      orderBy: { date: 'desc' }
    });

    // Mapear a formato simple
    const historial = asignaciones.map(a => ({
      id: `asig-${a.id}`,
      tipo: 'asignacion',
      fecha: a.date,
      actionType: a.actionType,
      detalle: a
    }));

    return NextResponse.json({
      historial,
      total: historial.length,
      message: 'Historial obtenido correctamente'
    }, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}


