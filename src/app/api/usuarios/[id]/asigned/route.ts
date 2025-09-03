import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Asegúrate que la ruta a tu cliente Prisma sea correcta

export async function GET(
  request: NextRequest
) {
  await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
  try {
    // Paso 1: Verificar si el usuario existe y obtener sus datos básicos.
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        departamento: {
          include: {
            gerencia: true,
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json({ message: `Usuario con ID ${id} no encontrado` }, { status: 404 });
    }

    // Paso 2: Ejecutar todas las búsquedas de activos Y los conteos en paralelo.
    const [
        computadores, 
        dispositivos, 
        lineasAsignadas,
        totalComputadores, // <-- NUEVO
        totalDispositivos, // <-- NUEVO
    ] = await Promise.all([
      // Buscar computadores directamente asignados al usuario
      prisma.computador.findMany({
        where: { usuarioId: id },
        include: {
          modelo: {
            include: {
              marca: true,
            },
          },
        },
      }),
      // Buscar dispositivos directamente asignados al usuario
      prisma.dispositivo.findMany({
        where: { usuarioId: id },
        include: {
          modelo: {
            include: {
              marca: true,
            },
          },
        },
      }),
      // Buscar en el historial de asignaciones las líneas telefónicas asignadas a este usuario
      prisma.asignaciones.findMany({
        where: {
          targetUsuarioId: id,
          itemType: 'LineaTelefonica',
          actionType: 'Asignacion',
        },
        include: {
          lineaTelefonica: true,
        },
      }),
      // --- NUEVAS CONSULTAS DE CONTEO ---
      prisma.computador.count({ where: { usuarioId: id } }),
      prisma.dispositivo.count({ where: { usuarioId: id } }),
    ]);

    // Paso 3: Extraer y limpiar los datos de las líneas telefónicas.
    const lineasTelefonicas = lineasAsignadas
      .map(asignacion => asignacion.lineaTelefonica)
      .filter(linea => linea !== null);
      
    const totalLineas = lineasTelefonicas.length;

    // Paso 4: Construir el objeto de respuesta final, incluyendo las estadísticas.
    const responseData = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      cargo: usuario.cargo,
      departamento: usuario.departamento.nombre,
      gerencia: usuario.departamento.gerencia.nombre,
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
    console.error(`Error al obtener activos para el usuario ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el servidor';
    return NextResponse.json({ message: 'Error al obtener los activos asignados', error: errorMessage }, { status: 500 });
  }
}
