import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/role-middleware';
import { getServerUser } from '@/lib/auth-server';

// GET /api/historial-movimientos - Obtener historial de movimientos
export async function GET(request: NextRequest) {
  // Only users with audit view permission can read movement history
  const deny = await requirePermission('canViewAuditLogs')(request as any);
  if (deny) return deny;
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
  // Allow any authenticated user to log a movement; we'll attach the user from the session
  try {
    const sessionUser = await getServerUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    let { 
      accion, 
      entidad, 
      entidadId, 
      descripcion, 
      detalles, 
      // usuarioId (ignored - we use session),
      ipAddress, 
      userAgent 
    } = body;

    if (!accion || !entidad || !descripcion) {
      return NextResponse.json(
        { error: 'Los campos accion, entidad y descripcion son requeridos' },
        { status: 400 }
      );
    }

    // Normalizar/validar accion para cumplir con el set predefinido
    const allowed = new Map<string, string>([
      ['NAVEGACION', 'NAVEGACION'],
      ['CREACION', 'CREACION'],
      ['ACTUALIZACION', 'ACTUALIZACION'],
      ['ELIMINACION', 'ELIMINACION'],
      // Legacy mappings
      ['VIEW', 'NAVEGACION'],
      ['CREATE', 'CREACION'],
      ['UPDATE', 'ACTUALIZACION'],
      ['DELETE', 'ELIMINACION'],
    ]);
    const normalized = allowed.get(String(accion).toUpperCase());
    if (!normalized) {
      return NextResponse.json(
        { error: "Acción inválida. Use NAVEGACION | CREACION | ACTUALIZACION | ELIMINACION" },
        { status: 400 }
      );
    }

    // Enriquecer detalles con el actor resuelto por el servidor para trazabilidad
    let mergedDetails: any = undefined;
    try {
      const base = typeof detalles === 'object' && detalles !== null ? detalles : {};
      mergedDetails = {
        ...base,
        serverActor: {
          id: (sessionUser as any)?.id,
          username: (sessionUser as any)?.username,
          role: (sessionUser as any)?.role,
        },
      };
    } catch {}

    const movimiento = await prisma.historialMovimientos.create({
      data: {
        accion: normalized,
        entidad,
        entidadId: entidadId || null,
        descripcion,
        detalles: mergedDetails ? JSON.stringify(mergedDetails) : (detalles ? JSON.stringify(detalles) : null),
  usuarioId: (sessionUser.id as string),
        ipAddress: ipAddress || request.headers.get('x-forwarded-for') || null,
        userAgent: userAgent || request.headers.get('user-agent') || null,
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


