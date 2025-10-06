import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Función para obtener actividad reciente
async function getRecentActivity() {
  try {
    const recentActivities = await prisma.asignacionesEquipos.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        computador: {
          include: {
            computadorModelos: {
              include: {
                modeloEquipo: true
              }
            }
          }
        },
        dispositivo: {
          include: {
            dispositivoModelos: {
              include: {
                modeloEquipo: true
              }
            }
          }
        },
        targetEmpleado: true,
        ubicacion: true
      }
    });

    return recentActivities.map(activity => {
      const equipo = activity.computador || activity.dispositivo;
      const modelo = activity.computador?.computadorModelos?.[0]?.modeloEquipo || 
                    activity.dispositivo?.dispositivoModelos?.[0]?.modeloEquipo;
      
      return {
        id: activity.id,
        type: getActivityType(activity.actionType),
        action: getActivityDescription(activity),
        device: `${modelo?.nombre || 'Equipo'} - ${equipo?.serial || 'N/A'}`,
        user: activity.targetEmpleado ? 
              `${activity.targetEmpleado.nombre} ${activity.targetEmpleado.apellido}` : 
              'Sistema',
        time: formatTimeAgo(activity.date)
      };
    });
  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    return [];
  }
}

// Función auxiliar para determinar el tipo de actividad
function getActivityType(actionType: string) {
  switch (actionType) {
    case 'ASIGNACION': return 'assignment';
    case 'DEVOLUCION': return 'return';
    case 'CAMBIO_ESTADO': return 'maintenance';
    case 'CREACION': return 'registration';
    case 'EDICION': return 'user';
    default: return 'registration';
  }
}

// Función auxiliar para generar descripción de actividad
function getActivityDescription(activity: any) {
  const equipo = activity.computador || activity.dispositivo;
  const tipoEquipo = activity.computador ? 'Computador' : 'Dispositivo';
  
  switch (activity.actionType) {
    case 'ASIGNACION':
      return `Asignado ${tipoEquipo} a ${activity.targetEmpleado?.nombre || 'empleado'}`;
    case 'DEVOLUCION':
      return `Devuelto ${tipoEquipo} por ${activity.targetEmpleado?.nombre || 'empleado'}`;
    case 'CAMBIO_ESTADO':
      return `Cambio de estado del ${tipoEquipo}`;
    case 'CREACION':
      return `Creado ${tipoEquipo} nuevo`;
    case 'EDICION':
      return `Editado ${tipoEquipo}`;
    default:
      return `Acción en ${tipoEquipo}`;
  }
}

// Función auxiliar para formatear tiempo
function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
  return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
}

// Función para obtener estadísticas de empresas
async function getEmpresaStats(empresas: any[]) {
  try {
    const empresaStats = await Promise.all(empresas.map(async (empresa) => {
      // Contar empleados activos por empresa
      const empleadosCount = await prisma.empleado.count({
        where: {
          fechaDesincorporacion: null,
          organizaciones: {
            some: {
              activo: true,
              departamento: {
                empresaDepartamentos: {
                  some: {
                    empresaId: empresa.id
                  }
                }
              }
            }
          }
        }
      });

      // Contar computadores asignados a empleados de esta empresa
      const computadoresCount = await prisma.computador.count({
        where: {
          estado: 'ASIGNADO',
          asignaciones: {
            some: {
              activo: true,
              targetEmpleado: {
                fechaDesincorporacion: null,
                organizaciones: {
                  some: {
                    activo: true,
                    departamento: {
                      empresaDepartamentos: {
                        some: {
                          empresaId: empresa.id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Contar dispositivos asignados a empleados de esta empresa
      const dispositivosCount = await prisma.dispositivo.count({
        where: {
          estado: 'ASIGNADO',
          asignaciones: {
            some: {
              activo: true,
              targetEmpleado: {
                fechaDesincorporacion: null,
                organizaciones: {
                  some: {
                    activo: true,
                    departamento: {
                      empresaDepartamentos: {
                        some: {
                          empresaId: empresa.id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Obtener departamentos de esta empresa con sus estadísticas
      const departamentos = await prisma.departamento.findMany({
        where: {
          empresaDepartamentos: {
            some: {
              empresaId: empresa.id
            }
          }
        },
        include: {
          empleadoOrganizaciones: {
            where: {
              activo: true
            },
            include: {
              empleado: {
                include: {
                  asignacionesComoTarget: {
                    where: {
                      activo: true
                    },
                    include: {
                      computador: true,
                      dispositivo: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Calcular estadísticas por departamento
      const departamentosStats = departamentos.map(dept => {
        const empleadosActivos = dept.empleadoOrganizaciones.length;
        
        let computadoresAsignados = 0;
        let dispositivosAsignados = 0;
        
        dept.empleadoOrganizaciones.forEach(org => {
          if (org.empleado.fechaDesincorporacion === null) {
            org.empleado.asignacionesComoTarget.forEach(asig => {
              if (asig.activo) {
                if (asig.computador) computadoresAsignados++;
                if (asig.dispositivo) dispositivosAsignados++;
              }
            });
          }
        });

        const totalEquipos = computadoresAsignados + dispositivosAsignados;
        const totalEmpresa = computadoresCount + dispositivosCount;
        const porcentaje = totalEmpresa > 0 
          ? parseFloat(((totalEquipos / totalEmpresa) * 100).toFixed(1))
          : 0;

        return {
          name: dept.nombre,
          computers: computadoresAsignados,
          devices: dispositivosAsignados,
          users: empleadosActivos,
          percentage: porcentaje
        };
      });

      return {
        id: empresa.id,
        name: empresa.nombre,
        computers: computadoresCount,
        devices: dispositivosCount,
        total: computadoresCount + dispositivosCount,
        users: empleadosCount,
        departamentos: departamentosStats
      };
    }));

    return empresaStats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de empresas:', error);
    return empresas.map(empresa => ({
      id: empresa.id,
      name: empresa.nombre,
      computers: 0,
      devices: 0,
      total: 0,
      users: 0,
      departamentos: []
    }));
  }
}

// Función para obtener estadísticas de ubicaciones
async function getUbicacionStats(ubicaciones: any[]) {
  try {
    const ubicacionStats = await Promise.all(ubicaciones.map(async (ubicacion) => {
      // Contar TODOS los computadores en esta ubicación (no solo ASIGNADO)
      const computadoresCount = await prisma.computador.count({
        where: {
          asignaciones: {
            some: {
              activo: true,
              ubicacionId: ubicacion.id
            }
          }
        }
      });

      // Contar TODOS los dispositivos en esta ubicación (no solo ASIGNADO)
      const dispositivosCount = await prisma.dispositivo.count({
        where: {
          asignaciones: {
            some: {
              activo: true,
              ubicacionId: ubicacion.id
            }
          }
        }
      });

      return {
        id: ubicacion.id,
        name: ubicacion.nombre,
        computers: computadoresCount,
        devices: dispositivosCount,
        total: computadoresCount + dispositivosCount
      };
    }));

    return ubicacionStats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de ubicaciones:', error);
    return ubicaciones.map(ubicacion => ({
      id: ubicacion.id,
      name: ubicacion.nombre,
      computers: 0,
      devices: 0,
      total: 0
    }));
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Obteniendo estadísticas del dashboard...');

    // --- 1. ESTADÍSTICAS BÁSICAS ---
    const [
      totalComputadores,
      totalDispositivos,
      totalEmpleados,
      totalEmpresas,
      totalDepartamentos,
      totalUbicaciones
    ] = await Promise.all([
      prisma.computador.count(),
      prisma.dispositivo.count(),
      prisma.empleado.count(),
      prisma.empresa.count(),
      prisma.departamento.count(),
      prisma.ubicacion.count()
    ]);

    // --- 2. ESTADÍSTICAS POR ESTADO ---
    const [computadorEstados, dispositivoEstados] = await Promise.all([
      prisma.computador.groupBy({
        by: ['estado'],
        _count: { estado: true },
      }),
      prisma.dispositivo.groupBy({
        by: ['estado'],
        _count: { estado: true },
      }),
    ]);

    // --- 3. DATOS BÁSICOS ---
    const departamentos = await prisma.departamento.findMany();
    const empresas = await prisma.empresa.findMany();
    const ubicaciones = await prisma.ubicacion.findMany();
    const empleados = await prisma.empleado.findMany();

    // Mapear datos básicos
    const departmentStats = departamentos.map(dept => ({
      name: dept.nombre,
      computers: 0,
      users: 0,
      percentage: 0,
    }));

    const empresaStats = await getEmpresaStats(empresas);

    const ubicacionStats = await getUbicacionStats(ubicaciones);

    const empleadoStats = empleados.map(empleado => ({
      name: `${empleado.nombre} ${empleado.apellido}`,
      computers: 0,
      devices: 0,
      total: 0,
      departamento: 'Sin departamento',
      empresa: 'Sin empresa',
    }));

    // --- 4. CALCULAR ESTADÍSTICAS ADICIONALES ---
    const totalAsignados = (computadorEstados.find(e => e.estado === 'ASIGNADO')?._count.estado || 0) +
                          (dispositivoEstados.find(e => e.estado === 'ASIGNADO')?._count.estado || 0);
    
    const totalOperativos = (computadorEstados.find(e => e.estado === 'OPERATIVO')?._count.estado || 0) +
                           (dispositivoEstados.find(e => e.estado === 'OPERATIVO')?._count.estado || 0);
    
    const totalDeBaja = (computadorEstados.find(e => e.estado === 'DE_BAJA')?._count.estado || 0) +
                       (dispositivoEstados.find(e => e.estado === 'DE_BAJA')?._count.estado || 0);
    
    const totalEnMantenimiento = (computadorEstados.find(e => e.estado === 'EN_MANTENIMIENTO')?._count.estado || 0) +
                                (dispositivoEstados.find(e => e.estado === 'EN_MANTENIMIENTO')?._count.estado || 0);
    
    const totalEnResguardo = (computadorEstados.find(e => e.estado === 'EN_RESGUARDO')?._count.estado || 0) +
                            (dispositivoEstados.find(e => e.estado === 'EN_RESGUARDO')?._count.estado || 0);

    // --- 5. CONSTRUIR RESPUESTA ---
    const dashboardData = {
      // Estadísticas básicas
      totalComputadores,
      totalDispositivos,
      totalEmpleados,
      totalEmpresas,
      totalDepartamentos,
      totalUbicaciones,
      
      // Alias para compatibilidad
      totalEquipos: totalComputadores + totalDispositivos,
      totalComputers: totalComputadores,
      totalDevices: totalDispositivos,
      totalUsers: totalEmpleados,
      
      // Estadísticas por estado (combinadas de computadores y dispositivos)
      computadorEstados: computadorEstados.map(estado => ({
        estado: estado.estado,
        count: estado._count.estado,
      })),
      dispositivoEstados: dispositivoEstados.map(estado => ({
        estado: estado.estado,
        count: estado._count.estado,
      })),
      
      // Estadísticas detalladas
      departmentStats,
      empresaStats,
      ubicacionStats,
      empleadoStats,
      
      // Estadísticas adicionales (basadas en datos reales)
      equiposOperativos: totalOperativos,
      equiposDeBaja: totalDeBaja,
      equiposEnMantenimiento: totalEnMantenimiento,
      equiposEnResguardo: totalEnResguardo,
      assignedEquipos: totalAsignados,
      
      // Estadísticas de estado para gráficos con porcentajes
      computadorEstadoStats: computadorEstados.map(estado => {
        const percentage = totalComputadores > 0 
          ? parseFloat(((estado._count.estado / totalComputadores) * 100).toFixed(1))
          : 0;
        return {
          estado: estado.estado,
          count: estado._count.estado,
          percentage: percentage
        };
      }),
      dispositivoEstadoStats: dispositivoEstados.map(estado => {
        const percentage = totalDispositivos > 0 
          ? parseFloat(((estado._count.estado / totalDispositivos) * 100).toFixed(1))
          : 0;
        return {
          estado: estado.estado,
          count: estado._count.estado,
          percentage: percentage
        };
      }),
      
      // Trends (simplificados)
      computadoresTrend: 0,
      dispositivosTrend: 0,
      empleadosTrend: 0,
      bajaTrend: 0,
      mantenimientoTrend: 0,
      
      // Actividad reciente (obtenida de AsignacionesEquipos)
      recentActivity: await getRecentActivity(),
    };

    // Debug: verificar datos de donut charts
    console.log('📊 Computador Estados:', computadorEstados);
    console.log('📊 Dispositivo Estados:', dispositivoEstados);
    console.log('📊 Computador Estado Stats:', dashboardData.computadorEstadoStats);
    console.log('📊 Dispositivo Estado Stats:', dashboardData.dispositivoEstadoStats);
    console.log('📊 Totales - Computadores:', totalComputadores, 'Dispositivos:', totalDispositivos);
    
    console.log('✅ Dashboard data generado exitosamente');
    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas del dashboard:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
