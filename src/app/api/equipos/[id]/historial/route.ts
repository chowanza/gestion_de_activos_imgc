import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = request.nextUrl.pathname.split('/')[3];
    const itemType = searchParams.get('itemType') as 'computador' | 'dispositivo';
    const orden = searchParams.get('orden') as 'asc' | 'desc' || 'desc';
    const accion = searchParams.get('accion') || '';
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    console.log('API Historial - Parámetros:', { id, itemType, orden, accion, fechaInicio, fechaFin });

    if (!itemType || !['computador', 'dispositivo'].includes(itemType)) {
      return NextResponse.json({ error: 'Tipo de equipo inválido' }, { status: 400 });
    }

    // Construir filtros para AsignacionesEquipos
    const asignacionesWhere: any = {
      ...(itemType === 'computador' ? { computadorId: id } : { dispositivoId: id })
    };

    // Filtro por acción
    if (accion) {
      asignacionesWhere.actionType = accion;
    }

    // Filtro por rango de fechas
    if (fechaInicio || fechaFin) {
      asignacionesWhere.date = {};
      if (fechaInicio) {
        asignacionesWhere.date.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        asignacionesWhere.date.lte = new Date(fechaFin);
      }
    }

    // Obtener historial de asignaciones (simplificado)
    const asignaciones = await prisma.asignacionesEquipos.findMany({
      where: asignacionesWhere,
      orderBy: { date: orden }
    });

    // Obtener historial de modificaciones (solo para computadores)
    let modificaciones: any[] = [];
    if (itemType === 'computador') {
      modificaciones = await prisma.historialModificaciones.findMany({
        where: { computadorId: id },
        orderBy: { fecha: orden }
      });
    }

    // Mapear asignaciones a formato unificado
    const historialAsignaciones = asignaciones.map(a => ({
      id: `asig-${a.id}`,
      tipo: 'asignacion',
      fecha: a.date,
      actionType: a.actionType,
      detalle: a
    }));

    // Mapear modificaciones a formato unificado
    const historialModificaciones = modificaciones.map(m => ({
      id: `mod-${m.id}`,
      tipo: 'modificacion',
      fecha: m.fecha,
      actionType: 'EDICION',
      detalle: m
    }));

    // Combinar y ordenar el historial final
    const historialCombinado = [...historialAsignaciones, ...historialModificaciones]
      .sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        return orden === 'asc' ? fechaA - fechaB : fechaB - fechaA;
      });

    return NextResponse.json({
      historial: historialCombinado,
      total: historialCombinado.length,
      filtros: {
        itemType,
        orden,
        accion,
        fechaInicio,
        fechaFin
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

