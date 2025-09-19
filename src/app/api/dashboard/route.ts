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
      // Un computador está "Asignado" si tiene un usuario vinculado y su estado es "Activo".
      prisma.computador.count({
        where: {
          estado: "Asignado", // Puedes ajustar este valor si usas otro (ej: "En Uso")
        },
      }),
      // Un computador está "En Resguardo" si su estado es "Almacenado".
      prisma.computador.count({
        where: {
          estado: "Resguardo",
        },
      }),
      // Dispositivos en resguardo
      prisma.dispositivo.count({
        where: {
          estado: "Resguardo",
        },
      }),
    ]);

    // Calcular equipos totales y equipos en resguardo
    const totalEquipos = totalComputers + totalDevices;
    const equiposEnResguardo = storedComputers + storedDevices;

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
              },
            },
            empleados: {
              include: {
                _count: {
                  select: {
                    computadores: true,
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
      
      const totalComputersEmpresa = computersByDept + computersByEmployees;
      
      const totalUsersEmpresa = empresa.departamentos.reduce(
        (sum, dept) => sum + dept._count.empleados,
        0
      );

      return {
        name: empresa.nombre,
        computers: totalComputersEmpresa,
        users: totalUsersEmpresa,
        percentage:
          totalComputers > 0
            ? parseFloat(((totalComputersEmpresa / totalComputers) * 100).toFixed(1))
            : 0,
        departamentos: empresa.departamentos.map((dept) => {
          // Computadores del departamento + computadores de empleados del departamento
          const deptComputers = dept._count.computadores + dept.empleados.reduce(
            (sum, emp) => sum + emp._count.computadores,
            0
          );
          
          return {
            name: dept.nombre,
            computers: deptComputers,
            users: dept._count.empleados,
            percentage:
              totalComputersEmpresa > 0
                ? parseFloat(((deptComputers / totalComputersEmpresa) * 100).toFixed(1))
                : 0,
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
      percentage:
        (totalComputers + totalDevices) > 0
          ? parseFloat((((ubicacion._count.computadores + ubicacion._count.dispositivos) / (totalComputers + totalDevices)) * 100).toFixed(1))
          : 0,
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

    // Mapeamos los datos de estados para computadores
    const computadorEstadoStats = computadorEstados.map((item) => ({
      estado: item.estado,
      count: item._count.estado,
      percentage: totalComputers > 0 
        ? parseFloat(((item._count.estado / totalComputers) * 100).toFixed(1))
        : 0,
    }));

    // Mapeamos los datos de estados para dispositivos
    const dispositivoEstadoStats = dispositivoEstados.map((item) => ({
      estado: item.estado,
      count: item._count.estado,
      percentage: totalDevices > 0 
        ? parseFloat(((item._count.estado / totalDevices) * 100).toFixed(1))
        : 0,
    }));

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
      users: 5.2,
      devices: 3.1,
      computers: 7.8,
      assigned: 11.4,
      stored: -2.5,
      equipos: 8.5, // Tendencia para equipos totales
      resguardo: -1.2, // Tendencia para equipos en resguardo
    };

    // --- 5. RESPUESTA FINAL ---
    // Unimos todos los datos en un solo objeto JSON.
    return NextResponse.json({
      totalUsers,
      totalDevices,
      totalComputers,
      assignedComputers,
      storedComputers,
      totalEquipos, // Nuevo campo
      equiposEnResguardo, // Nuevo campo
      trends,
      departmentStats,
      empresaStats,
      ubicacionStats,
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