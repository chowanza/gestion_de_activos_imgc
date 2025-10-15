import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
        asignacionesEquipos: {
          where: { activo: true },
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

    // Procesar datos de ubicaciones
    const processedUbicaciones = ubicaciones.map(ubicacion => {
      const asignaciones = ubicacion.asignacionesEquipos || [];
      
      // Procesar equipos por ubicación
      const equipos = asignaciones.map(asignacion => {
        const equipo = asignacion.computador || asignacion.dispositivo;
        const tipoEquipo = asignacion.itemType;
        
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

        // Obtener información del empleado asignado
        const organizacion = asignacion.targetEmpleado?.organizaciones?.[0];
        const departamento = organizacion?.departamento;
        const empresa = organizacion?.empresa;
        const cargo = organizacion?.cargo;

        return {
          id: equipo?.id || 'N/A',
          tipo: tipoEquipo,
          serial: equipo?.serial || 'N/A',
          codigoImgc: equipo?.codigoImgc || 'N/A',
          modelo: modeloInfo,
          estado: equipo?.estado || 'N/A',
          fechaAsignacion: asignacion.date,
          empleado: {
            nombre: asignacion.targetEmpleado ? 
              `${asignacion.targetEmpleado.nombre} ${asignacion.targetEmpleado.apellido}` : 'Sin asignar',
            cedula: asignacion.targetEmpleado?.ced || 'N/A',
            cargo: cargo?.nombre || 'Sin cargo',
            departamento: departamento?.nombre || 'Sin departamento',
            empresa: empresa?.nombre || 'Sin empresa'
          },
          motivo: asignacion.motivo || 'Sin motivo especificado'
        };
      });

      // Aplicar filtro de estado si se especifica
      let equiposFiltrados = equipos;
      if (estadoEquipo) {
        equiposFiltrados = equipos.filter(equipo => equipo.estado === estadoEquipo);
      }

      // Calcular estadísticas de la ubicación
      const stats = {
        totalEquipos: equiposFiltrados.length,
        computadores: equiposFiltrados.filter(e => e.tipo === 'Computador').length,
        dispositivos: equiposFiltrados.filter(e => e.tipo === 'Dispositivo').length,
        porEstado: equiposFiltrados.reduce((acc, equipo) => {
          acc[equipo.estado] = (acc[equipo.estado] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        porEmpresa: equiposFiltrados.reduce((acc, equipo) => {
          acc[equipo.empleado.empresa] = (acc[equipo.empleado.empresa] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        porDepartamento: equiposFiltrados.reduce((acc, equipo) => {
          acc[equipo.empleado.departamento] = (acc[equipo.empleado.departamento] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
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

