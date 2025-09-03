import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Asegúrate que la ruta a prisma sea correcta

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
    ] = await Promise.all([
      prisma.usuario.count(),
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
    ]);

    // --- 2. ESTADÍSTICAS POR DEPARTAMENTO ---
    // Obtenemos todos los departamentos y contamos sus computadores y usuarios asociados.
    // El uso de `_count` es mucho más performante que traer los arrays completos.
    const deptsData = await prisma.departamento.findMany({
      include: {
        _count: {
          select: {
            usuarios: true,
            computadores: true,
          },
        },
      },
    });

    // Mapeamos los datos para darles el formato que el frontend espera.
    const departmentStats = deptsData.map((dept) => ({
      name: dept.nombre,
      computers: dept._count.computadores,
      users: dept._count.usuarios,
      percentage:
        totalComputers > 0
          ? parseFloat(((dept._count.computadores / totalComputers) * 100).toFixed(1))
          : 0,
    }));

    // --- 3. ACTIVIDAD RECIENTE ---
    // Obtenemos las últimas 5 asignaciones/movimientos registrados.
    const recentActivityRaw = await prisma.asignaciones.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        // Incluimos los datos necesarios para describir la actividad.
        targetUsuario: { select: { nombre: true, apellido: true } },
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
            user: activity.targetUsuario ? `${activity.targetUsuario.nombre} ${activity.targetUsuario.apellido}` : 'Sistema',
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
    };

    // --- 5. RESPUESTA FINAL ---
    // Unimos todos los datos en un solo objeto JSON.
    return NextResponse.json({
      totalUsers,
      totalDevices,
      totalComputers,
      assignedComputers,
      storedComputers,
      trends,
      departmentStats,
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