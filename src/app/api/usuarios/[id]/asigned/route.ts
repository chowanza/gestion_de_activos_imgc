import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Asegúrate que la ruta a tu cliente Prisma sea correcta

export async function GET(
  request: NextRequest
) {
  await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
  try {
    // Paso 1: Verificar si el empleado existe y obtener sus datos básicos.
    const empleado = await prisma.empleado.findUnique({
      where: { id },
      include: {
        departamento: {
          include: {
            empresa: true,
          },
        },
        cargo: true,
      },
    });

    if (!empleado) {
      return NextResponse.json({ message: `Empleado con ID ${id} no encontrado` }, { status: 404 });
    }

    // Paso 2: Ejecutar todas las búsquedas de activos Y los conteos en paralelo.
    const [
        computadores, 
        dispositivos, 
        lineasAsignadas,
        totalComputadores, // <-- NUEVO
        totalDispositivos, // <-- NUEVO
    ] = await Promise.all([
      // Buscar computadores asignados al empleado (solo si tienen estado "Asignado")
      prisma.computador.findMany({
        where: { 
          empleadoId: id,
          estado: "Asignado"
        },
        include: {
          modelo: {
            include: {
              marca: true,
            },
          },
        },
      }),
      // Buscar dispositivos asignados al empleado (solo si tienen estado "Asignado")
      prisma.dispositivo.findMany({
        where: { 
          empleadoId: id,
          estado: "Asignado"
        },
        include: {
          modelo: {
            include: {
              marca: true,
            },
          },
        },
      }),
      // Nota: Las líneas telefónicas fueron removidas del esquema
      Promise.resolve([]),
      // --- NUEVAS CONSULTAS DE CONTEO ---
      prisma.computador.count({ where: { empleadoId: id, estado: "Asignado" } }),
      prisma.dispositivo.count({ where: { empleadoId: id, estado: "Asignado" } }),
    ]);

    // Paso 3: Las líneas telefónicas fueron removidas del esquema
    const lineasTelefonicas: any[] = [];
    const totalLineas = 0;

    // Paso 4: Construir el objeto de respuesta final, incluyendo las estadísticas.
    const responseData = {
      id: empleado.id,
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      cargo: empleado.cargo?.nombre || 'Sin cargo asignado',
      departamento: empleado.departamento?.nombre || 'Sin departamento asignado',
      empresa: empleado.empresa?.nombre || 'Sin empresa asignada',
      gerencia: empleado.empresa?.nombre || 'Sin gerencia asignada',
      computadores,
      dispositivos,
      lineasTelefonicas,
      // --- NUEVO OBJETO DE ESTADÍSTICAS ---
      estadisticas: {
        totalComputadores: totalComputadores,
        totalDispositivos: totalDispositivos,
        totalLineas: totalLineas,
        totalActivos: totalComputadores + totalDispositivos + totalLineas,
      },
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error(`Error al obtener activos para el empleado ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el servidor';
    return NextResponse.json({ message: 'Error al obtener los activos asignados', error: errorMessage }, { status: 500 });
  }
}
