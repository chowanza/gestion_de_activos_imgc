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
      // Count unique equipos assigned to empleados of this empresa using asignacionesEquipos
      const asignaciones = await prisma.asignacionesEquipos.findMany({
        where: {
          activo: true,
          targetEmpleado: {
            organizaciones: {
              some: {
                activo: true,
                empresaId: empresa.id
              }
            }
          }
        },
        select: {
          computadorId: true,
          dispositivoId: true,
          targetEmpleadoId: true,
          id: true,
          ubicacionId: true
        }
      });

  const computadoresSet = new Set<string>();
  const dispositivosSet = new Set<string>();
  const empleadosSet = new Set<string>();

      asignaciones.forEach(a => {
        if (a.computadorId) computadoresSet.add(a.computadorId);
        if (a.dispositivoId) dispositivosSet.add(a.dispositivoId);
        if (a.targetEmpleadoId) empleadosSet.add(a.targetEmpleadoId);
      });

  const computadoresCount = computadoresSet.size;
  const dispositivosCount = dispositivosSet.size;

      // Count empleados (active organizational assignments)
      const empleadosCount = await prisma.empleado.count({
        where: {
          organizaciones: {
            some: {
              activo: true,
              empresaId: empresa.id
            }
          }
        }
      });

      // Cobertura: porcentaje de empleados de la empresa con al menos un equipo asignado
      const withAny = empleadosSet.size;
      const coveragePercentage = empleadosCount > 0
        ? parseFloat(((withAny / empleadosCount) * 100).toFixed(1))
        : 0;

      // Departments belonging to this company
      const departamentos = await prisma.departamento.findMany({
        where: {
          empresaDepartamentos: {
            some: { empresaId: empresa.id }
          }
        }
      });

      // For each department compute unique assigned equipos using asignacionesEquipos
      const departamentosStats = await Promise.all(departamentos.map(async (dept) => {
        const deptAsigns = await prisma.asignacionesEquipos.findMany({
          where: {
            activo: true,
            targetEmpleado: {
              organizaciones: {
                some: {
                  activo: true,
                  empresaId: empresa.id,
                  departamentoId: dept.id
                }
              }
            }
          },
          select: { computadorId: true, dispositivoId: true }
        });

        const deptComputadores = new Set<string>();
        const deptDispositivos = new Set<string>();
        deptAsigns.forEach(a => {
          if (a.computadorId) deptComputadores.add(a.computadorId);
          if (a.dispositivoId) deptDispositivos.add(a.dispositivoId);
        });

        const empleadosActivos = await prisma.empleado.count({
          where: {
            organizaciones: {
              some: {
                activo: true,
                departamentoId: dept.id,
                empresaId: empresa.id
              }
            }
          }
        });

        const totalEquipos = deptComputadores.size + deptDispositivos.size;
        const totalEmpresa = computadoresCount + dispositivosCount;
        const porcentaje = totalEmpresa > 0 ? parseFloat(((totalEquipos / totalEmpresa) * 100).toFixed(1)) : 0;

        return {
          name: dept.nombre,
          computers: deptComputadores.size,
          devices: deptDispositivos.size,
          users: empleadosActivos,
          percentage: porcentaje
        };
      }));

      return {
        id: empresa.id,
        name: empresa.nombre,
        computers: computadoresCount,
        devices: dispositivosCount,
        total: computadoresCount + dispositivosCount,
        users: empleadosCount,
        coveragePercentage,
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
    // Usar la vista vw_ubicacion_actual para contar la ubicación actual por equipo.
    const ubicacionStats = await Promise.all(ubicaciones.map(async (ubicacion) => {
      try {
        const counts: any = await prisma.$queryRawUnsafe(`
          SELECT
            SUM(CASE WHEN tipo = 'C' THEN 1 ELSE 0 END) AS computadores,
            SUM(CASE WHEN tipo = 'D' THEN 1 ELSE 0 END) AS dispositivos
          FROM dbo.vw_ubicacion_actual v
          WHERE v.ubicacionId = '${ubicacion.id}'
        `);

        const computadores = (counts && counts[0] && counts[0].computadores) ? parseInt(counts[0].computadores) : 0;
        const dispositivos = (counts && counts[0] && counts[0].dispositivos) ? parseInt(counts[0].dispositivos) : 0;

        return {
          id: ubicacion.id,
          name: ubicacion.nombre,
          computers: computadores,
          devices: dispositivos,
          total: computadores + dispositivos
        };
      } catch (err) {
        // Si la vista no existe, reconstruimos la lógica: tomar la última asignación por equipo
        console.warn('Advertencia: imposible usar vw_ubicacion_actual para', ubicacion.id, '- aplicando fallback a última asignación por equipo', err);
        try {
          // Obtener todas las asignaciones con ubicacion (podemos limitar a aquellas con ubicacion no nula)
          const allAsigns = await prisma.asignacionesEquipos.findMany({
            where: { OR: [{ computadorId: { not: null } }, { dispositivoId: { not: null } }] },
            orderBy: { date: 'desc' },
            select: { id: true, computadorId: true, dispositivoId: true, ubicacionId: true }
          });

          const latestMap = new Map<string, any>();
          for (const a of allAsigns) {
            const key = a.computadorId ? `C:${a.computadorId}` : a.dispositivoId ? `D:${a.dispositivoId}` : null;
            if (!key) continue;
            if (!latestMap.has(key)) latestMap.set(key, a);
          }

          let computadores = 0;
          let dispositivos = 0;
          for (const [, a] of latestMap) {
            if (a.ubicacionId === ubicacion.id) {
              if (a.computadorId) computadores++;
              if (a.dispositivoId) dispositivos++;
            }
          }

          return { id: ubicacion.id, name: ubicacion.nombre, computers: computadores, devices: dispositivos, total: computadores + dispositivos };
        } catch (err2) {
          console.error('Error en fallback contando asignaciones para', ubicacion.id, err2);
          return { id: ubicacion.id, name: ubicacion.nombre, computers: 0, devices: 0, total: 0 };
        }
      }
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
