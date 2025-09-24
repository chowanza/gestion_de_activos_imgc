import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    // Construir filtros
    const where: any = {
      date: {
        gte: start,
        lte: end
      }
    };

    if (actionType) {
      where.actionType = actionType;
    }

    if (itemType) {
      where.itemType = itemType;
    }

    if (empleadoId) {
      where.OR = [
        { targetEmpleadoId: empleadoId },
        { gerenteId: empleadoId }
      ];
    }

    // Nota: targetDepartamentoId ya no existe, se filtra por empleado
    // if (departamentoId) {
    //   where.targetDepartamentoId = departamentoId;
    // }

    // Obtener solo movimientos relevantes para el negocio (no auditoría general)
    const [asignaciones, historialModificaciones] = await Promise.all([
      // Asignaciones (asignaciones, devoluciones, transferencias)
      prisma.asignaciones.findMany({
        where,
        include: {
          targetEmpleado: {
            include: {
              departamento: {
                include: { empresa: true }
              }
            }
          },
          computador: {
            include: {
              modelo: { include: { marca: true } },
              empleado: {
                include: {
                  departamento: {
                    include: { empresa: true }
                  }
                }
              }
            }
          },
          dispositivo: {
            include: {
              modelo: { include: { marca: true } },
              empleado: {
                include: {
                  departamento: {
                    include: { empresa: true }
                  }
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
        where: {
          fecha: {
            gte: start,
            lte: end
          }
        },
        include: {
          computador: {
            include: {
              modelo: { include: { marca: true } },
              empleado: {
                include: {
                  departamento: {
                    include: { empresa: true }
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
          modelo: equipo?.modelo ? 
            `${equipo.modelo.marca.nombre} ${equipo.modelo.nombre}` : 'N/A',
          estado: equipo?.estado || 'N/A'
        },
        
        // Información del destino
        destino: {
          tipo: movement.targetType,
          empleado: movement.targetEmpleado ? 
            `${movement.targetEmpleado.nombre} ${movement.targetEmpleado.apellido}` : null,
          departamento: movement.targetEmpleado?.departamento?.nombre || null,
          empresa: movement.targetEmpleado?.departamento?.empresa?.nombre || null
        },
        
        // Información de la empresa actual del equipo
        empresaActual: {
          viaEmpleado: equipo?.empleado?.departamento?.empresa?.nombre || null,
          nombre: equipo?.empleado?.departamento?.empresa?.nombre || 'Sin empresa'
        }
      };
    });

    // Procesar datos de historial de modificaciones (cambios de estado y especificaciones)
    const processedModificaciones = historialModificaciones.map(mod => {
      const equipo = mod.computador;
      const tipoEquipo = 'Computador';
      
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
          modelo: equipo?.modelo ? 
            `${equipo.modelo.marca.nombre} ${equipo.modelo.nombre}` : 'N/A',
          estado: equipo?.estado || 'N/A'
        },
        
        // Información del destino
        destino: {
          tipo: 'Equipo',
          empleado: equipo?.empleado ? 
            `${equipo.empleado.nombre} ${equipo.empleado.apellido}` : null,
          departamento: equipo?.empleado?.departamento?.nombre || null,
          empresa: equipo?.empleado?.departamento?.empresa?.nombre || null
        },
        
        // Información de la empresa actual del equipo
        empresaActual: {
          viaEmpleado: equipo?.empleado?.departamento?.empresa?.nombre || null,
          nombre: equipo?.empleado?.departamento?.empresa?.nombre || 'Sin empresa'
        }
      };
    });

    // Combinar solo movimientos relevantes para el negocio
    const allMovements = [...processedAsignaciones, ...processedModificaciones];

    // Aplicar filtros adicionales
    let filteredMovements = allMovements;
    
    if (empresaId) {
      filteredMovements = filteredMovements.filter(movement => {
        const empresaViaEmpleado = movement.destino.empresa;
        const empresaViaComputador = movement.empresaActual.nombre;
        
        return empresaViaEmpleado === empresaId || 
               empresaViaComputador === empresaId;
      });
    }

    if (estadoEquipo) {
      filteredMovements = filteredMovements.filter(movement => {
        return movement.equipo.estado === estadoEquipo;
      });
    }

    // Ordenar por fecha
    filteredMovements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

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


