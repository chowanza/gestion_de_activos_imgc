import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const actionType = searchParams.get('actionType');
    const itemType = searchParams.get('itemType');
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

    if (departamentoId) {
      where.targetDepartamentoId = departamentoId;
    }

    // Obtener movimientos con relaciones completas
    const movements = await prisma.asignaciones.findMany({
      where,
      include: {
        targetEmpleado: {
          include: {
            departamento: {
              include: { empresa: true }
            }
          }
        },
        targetDepartamento: {
          include: { empresa: true }
        },
        gerenteEmpleado: true,
        computador: {
          include: {
            modelo: { include: { marca: true } },
            empleado: {
              include: {
                departamento: {
                  include: { empresa: true }
                }
              }
            },
            departamento: {
              include: { empresa: true }
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
            },
            departamento: {
              include: { empresa: true }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Filtrar por empresa si se especifica
    let filteredMovements = movements;
    if (empresaId) {
      filteredMovements = movements.filter(movement => {
        const empresaViaEmpleado = movement.targetEmpleado?.departamento?.empresa?.id;
        const empresaViaDepartamento = movement.targetDepartamento?.empresa?.id;
        const empresaViaComputador = movement.computador?.empleado?.departamento?.empresa?.id || 
                                   movement.computador?.departamento?.empresa?.id;
        const empresaViaDispositivo = movement.dispositivo?.empleado?.departamento?.empresa?.id || 
                                    movement.dispositivo?.departamento?.empresa?.id;
        
        return empresaViaEmpleado === empresaId || 
               empresaViaDepartamento === empresaId ||
               empresaViaComputador === empresaId ||
               empresaViaDispositivo === empresaId;
      });
    }

    // Procesar datos para el reporte
    const processedMovements = filteredMovements.map(movement => {
      const equipo = movement.computador || movement.dispositivo;
      const tipoEquipo = movement.itemType;
      
      return {
        id: movement.id,
        fecha: movement.date,
        accion: movement.actionType,
        motivo: movement.motivo,
        notas: movement.notes,
        localidad: movement.localidad,
        gerente: movement.gerenteEmpleado ? 
          `${movement.gerenteEmpleado.nombre} ${movement.gerenteEmpleado.apellido}` : 
          movement.gerente,
        
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
          departamento: movement.targetDepartamento?.nombre || null,
          empresa: movement.targetEmpleado?.departamento?.empresa?.nombre || 
                  movement.targetDepartamento?.empresa?.nombre || null
        },
        
        // Información de la empresa actual del equipo
        empresaActual: {
          viaEmpleado: equipo?.empleado?.departamento?.empresa?.nombre || null,
          viaDepartamento: equipo?.departamento?.empresa?.nombre || null,
          nombre: equipo?.empleado?.departamento?.empresa?.nombre || 
                 equipo?.departamento?.empresa?.nombre || 'Sin empresa'
        }
      };
    });

    // Generar estadísticas
    const stats = {
      totalMovimientos: processedMovements.length,
      porTipoAccion: processedMovements.reduce((acc, mov) => {
        acc[mov.accion] = (acc[mov.accion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porTipoEquipo: processedMovements.reduce((acc, mov) => {
        acc[mov.equipo.tipo] = (acc[mov.equipo.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porEmpresa: processedMovements.reduce((acc, mov) => {
        const empresa = mov.empresaActual.nombre;
        acc[empresa] = (acc[empresa] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
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
        movimientos: processedMovements,
        estadisticas: stats,
        rangoFechas: dateRange,
        filtros: {
          startDate,
          endDate,
          actionType,
          itemType,
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


