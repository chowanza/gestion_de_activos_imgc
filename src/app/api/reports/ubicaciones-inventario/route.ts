import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/role-middleware';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = await requirePermission('canView')(request as any);
  if (deny) return deny;
  try {
    const { searchParams } = new URL(request.url);
    const ubicacionId = searchParams.get('ubicacionId');
    const estadoEquipo = searchParams.get('estadoEquipo');

    console.log('🔍 API Ubicaciones Inventario - Parámetros recibidos:', {
      ubicacionId, estadoEquipo
    });

    // Construir filtros para ubicaciones
    const ubicacionWhere: any = {};
    if (ubicacionId) {
      ubicacionWhere.id = ubicacionId;
    }

    // Obtener ubicaciones con equipos asignados
    const ubicaciones = await prisma.ubicacion.findMany({
      where: ubicacionWhere,
      include: {
        // Incluir asignaciones ordenadas por fecha descendente para poder
        // tomar la asignación más reciente por equipo (evitamos filtrar por `activo`)
        asignacionesEquipos: {
          orderBy: { date: 'desc' },
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
            },
            targetEmpleado: {
              include: {
                organizaciones: {
                  where: { activo: true },
                  include: {
                    empresa: true,
                    departamento: true,
                    cargo: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    console.log(`📊 Ubicaciones encontradas: ${ubicaciones.length}`);

    // Usar la vista vw_ubicacion_actual como fuente de la ubicación actual por equipo.
    const ubicacionIds = ubicaciones.map(u => u.id);

    // Intentar usar la vista vw_ubicacion_actual como fuente de la ubicación actual por equipo.
    let vwRows: any[] = [];
    try {
      const inClause = ubicacionIds.length > 0 ? `('${ubicacionIds.join("','")}')` : `('')`;
      vwRows = await prisma.$queryRawUnsafe(`
        SELECT tipo, equipoId, ubicacionId, date, targetEmpleadoId, asignacionId
        FROM dbo.vw_ubicacion_actual
        WHERE ubicacionId IN ${inClause}
        ORDER BY date DESC
      `);
    } catch (vwErr) {
      console.warn('Advertencia: vw_ubicacion_actual no disponible, usando fallback por última asignación', vwErr);
      // FALLBACK: recuperar todas las asignaciones y construir latestByEquipo en memoria
      const allAsigns = await prisma.asignacionesEquipos.findMany({
        where: { OR: [{ computadorId: { not: null } }, { dispositivoId: { not: null } }] },
        orderBy: { date: 'desc' },
        select: { id: true, computadorId: true, dispositivoId: true, ubicacionId: true, date: true, targetEmpleadoId: true, itemType: true }
      });

      const latestByEquipo = new Map<string, any>();
      for (const a of allAsigns) {
        const key = a.computadorId ? `C:${a.computadorId}` : a.dispositivoId ? `D:${a.dispositivoId}` : null;
        if (!key) continue;
        if (!latestByEquipo.has(key)) latestByEquipo.set(key, a);
      }

      // Construir vwRows desde latestByEquipo, pero solo para las ubicaciones solicitadas
      for (const [key, a] of latestByEquipo) {
        if (!a.ubicacionId) continue;
        if (ubicacionIds.length > 0 && !ubicacionIds.includes(a.ubicacionId)) continue;
        vwRows.push({
          tipo: a.computadorId ? 'C' : 'D',
          equipoId: a.computadorId || a.dispositivoId,
          ubicacionId: a.ubicacionId,
          date: a.date,
          targetEmpleadoId: a.targetEmpleadoId,
          asignacionId: a.id
        });
      }
      // ordenar por date desc
      vwRows.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
    }

    // Agrupar por ubicacionId
    const rowsByUbicacion = new Map<string, any[]>();
    for (const r of vwRows) {
      const uId = r.ubicacionId || 'null';
      if (!rowsByUbicacion.has(uId)) rowsByUbicacion.set(uId, []);
      rowsByUbicacion.get(uId)!.push(r);
    }

    // Batch fetch equipos (computadores y dispositivos) y empleados referenciados
    const computadorIds = vwRows.filter(r => r.tipo === 'C').map(r => r.equipoId).filter(Boolean);
    const dispositivoIds = vwRows.filter(r => r.tipo === 'D').map(r => r.equipoId).filter(Boolean);
    const empleadoIds = Array.from(new Set(vwRows.map(r => r.targetEmpleadoId).filter(Boolean)));

    const [computadores, dispositivos, empleadosData] = await Promise.all([
      computadorIds.length ? prisma.computador.findMany({ where: { id: { in: computadorIds } }, include: { computadorModelos: { include: { modeloEquipo: { include: { marcaModelos: { include: { marca: true } } } } } } } }) : [],
      dispositivoIds.length ? prisma.dispositivo.findMany({ where: { id: { in: dispositivoIds } }, include: { dispositivoModelos: { include: { modeloEquipo: { include: { marcaModelos: { include: { marca: true } } } } } } } }) : [],
      empleadoIds.length ? prisma.empleado.findMany({ where: { id: { in: empleadoIds } }, include: { organizaciones: { where: { activo: true }, include: { empresa: true, departamento: true, cargo: true } } } }) : []
    ]);

    const computadoresMap = new Map(computadores.map(c => [c.id, c]));
    const dispositivosMap = new Map(dispositivos.map(d => [d.id, d]));
    const empleadosMap = new Map(empleadosData.map(e => [e.id, e]));

    // Procesar ubicaciones construyendo equipos a partir de las filas de la vista
    const processedUbicaciones = ubicaciones.map(ubicacion => {
      const rows = rowsByUbicacion.get(ubicacion.id) || [];

      const equipos = rows.map((r: any) => {
        const equipo = r.tipo === 'C' ? computadoresMap.get(r.equipoId) : dispositivosMap.get(r.equipoId);
        const empleado = r.targetEmpleadoId ? empleadosMap.get(r.targetEmpleadoId) : null;

        // Modelo y marca
        let modeloInfo = 'N/A';
        if (equipo) {
          const equipoAny: any = equipo;
          if (r.tipo === 'C' && equipoAny.computadorModelos?.[0]?.modeloEquipo) {
            const modelo = equipoAny.computadorModelos[0].modeloEquipo;
            const marca = modelo.marcaModelos?.[0]?.marca;
            modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
          }
          if (r.tipo === 'D' && equipoAny.dispositivoModelos?.[0]?.modeloEquipo) {
            const modelo = equipoAny.dispositivoModelos[0].modeloEquipo;
            const marca = modelo.marcaModelos?.[0]?.marca;
            modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
          }
        }

        const estado = equipo?.estado || 'N/A';

        const empleadoObj = (estado === 'ASIGNADO' && empleado) ? {
          nombre: `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim(),
          cedula: empleado.ced || 'N/A',
          cargo: empleado.organizaciones?.[0]?.cargo?.nombre || 'Sin cargo',
          departamento: empleado.organizaciones?.[0]?.departamento?.nombre || 'Sin departamento',
          empresa: empleado.organizaciones?.[0]?.empresa?.nombre || 'Sin empresa'
        } : {
          nombre: 'Sin asignar', cedula: 'N/A', cargo: 'Sin cargo', departamento: 'Sin departamento', empresa: 'Sin empresa'
        };

        return {
          id: r.equipoId || 'N/A',
          tipo: r.tipo === 'C' ? 'Computador' : 'Dispositivo',
          serial: equipo?.serial || 'N/A',
          codigoImgc: equipo?.codigoImgc || 'N/A',
          modelo: modeloInfo,
          estado,
          fechaAsignacion: r.date,
          empleado: empleadoObj,
          motivo: 'Asignación actual'
        };
      });

      // Aplicar filtro de estado si se especifica
      let equiposFiltrados = equipos;
      if (estadoEquipo) {
        equiposFiltrados = equipos.filter(e => e.estado === estadoEquipo);
      }

      const stats = {
        totalEquipos: equiposFiltrados.length,
        computadores: equiposFiltrados.filter(e => e.tipo === 'Computador').length,
        dispositivos: equiposFiltrados.filter(e => e.tipo === 'Dispositivo').length,
        porEstado: equiposFiltrados.reduce((acc, equipo) => { acc[equipo.estado] = (acc[equipo.estado] || 0) + 1; return acc; }, {} as Record<string, number>),
        porEmpresa: equiposFiltrados.reduce((acc, equipo) => { acc[equipo.empleado.empresa] = (acc[equipo.empleado.empresa] || 0) + 1; return acc; }, {} as Record<string, number>),
        porDepartamento: equiposFiltrados.reduce((acc, equipo) => { acc[equipo.empleado.departamento] = (acc[equipo.empleado.departamento] || 0) + 1; return acc; }, {} as Record<string, number>),
        empleadosUnicos: new Set(equiposFiltrados.map(e => e.empleado.cedula)).size
      };

      return {
        id: ubicacion.id,
        nombre: ubicacion.nombre,
        direccion: ubicacion.direccion,
        piso: ubicacion.piso,
        sala: ubicacion.sala,
        descripcion: ubicacion.descripcion,
        equipos: equiposFiltrados,
        estadisticas: stats
      };
    });

    // Generar estadísticas generales
    const statsGenerales = {
      totalUbicaciones: processedUbicaciones.length,
      ubicacionesConEquipos: processedUbicaciones.filter(u => u.equipos.length > 0).length,
      ubicacionesVacias: processedUbicaciones.filter(u => u.equipos.length === 0).length,
      totalEquipos: processedUbicaciones.reduce((acc, u) => acc + u.equipos.length, 0),
      totalComputadores: processedUbicaciones.reduce((acc, u) => acc + u.estadisticas.computadores, 0),
      totalDispositivos: processedUbicaciones.reduce((acc, u) => acc + u.estadisticas.dispositivos, 0),
      distribucionPorUbicacion: processedUbicaciones.map(ubicacion => ({
        ubicacion: ubicacion.nombre,
        equipos: ubicacion.equipos.length,
        computadores: ubicacion.estadisticas.computadores,
        dispositivos: ubicacion.estadisticas.dispositivos
      })),
      porEstado: processedUbicaciones.reduce((acc, u) => {
        Object.entries(u.estadisticas.porEstado).forEach(([estado, count]) => {
          acc[estado] = (acc[estado] || 0) + (count as number);
        });
        return acc;
      }, {} as Record<string, number>),
      porEmpresa: processedUbicaciones.reduce((acc, u) => {
        Object.entries(u.estadisticas.porEmpresa).forEach(([empresa, count]) => {
          acc[empresa] = (acc[empresa] || 0) + (count as number);
        });
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      data: {
        ubicaciones: processedUbicaciones,
        estadisticas: statsGenerales,
        filtros: {
          ubicacionId,
          estadoEquipo
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de ubicaciones inventario:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

