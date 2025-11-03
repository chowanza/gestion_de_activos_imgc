import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";
import { requirePermission } from '@/lib/role-middleware';

export async function GET(request: NextRequest) {
  try {
    // Require audit log viewing permission
    const deny = await requirePermission('canViewAuditLogs')(request as any);
    if (deny) return deny;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const filterAction = searchParams.get('filterAction') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const skip = (page - 1) * limit;

  // Nota: NO adjuntamos el usuario actual a registros que no tengan actor
  // explícito en BD, para evitar confusiones de atribución. Solo usaremos
  // el usuario que venga enlazado en cada registro (si existe).
  // Mantener la lectura del usuario por si se requiere en el futuro.
  const currentUser = await getServerUser(request);

  // Construir filtros de fecha
  const dateFilter: { [key: string]: any } = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Obtener datos de las tres fuentes principales de auditoría
    const [historialMovimientos, asignaciones, historialModificaciones] = await Promise.all([
      // Historial de Movimientos (logs del sistema)
      prisma.historialMovimientos.findMany({
        where: {
          ...(search && {
            OR: [
              { accion: { contains: search } },
              { entidad: { contains: search } },
              { descripcion: { contains: search } },
              { detalles: { contains: search } }
            ]
          }),
          ...(filterAction !== 'all' && { 
            accion: filterAction === 'NAVEGACION' 
              ? { in: ['NAVEGACION', 'login', 'logout', 'navegacion'] }
              : filterAction 
          }),
          ...(Object.keys(dateFilter).length > 0 && { fecha: dateFilter })
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
      prisma.asignacionesEquipos.findMany({
        where: {
          ...(search && {
            OR: [
              { actionType: { contains: search } },
              { motivo: { contains: search } },
              { notes: { contains: search } },
              { itemType: { contains: search } }
            ]
          }),
          ...(filterAction !== 'all' && { actionType: filterAction }),
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
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
            include: {
              computadorModelos: {
                include: {
                  modeloEquipo: {
                    include: {
                      marcaModelos: {
                        include: {
                          marca: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          dispositivo: {
            include: {
              dispositivoModelos: {
                include: {
                  modeloEquipo: {
                    include: {
                      marcaModelos: {
                        include: {
                          marca: true
                        }
                      }
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
              { campo: { contains: search } },
              { valorAnterior: { contains: search } },
              { valorNuevo: { contains: search } }
            ]
          }),
          ...(filterAction !== 'all' && { campo: filterAction }),
          ...(Object.keys(dateFilter).length > 0 && { fecha: dateFilter })
        },
        include: {
          computador: {
            include: {
              computadorModelos: {
                include: {
                  modeloEquipo: {
                    include: {
                      marcaModelos: {
                        include: {
                          marca: true
                        }
                      }
                    }
                  }
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
  const auditLogs: any[] = [];

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
        // Mostrar únicamente el usuario que registró el evento (si existe)
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
      let modeloInfo = 'Sin modelo';
      
      if (equipo) {
        if (asig.computador) {
          const modelo = asig.computador.computadorModelos?.[0]?.modeloEquipo;
          const marca = modelo?.marcaModelos?.[0]?.marca;
          if (marca && modelo) {
            modeloInfo = `${marca.nombre} ${modelo.nombre}`;
          }
        } else if (asig.dispositivo) {
          const modelo = asig.dispositivo.dispositivoModelos?.[0]?.modeloEquipo;
          const marca = modelo?.marcaModelos?.[0]?.marca;
          if (marca && modelo) {
            modeloInfo = `${marca.nombre} ${modelo.nombre}`;
          }
        }
      }

      auditLogs.push({
        id: `asig-${asig.id}`,
        fecha: asig.date,
        tipo: 'Sistema',
        accion: asig.actionType,
        entidad: 'sistema',
        entidadId: equipo?.id || null,
        descripcion: `${asig.actionType} de ${asig.itemType}${asig.motivo ? ` - ${asig.motivo}` : ''}`,
        detalles: asig.notes,
        // No hay actor explícito en esta tabla, evitar atribuir al usuario visualizador
        usuario: null,
        ipAddress: null,
        userAgent: null,
        equipo: equipo ? {
          id: equipo.id,
          serial: equipo.serial,
          modelo: modeloInfo
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
      const computador = mod.computador;
      let modeloInfo = 'Sin modelo';
      
      if (computador) {
        const modelo = computador.computadorModelos?.[0]?.modeloEquipo;
        const marca = modelo?.marcaModelos?.[0]?.marca;
        if (marca && modelo) {
          modeloInfo = `${marca.nombre} ${modelo.nombre}`;
        }
      }

      auditLogs.push({
        id: `mod-${mod.id}`,
        fecha: mod.fecha,
        tipo: 'Sistema',
        accion: `Modificación - ${mod.campo}`,
        entidad: 'sistema',
        entidadId: computador?.id || null,
        descripcion: `Campo '${mod.campo}' modificado`,
        detalles: `${mod.valorAnterior || 'N/A'} → ${mod.valorNuevo || 'N/A'}`,
        // No hay actor explícito aquí; no atribuir al usuario actual
        usuario: null,
        ipAddress: null,
        userAgent: null,
        equipo: computador ? {
          id: computador.id,
          serial: computador.serial,
          modelo: modeloInfo
        } : null,
        targetEmpleado: null,
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

    // Generar estadísticas para las 5 categorías principales
    const stats = {
      total: auditLogs.length,
      porTipo: { 'Sistema': auditLogs.length },
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
