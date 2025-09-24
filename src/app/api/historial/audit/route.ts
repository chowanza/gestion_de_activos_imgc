import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const filterType = searchParams.get('filterType') || 'all';
    const filterAction = searchParams.get('filterAction') || 'all';
    
    const skip = (page - 1) * limit;

    // Obtener datos de las tres fuentes principales de auditoría
    const [historialMovimientos, asignaciones, historialModificaciones] = await Promise.all([
      // Historial de Movimientos (logs del sistema)
      prisma.historialMovimientos.findMany({
        where: {
          ...(search && {
            OR: [
              { accion: { contains: search, mode: 'insensitive' } },
              { entidad: { contains: search, mode: 'insensitive' } },
              { descripcion: { contains: search, mode: 'insensitive' } },
              { detalles: { contains: search, mode: 'insensitive' } }
            ]
          }),
          ...(filterAction !== 'all' && { accion: filterAction }),
          ...(filterType !== 'all' && { entidad: filterType })
        },
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              role: true
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        }
      }),

      // Asignaciones (movimientos de equipos)
      prisma.asignaciones.findMany({
        where: {
          ...(search && {
            OR: [
              { actionType: { contains: search, mode: 'insensitive' } },
              { motivo: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
              { itemType: { contains: search, mode: 'insensitive' } }
            ]
          }),
          ...(filterAction !== 'all' && { actionType: filterAction }),
          ...(filterType !== 'all' && { itemType: filterType })
        },
        include: {
          targetEmpleado: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              ced: true
            }
          },
          computador: {
            select: {
              id: true,
              serial: true,
              modelo: {
                select: {
                  nombre: true,
                  marca: {
                    select: {
                      nombre: true
                    }
                  }
                }
              }
            }
          },
          dispositivo: {
            select: {
              id: true,
              serial: true,
              modelo: {
                select: {
                  nombre: true,
                  marca: {
                    select: {
                      nombre: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      }),

      // Historial de Modificaciones (cambios en equipos)
      prisma.historialModificaciones.findMany({
        where: {
          ...(search && {
            OR: [
              { campo: { contains: search, mode: 'insensitive' } },
              { valorAnterior: { contains: search, mode: 'insensitive' } },
              { valorNuevo: { contains: search, mode: 'insensitive' } }
            ]
          }),
          ...(filterAction !== 'all' && { campo: filterAction }),
          ...(filterType !== 'all' && { computador: { isNot: null } })
        },
        include: {
          computador: {
            select: {
              id: true,
              serial: true,
              modelo: {
                select: {
                  nombre: true,
                  marca: {
                    select: {
                      nombre: true
                    }
                  }
                }
              },
              empleado: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true
                }
              }
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        }
      })
    ]);

    // Procesar y combinar todos los datos de auditoría
    const auditLogs = [];

    // Procesar Historial de Movimientos
    historialMovimientos.forEach(log => {
      auditLogs.push({
        id: `mov-${log.id}`,
        fecha: log.fecha,
        tipo: 'Sistema',
        accion: log.accion,
        entidad: log.entidad,
        entidadId: log.entidadId,
        descripcion: log.descripcion,
        detalles: log.detalles,
        usuario: log.usuario ? {
          id: log.usuario.id,
          username: log.usuario.username,
          role: log.usuario.role
        } : null,
        ipAddress: null,
        userAgent: null,
        equipo: null,
        targetEmpleado: null,
        campo: null,
        valorAnterior: null,
        valorNuevo: null
      });
    });

    // Procesar Asignaciones
    asignaciones.forEach(asig => {
      const equipo = asig.computador || asig.dispositivo;
      auditLogs.push({
        id: `asig-${asig.id}`,
        fecha: asig.date,
        tipo: 'Asignación',
        accion: asig.actionType,
        entidad: asig.itemType,
        entidadId: equipo?.id || null,
        descripcion: `${asig.actionType} de ${asig.itemType}${asig.motivo ? ` - ${asig.motivo}` : ''}`,
        detalles: asig.notes,
        usuario: null,
        ipAddress: null,
        userAgent: null,
        equipo: equipo ? {
          id: equipo.id,
          serial: equipo.serial,
          modelo: `${equipo.modelo.marca.nombre} ${equipo.modelo.nombre}`
        } : null,
        targetEmpleado: asig.targetEmpleado ? {
          id: asig.targetEmpleado.id,
          nombre: `${asig.targetEmpleado.nombre} ${asig.targetEmpleado.apellido}`,
          ced: asig.targetEmpleado.ced
        } : null,
        campo: null,
        valorAnterior: null,
        valorNuevo: null
      });
    });

    // Procesar Historial de Modificaciones
    historialModificaciones.forEach(mod => {
      auditLogs.push({
        id: `mod-${mod.id}`,
        fecha: mod.fecha,
        tipo: 'Modificación',
        accion: `Modificación - ${mod.campo}`,
        entidad: 'Computador',
        entidadId: mod.computador?.id || null,
        descripcion: `Campo '${mod.campo}' modificado`,
        detalles: `${mod.valorAnterior || 'N/A'} → ${mod.valorNuevo || 'N/A'}`,
        usuario: null,
        ipAddress: null,
        userAgent: null,
        equipo: mod.computador ? {
          id: mod.computador.id,
          serial: mod.computador.serial,
          modelo: `${mod.computador.modelo.marca.nombre} ${mod.computador.modelo.nombre}`
        } : null,
        targetEmpleado: mod.computador?.empleado ? {
          id: mod.computador.empleado.id,
          nombre: `${mod.computador.empleado.nombre} ${mod.computador.empleado.apellido}`,
          ced: null
        } : null,
        campo: mod.campo,
        valorAnterior: mod.valorAnterior,
        valorNuevo: mod.valorNuevo
      });
    });

    // Ordenar por fecha descendente
    auditLogs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // Aplicar paginación
    const paginatedLogs = auditLogs.slice(skip, skip + limit);
    const totalPages = Math.ceil(auditLogs.length / limit);

    // Generar estadísticas
    const stats = {
      total: auditLogs.length,
      porTipo: auditLogs.reduce((acc, log) => {
        acc[log.tipo] = (acc[log.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porAccion: auditLogs.reduce((acc, log) => {
        acc[log.accion] = (acc[log.accion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porEntidad: auditLogs.reduce((acc, log) => {
        acc[log.entidad] = (acc[log.entidad] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      data: {
        logs: paginatedLogs,
        pagination: {
          page,
          limit,
          total: auditLogs.length,
          pages: totalPages
        },
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
