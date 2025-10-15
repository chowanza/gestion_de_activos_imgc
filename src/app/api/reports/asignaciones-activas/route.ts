import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const empresaId = searchParams.get('empresaId');
    const departamentoId = searchParams.get('departamentoId');
    const empleadoId = searchParams.get('empleadoId');
    const estadoEquipo = searchParams.get('estadoEquipo');

    console.log('🔍 API Asignaciones Activas - Parámetros recibidos:', {
      startDate, endDate, empresaId, departamentoId, empleadoId, estadoEquipo
    });

    // Construir filtros para asignaciones activas
    const asignacionesWhere: any = {
      activo: true,
      actionType: 'Assignment' // Solo asignaciones, no devoluciones
    };

    // Filtros de fecha
    if (startDate && endDate) {
      asignacionesWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Filtros por empleado
    if (empleadoId) {
      asignacionesWhere.targetEmpleadoId = empleadoId;
    }

    // Obtener asignaciones activas con toda la información relacionada
    const asignaciones = await prisma.asignacionesEquipos.findMany({
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
                departamento: true,
                cargo: true
              }
            }
          }
        },
        ubicacion: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    console.log(`📊 Asignaciones activas encontradas: ${asignaciones.length}`);

    // Procesar datos de asignaciones activas
    const processedAsignaciones = asignaciones.map(asignacion => {
      const equipo = asignacion.computador || asignacion.dispositivo;
      const tipoEquipo = asignacion.itemType;

      // Obtener información del modelo del equipo (type guard)
      let modeloInfo = 'N/A';
      if (equipo && 'computadorModelos' in equipo && Array.isArray(equipo.computadorModelos) && equipo.computadorModelos[0]?.modeloEquipo) {
        const modelo = equipo.computadorModelos[0].modeloEquipo;
        const marca = modelo.marcaModelos?.[0]?.marca;
        modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
      } else if (equipo && 'dispositivoModelos' in equipo && Array.isArray(equipo.dispositivoModelos) && equipo.dispositivoModelos[0]?.modeloEquipo) {
        const modelo = equipo.dispositivoModelos[0].modeloEquipo;
        const marca = modelo.marcaModelos?.[0]?.marca;
        modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
      }

      // Obtener información del empleado y organización
      const organizacion = asignacion.targetEmpleado?.organizaciones?.[0];
      const departamento = organizacion?.departamento;
      const empresa = organizacion?.empresa;
      const cargo = organizacion?.cargo;

      return {
        id: asignacion.id,
        fechaAsignacion: asignacion.date,
        tipoEquipo: tipoEquipo,
        equipo: {
          serial: equipo?.serial || 'N/A',
          modelo: modeloInfo,
          estado: equipo?.estado || 'N/A',
          codigoImgc: equipo?.codigoImgc || 'N/A'
        },
        empleado: {
          nombre: asignacion.targetEmpleado ? 
            `${asignacion.targetEmpleado.nombre} ${asignacion.targetEmpleado.apellido}` : 'N/A',
          cedula: asignacion.targetEmpleado?.ced || 'N/A',
          cargo: cargo?.nombre || 'Sin cargo',
          departamento: departamento?.nombre || 'Sin departamento',
          empresa: empresa?.nombre || 'Sin empresa'
        },
        ubicacion: {
          nombre: asignacion.ubicacion?.nombre || 'Sin ubicación',
          direccion: asignacion.ubicacion?.direccion || 'Sin dirección',
          piso: asignacion.ubicacion?.piso || 'Sin piso',
          sala: asignacion.ubicacion?.sala || 'Sin sala'
        },
        motivo: asignacion.motivo || 'Sin motivo especificado'
      };
    });

    // Aplicar filtros adicionales que no se pueden aplicar en la consulta SQL
    let filteredAsignaciones = processedAsignaciones;
    
    if (empresaId) {
      const beforeFilter = filteredAsignaciones.length;
      filteredAsignaciones = filteredAsignaciones.filter(asig => 
        asig.empleado.empresa === empresaId
      );
      console.log(`🔍 Filtro por empresa ${empresaId}: ${beforeFilter} → ${filteredAsignaciones.length}`);
    }

    if (departamentoId) {
      const beforeFilter = filteredAsignaciones.length;
      filteredAsignaciones = filteredAsignaciones.filter(asig => 
        asig.empleado.departamento === departamentoId
      );
      console.log(`🔍 Filtro por departamento ${departamentoId}: ${beforeFilter} → ${filteredAsignaciones.length}`);
    }

    if (estadoEquipo) {
      const beforeFilter = filteredAsignaciones.length;
      filteredAsignaciones = filteredAsignaciones.filter(asig => 
        asig.equipo.estado === estadoEquipo
      );
      console.log(`🔍 Filtro por estado ${estadoEquipo}: ${beforeFilter} → ${filteredAsignaciones.length}`);
    }

    // Generar estadísticas
    const stats = {
      totalAsignaciones: filteredAsignaciones.length,
      porTipoEquipo: filteredAsignaciones.reduce((acc, asig) => {
        acc[asig.tipoEquipo] = (acc[asig.tipoEquipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porEstado: filteredAsignaciones.reduce((acc, asig) => {
        acc[asig.equipo.estado] = (acc[asig.equipo.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porEmpresa: filteredAsignaciones.reduce((acc, asig) => {
        acc[asig.empleado.empresa] = (acc[asig.empleado.empresa] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porDepartamento: filteredAsignaciones.reduce((acc, asig) => {
        acc[asig.empleado.departamento] = (acc[asig.empleado.departamento] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    // Obtener rango de fechas para contexto
    const dateRange = startDate && endDate ? {
      inicio: startDate,
      fin: endDate,
      dias: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        asignaciones: filteredAsignaciones,
        estadisticas: stats,
        rangoFechas: dateRange,
        filtros: {
          startDate,
          endDate,
          empresaId,
          departamentoId,
          empleadoId,
          estadoEquipo
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de asignaciones activas:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

