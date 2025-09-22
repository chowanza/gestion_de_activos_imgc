import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/stats
 *
 * Endpoint unificado para obtener todas las estadísticas necesarias para el dashboard de inventario.
 */
export async function GET() {
  try {
    // --- 1. CONTEOS GLOBALES (TARJETAS PRINCIPALES) ---
    // Usamos Promise.all para ejecutar todas las consultas de conteo en paralelo para mayor eficiencia.
    const [
      totalUsers,
      totalDevices, // Total de Dispositivos (Monitores, Impresoras, etc.)
      totalComputers,
      assignedComputers,
      storedComputers,
      storedDevices, // Dispositivos en resguardo
    ] = await Promise.all([
      prisma.empleado.count(),
      prisma.dispositivo.count(),
      prisma.computador.count(),
      // Un computador está "Asignado" si su estado es "Asignado"
      prisma.computador.count({
        where: {
          estado: "Asignado",
        },
      }),
      // Equipos en resguardo (guardados pero no operativos)
      prisma.computador.count({
        where: {
          estado: "En resguardo",
        },
      }),
      // Dispositivos en resguardo
      prisma.dispositivo.count({
        where: {
          estado: "En resguardo",
        },
      }),
    ]);

    // Calcular equipos operativos (disponibles para uso)
    const equiposOperativos = await Promise.all([
      prisma.computador.count({
        where: {
          estado: "Operativo",
        },
      }),
      prisma.dispositivo.count({
        where: {
          estado: "Operativo",
        },
      }),
    ]);

    // Calcular equipos totales y equipos en resguardo
    const totalEquipos = totalComputers + totalDevices;
    const equiposEnResguardo = storedComputers + storedDevices;
    const totalEquiposOperativos = equiposOperativos[0] + equiposOperativos[1];

    // --- 2. ESTADÍSTICAS POR DEPARTAMENTO ---
    // Obtenemos todos los departamentos y contamos sus computadores y usuarios asociados.
    // El uso de `_count` es mucho más performante que traer los arrays completos.
    const deptsData = await prisma.departamento.findMany({
      include: {
        _count: {
          select: {
            empleados: true,
            computadores: true,
          },
        },
      },
    });

    // Mapeamos los datos para darles el formato que el frontend espera.
    const departmentStats = deptsData.map((dept) => ({
      name: dept.nombre,
      computers: dept._count.computadores,
      users: dept._count.empleados,
      percentage:
        totalComputers > 0
          ? parseFloat(((dept._count.computadores / totalComputers) * 100).toFixed(1))
          : 0,
    }));

    // --- 2.1. ESTADÍSTICAS POR EMPRESA ---
    // Obtenemos todas las empresas con sus departamentos y contamos computadores y usuarios.
    const empresasData = await prisma.empresa.findMany({
      include: {
        departamentos: {
          include: {
            _count: {
              select: {
                empleados: true,
                computadores: true,
                dispositivos: true,
              },
            },
            empleados: {
              include: {
                _count: {
                  select: {
                    computadores: true,
                    dispositivos: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Mapeamos los datos de empresas con sus departamentos.
    const empresaStats = empresasData.map((empresa) => {
      // Computadores asignados directamente a departamentos
      const computersByDept = empresa.departamentos.reduce(
        (sum, dept) => sum + dept._count.computadores,
        0
      );
      
      // Computadores asignados directamente a empleados de la empresa
      const computersByEmployees = empresa.departamentos.reduce(
        (sum, dept) => sum + dept.empleados.reduce(
          (empSum, emp) => empSum + emp._count.computadores,
          0
        ),
        0
      );
      
      // Dispositivos asignados directamente a departamentos
      const devicesByDept = empresa.departamentos.reduce(
        (sum, dept) => sum + dept._count.dispositivos,
        0
      );
      
      // Dispositivos asignados directamente a empleados de la empresa
      const devicesByEmployees = empresa.departamentos.reduce(
        (sum, dept) => sum + dept.empleados.reduce(
          (empSum, emp) => empSum + emp._count.dispositivos,
          0
        ),
        0
      );
      
      const totalComputersEmpresa = computersByDept + computersByEmployees;
      const totalDevicesEmpresa = devicesByDept + devicesByEmployees;
      
      const totalUsersEmpresa = empresa.departamentos.reduce(
        (sum, dept) => sum + dept._count.empleados,
        0
      );

      return {
        name: empresa.nombre,
        computers: totalComputersEmpresa,
        devices: totalDevicesEmpresa,
        total: totalComputersEmpresa + totalDevicesEmpresa,
        users: totalUsersEmpresa,
        departamentos: empresa.departamentos.map((dept) => {
          // Computadores del departamento + computadores de empleados del departamento
          const deptComputers = dept._count.computadores + dept.empleados.reduce(
            (sum, emp) => sum + emp._count.computadores,
            0
          );
          
          // Dispositivos del departamento + dispositivos de empleados del departamento
          const deptDevices = dept._count.dispositivos + dept.empleados.reduce(
            (sum, emp) => sum + emp._count.dispositivos,
            0
          );
          
          return {
            name: dept.nombre,
            computers: deptComputers,
            devices: deptDevices,
            total: deptComputers + deptDevices,
            users: dept._count.empleados,
          };
        }),
      };
    });

    // --- 2.2. ESTADÍSTICAS POR UBICACIÓN ---
    // Obtenemos todas las ubicaciones y contamos sus computadores y dispositivos.
    const ubicacionesData = await prisma.ubicacion.findMany({
      include: {
        _count: {
          select: {
            computadores: true,
            dispositivos: true,
          },
        },
      },
    });

    // Mapeamos los datos de ubicaciones.
    const ubicacionStats = ubicacionesData.map((ubicacion) => ({
      name: ubicacion.nombre,
      computers: ubicacion._count.computadores,
      devices: ubicacion._count.dispositivos,
      total: ubicacion._count.computadores + ubicacion._count.dispositivos,
    }));

    // --- 2.3. ESTADÍSTICAS POR EMPLEADO ---
    // Obtenemos todos los empleados con sus equipos asignados
    const empleadosData = await prisma.empleado.findMany({
      include: {
        _count: {
          select: {
            computadores: true,
            dispositivos: true,
          },
        },
        departamento: {
          select: {
            nombre: true,
            empresa: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    });

    // Mapeamos los datos de empleados
    const empleadoStats = empleadosData.map((empleado) => ({
      name: `${empleado.nombre} ${empleado.apellido}`,
      computers: empleado._count.computadores,
      devices: empleado._count.dispositivos,
      total: empleado._count.computadores + empleado._count.dispositivos,
      departamento: empleado.departamento?.nombre || 'Sin departamento',
      empresa: empleado.departamento?.empresa?.nombre || 'Sin empresa',
    }));

    // --- 3. ESTADÍSTICAS POR ESTADO ---
    // Obtenemos la distribución de estados para computadores y dispositivos
    const [computadorEstados, dispositivoEstados] = await Promise.all([
      prisma.computador.groupBy({
        by: ['estado'],
        _count: {
          estado: true,
        },
      }),
      prisma.dispositivo.groupBy({
        by: ['estado'],
        _count: {
          estado: true,
        },
      }),
    ]);

    // Estados definidos en el sistema
    const estadosDefinidos = ["En resguardo", "Operativo", "Asignado", "Mantenimiento", "De baja"];

    // Mapeamos los datos de estados para computadores, incluyendo estados con 0
    const computadorEstadoStats = estadosDefinidos.map((estado) => {
      const estadoData = computadorEstados.find(item => item.estado === estado);
      const count = estadoData ? estadoData._count.estado : 0;
      return {
        estado,
        count,
        percentage: totalComputers > 0 
          ? parseFloat(((count / totalComputers) * 100).toFixed(1))
          : 0,
      };
    });

    // Mapeamos los datos de estados para dispositivos, incluyendo estados con 0
    const dispositivoEstadoStats = estadosDefinidos.map((estado) => {
      const estadoData = dispositivoEstados.find(item => item.estado === estado);
      const count = estadoData ? estadoData._count.estado : 0;
      return {
        estado,
        count,
        percentage: totalDevices > 0 
          ? parseFloat(((count / totalDevices) * 100).toFixed(1))
          : 0,
      };
    });

    // --- 4. ACTIVIDAD RECIENTE ---
    // Obtenemos las últimas 5 asignaciones/movimientos registrados.
    const recentActivityRaw = await prisma.asignaciones.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        // Incluimos los datos necesarios para describir la actividad.
        targetEmpleado: { select: { nombre: true, apellido: true } },
        computador: { select: { serial: true, modelo: { select: { nombre: true } } } },
        dispositivo: { select: { serial: true, modelo: { select: { nombre: true } } } },
      },
    });
    
    // Mapeamos los datos crudos a un formato más amigable para el frontend.
    const recentActivity = recentActivityRaw.map(activity => {
        let deviceName = "N/A";
        if (activity.itemType === "Computador" && activity.computador) {
            deviceName = `${activity.computador.modelo.nombre} (S/N: ${activity.computador.serial})`;
        } else if (activity.itemType === "Dispositivo" && activity.dispositivo) {
            deviceName = `${activity.dispositivo.modelo.nombre} (S/N: ${activity.dispositivo.serial})`;
        }

        return {
            id: activity.id,
            action: activity.actionType, // Ej: "Asignación", "Devolución"
            device: deviceName,
            user: activity.targetEmpleado ? `${activity.targetEmpleado.nombre} ${activity.targetEmpleado.apellido}` : 'Sistema',
            time: activity.createdAt.toISOString(), // Enviamos fecha en formato ISO, el frontend la formatea.
            type: activity.actionType.toLowerCase().includes('asigna') ? 'assignment' : 'registration', // Lógica simple para el ícono
        }
    });

    // --- 4. DATOS DE TENDENCIAS (PLACEHOLDER) ---
    // Calcular tendencias reales requiere comparar con datos de un período anterior (ej. últimos 30 días).
    // Por ahora, devolvemos un objeto estático para que el frontend no falle.
    const trends = {
      equipos: 8.5, // Tendencia para equipos totales
      asignados: 11.4, // Tendencia para equipos asignados
      resguardo: -1.2, // Tendencia para equipos en resguardo
      operativos: 6.8, // Tendencia para equipos operativos
    };

    // --- 5. RESPUESTA FINAL ---
    // Unimos todos los datos en un solo objeto JSON.
    return NextResponse.json({
      totalUsers,
      totalDevices,
      totalComputers,
      assignedComputers,
      storedComputers,
      totalEquipos, // Equipos totales
      equiposEnResguardo, // Equipos en resguardo
      equiposOperativos: totalEquiposOperativos, // Equipos operativos
      trends,
      departmentStats,
      empresaStats,
      ubicacionStats,
      empleadoStats,
      computadorEstadoStats,
      dispositivoEstadoStats,
      recentActivity,
    });

  } catch (error) {
    console.error("Error al obtener las estadísticas del dashboard:", error);
    // En caso de un error en la base de datos, devolvemos una respuesta de error 500.
    return new NextResponse(
      JSON.stringify({ message: "Error interno del servidor." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}