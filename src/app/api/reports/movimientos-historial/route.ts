import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/role-middleware';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = await requirePermission('canView')(request as any);
  if (deny) return deny;
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const actionType = searchParams.get('actionType');
    const itemType = searchParams.get('itemType');
    const estadoEquipo = searchParams.get('estadoEquipo');
    const empresaId = searchParams.get('empresaId');
    const departamentoId = searchParams.get('departamentoId');
    const empleadoId = searchParams.get('empleadoId');

    console.log('🔍 API Reports - Parámetros recibidos:', {
      startDate, endDate, actionType, itemType, estadoEquipo, empresaId, departamentoId, empleadoId
    });

    // Validar fechas
    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: 'Las fechas de inicio y fin son requeridas' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Incluir todo el día final

    // Construir filtros base para AsignacionesEquipos
    const asignacionesWhere: any = {
      date: {
        gte: start,
        lte: end
      },
      activo: true // Solo asignaciones activas
    };

    // Aplicar filtros directamente en la consulta
    if (actionType) {
      asignacionesWhere.actionType = actionType;
    }

    if (itemType) {
      asignacionesWhere.itemType = itemType;
    }

    if (empleadoId) {
      asignacionesWhere.OR = [
        { targetEmpleadoId: empleadoId },
        { gerenteId: empleadoId }
      ];
    }

    // Construir filtros para HistorialModificaciones
    const modificacionesWhere: any = {
      fecha: {
        gte: start,
        lte: end
      }
    };

    // Obtener movimientos usando la tabla correcta
    const [asignaciones, historialModificaciones] = await Promise.all([
      // AsignacionesEquipos (asignaciones, devoluciones, transferencias)
      prisma.asignacionesEquipos.findMany({
        where: asignacionesWhere,
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
                  departamento: true
                }
              }
            }
          },
          ubicacion: true
        },
        orderBy: {
          date: 'desc'
        }
      }),
      
      // Historial de Modificaciones (cambios de estado y especificaciones) - solo computadores
      prisma.historialModificaciones.findMany({
        where: modificacionesWhere,
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
              },
              asignaciones: {
                where: { activo: true },
                include: {
                  targetEmpleado: {
                    include: {
                      organizaciones: {
                        where: { activo: true },
                        include: {
                          empresa: true,
                          departamento: true
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

    // Procesar datos de asignaciones
    const processedAsignaciones = asignaciones.map(movement => {
      const equipo = movement.computador || movement.dispositivo;
      const tipoEquipo = movement.itemType;
      
      // Obtener información del modelo del equipo
      let modeloInfo = 'N/A';
      if (
        equipo &&
        'computadorModelos' in equipo &&
        Array.isArray(equipo.computadorModelos) &&
        equipo.computadorModelos.length > 0 &&
        equipo.computadorModelos[0]?.modeloEquipo
      ) {
        const modelo = equipo.computadorModelos[0].modeloEquipo;
        const marca = Array.isArray(modelo.marcaModelos) && modelo.marcaModelos.length > 0 ? modelo.marcaModelos[0].marca : undefined;
        modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
      } else if (
        equipo &&
        'dispositivoModelos' in equipo &&
        Array.isArray(equipo.dispositivoModelos) &&
        equipo.dispositivoModelos.length > 0 &&
        equipo.dispositivoModelos[0]?.modeloEquipo
      ) {
        const modelo = equipo.dispositivoModelos[0].modeloEquipo;
        const marca = Array.isArray(modelo.marcaModelos) && modelo.marcaModelos.length > 0 ? modelo.marcaModelos[0].marca : undefined;
        modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
      }

      // Obtener información del empleado y organización
      const organizacion = movement.targetEmpleado?.organizaciones?.[0];
      const departamento = organizacion?.departamento;
      const empresa = organizacion?.empresa;

      return {
        id: `asig-${movement.id}`,
        fecha: movement.date,
        accion: movement.actionType,
        motivo: movement.motivo,
        notas: movement.notes,
        localidad: movement.ubicacion?.nombre || null,
        tipoMovimiento: 'asignacion',
        
        // Información del equipo
        equipo: {
          tipo: tipoEquipo,
          serial: equipo?.serial || 'N/A',
          modelo: modeloInfo,
          estado: equipo?.estado || 'N/A'
        },
        
        // Información del destino
        destino: {
          tipo: movement.targetType,
          empleado: movement.targetEmpleado ? 
            `${movement.targetEmpleado.nombre} ${movement.targetEmpleado.apellido}` : null,
          departamento: departamento?.nombre || null,
          empresa: empresa?.nombre || null
        },
        
        // Información de la empresa actual del equipo
        empresaActual: {
          viaEmpleado: empresa?.nombre || null,
          nombre: empresa?.nombre || 'Sin empresa'
        },
        
    // Gerente removido de los reportes
      };
    });

    // Procesar datos de historial de modificaciones (cambios de estado y especificaciones)
    const processedModificaciones = historialModificaciones.map(mod => {
      const equipo = mod.computador;
      const tipoEquipo = 'Computador';
      
      // Obtener información del modelo del equipo
      let modeloInfo = 'N/A';
      if (Array.isArray(equipo?.computadorModelos) && equipo.computadorModelos.length > 0 && equipo.computadorModelos[0]?.modeloEquipo) {
        const modelo = equipo.computadorModelos[0].modeloEquipo;
        const marca = Array.isArray(modelo.marcaModelos) && modelo.marcaModelos.length > 0 ? modelo.marcaModelos[0].marca : undefined;
        modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
      }

      // Obtener información del empleado actual del equipo
      const asignacionActiva = equipo?.asignaciones?.[0];
      const empleadoActual = asignacionActiva?.targetEmpleado;
      const organizacionActual = empleadoActual?.organizaciones?.[0];
      const departamentoActual = organizacionActual?.departamento;
      const empresaActual = organizacionActual?.empresa;
      
      // Determinar el tipo de modificación para mejor categorización
      let accionTipo = 'Modificación';
      if (mod.campo === 'estado') {
        accionTipo = 'Cambio de Estado';
      } else if (['serial', 'modelo', 'marca'].includes(mod.campo)) {
        accionTipo = 'Modificación de Especificaciones';
      } else if (['empleadoId', 'ubicacionId'].includes(mod.campo)) {
        accionTipo = 'Cambio de Asignación';
      }
      
      return {
        id: `mod-${mod.id}`,
        fecha: mod.fecha,
        accion: accionTipo,
        motivo: `${mod.campo}: ${mod.valorAnterior || 'N/A'} → ${mod.valorNuevo || 'N/A'}`,
        notas: `Campo modificado: ${mod.campo}`,
        localidad: null,
        tipoMovimiento: 'modificacion',
        
        // Información del equipo
        equipo: {
          tipo: tipoEquipo,
          serial: equipo?.serial || 'N/A',
          modelo: modeloInfo,
          estado: equipo?.estado || 'N/A'
        },
        
        // Información del destino (empleado actual del equipo)
        destino: {
          tipo: 'Equipo',
          empleado: empleadoActual ? 
            `${empleadoActual.nombre} ${empleadoActual.apellido}` : null,
          departamento: departamentoActual?.nombre || null,
          empresa: empresaActual?.nombre || null
        },
        
        // Información de la empresa actual del equipo
        empresaActual: {
          viaEmpleado: empresaActual?.nombre || null,
          nombre: empresaActual?.nombre || 'Sin empresa'
        },
        
        // Gerente removido de los reportes
      };
    });

    // Combinar movimientos
    const allMovements = [...processedAsignaciones, ...processedModificaciones];

    console.log(`📊 Movimientos encontrados: ${allMovements.length} (${processedAsignaciones.length} asignaciones, ${processedModificaciones.length} modificaciones)`);

    // Aplicar filtros adicionales que no se pueden aplicar en la consulta SQL
    let filteredMovements = allMovements;
    
    if (empresaId) {
      const beforeFilter = filteredMovements.length;
      filteredMovements = filteredMovements.filter(movement => {
        // Buscar por empresa en el destino o en la empresa actual
        const empresaViaDestino = movement.destino.empresa;
        const empresaViaActual = movement.empresaActual.nombre;
        
        return empresaViaDestino === empresaId || empresaViaActual === empresaId;
      });
      console.log(`🔍 Filtro por empresa ${empresaId}: ${beforeFilter} → ${filteredMovements.length}`);
    }

    if (departamentoId) {
      const beforeFilter = filteredMovements.length;
      filteredMovements = filteredMovements.filter(movement => {
        // Buscar por departamento en el destino
        const departamentoViaDestino = movement.destino.departamento;
        return departamentoViaDestino === departamentoId;
      });
      console.log(`🔍 Filtro por departamento ${departamentoId}: ${beforeFilter} → ${filteredMovements.length}`);
    }

    if (estadoEquipo) {
      const beforeFilter = filteredMovements.length;
      filteredMovements = filteredMovements.filter(movement => {
        return movement.equipo.estado === estadoEquipo;
      });
      console.log(`🔍 Filtro por estado ${estadoEquipo}: ${beforeFilter} → ${filteredMovements.length}`);
    }

    // Ordenar por fecha
    filteredMovements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    console.log(`📊 Movimientos finales después de filtros: ${filteredMovements.length}`);

    // Generar estadísticas enfocadas en movimientos del negocio
    const stats = {
      totalMovimientos: filteredMovements.length,
      porTipoAccion: filteredMovements.reduce((acc, mov) => {
        acc[mov.accion] = (acc[mov.accion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porTipoEquipo: filteredMovements.reduce((acc, mov) => {
        acc[mov.equipo.tipo] = (acc[mov.equipo.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porTipoMovimiento: filteredMovements.reduce((acc, mov) => {
        acc[mov.tipoMovimiento] = (acc[mov.tipoMovimiento] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porEmpresa: filteredMovements.reduce((acc, mov) => {
        const empresa = mov.empresaActual.nombre;
        acc[empresa] = (acc[empresa] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      // Estadísticas específicas para cambios de estado
      cambiosEstado: filteredMovements.filter(mov => mov.accion === 'Cambio de Estado').length,
      modificacionesEspecificaciones: filteredMovements.filter(mov => mov.accion === 'Modificación de Especificaciones').length,
      asignaciones: filteredMovements.filter(mov => mov.tipoMovimiento === 'asignacion').length
    };

    // Obtener rangos de fechas para contexto
    const dateRange = {
      inicio: start,
      fin: end,
      dias: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    };

    return NextResponse.json({
      success: true,
      data: {
        movimientos: filteredMovements,
        estadisticas: stats,
        rangoFechas: dateRange,
        filtros: {
          startDate,
          endDate,
          actionType,
          itemType,
          estadoEquipo,
          empresaId,
          departamentoId,
          empleadoId
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de movimientos:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


