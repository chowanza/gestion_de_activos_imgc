import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/historial-movimientos - Obtener historial de movimientos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const accion = searchParams.get('accion');
    const entidad = searchParams.get('entidad');
    const usuarioId = searchParams.get('usuarioId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    if (accion) where.accion = accion;
    if (entidad) where.entidad = entidad;
    if (usuarioId) where.usuarioId = usuarioId;
    
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }

    const [movimientos, total] = await Promise.all([
      prisma.historialMovimientos.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              role: true,
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.historialMovimientos.count({ where })
    ]);

    return NextResponse.json({
      movimientos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching historial movimientos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/historial-movimientos - Crear nuevo movimiento (para uso interno)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      accion, 
      entidad, 
      entidadId, 
      descripcion, 
      detalles, 
      usuarioId, 
      ipAddress, 
      userAgent 
    } = body;

    if (!accion || !entidad || !descripcion) {
      return NextResponse.json(
        { error: 'Los campos accion, entidad y descripcion son requeridos' },
        { status: 400 }
      );
    }

    const movimiento = await prisma.historialMovimientos.create({
      data: {
        accion,
        entidad,
        entidadId: entidadId || null,
        descripcion,
        detalles: detalles ? JSON.stringify(detalles) : null,
        usuarioId: usuarioId || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            role: true,
          }
        }
      }
    });

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
    console.error('Error creating movimiento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


