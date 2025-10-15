import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Asegúrate que la ruta a tu cliente Prisma sea correcta
export const dynamic = 'force-dynamic';

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
        organizaciones: {
          where: { activo: true },
          include: {
            departamento: true,
            empresa: true,
            cargo: true
          }
        }
      },
    });

    if (!empleado) {
      return NextResponse.json({ message: `Empleado con ID ${id} no encontrado` }, { status: 404 });
    }

    // Paso 2: Ejecutar todas las búsquedas de activos Y los conteos en paralelo.
    const [
      asignacionesComputador,
      asignacionesDispositivo,
      lineasAsignadas,
      totalComputadores,
      totalDispositivos,
    ] = await Promise.all([
      prisma.asignacionesEquipos.findMany({
        where: {
          targetEmpleadoId: id,
          activo: true,
          computadorId: { not: null }
        },
        include: {
          computador: {
            include: {
              computadorModelos: {
                include: {
                  modeloEquipo: {
                    include: {
                      marcaModelos: {
                        include: { marca: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.asignacionesEquipos.findMany({
        where: {
          targetEmpleadoId: id,
          activo: true,
          dispositivoId: { not: null }
        },
        include: {
          dispositivo: {
            include: {
              dispositivoModelos: {
                include: {
                  modeloEquipo: {
                    include: {
                      marcaModelos: {
                        include: { marca: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),
      Promise.resolve([]),
      prisma.asignacionesEquipos.count({
        where: {
          targetEmpleadoId: id,
          activo: true,
          computadorId: { not: null }
        }
      }),
      prisma.asignacionesEquipos.count({
        where: {
          targetEmpleadoId: id,
          activo: true,
          dispositivoId: { not: null }
        }
      })
    ]);

    // Paso 3: Las líneas telefónicas fueron removidas del esquema
    const lineasTelefonicas: any[] = [];
    const totalLineas = 0;

    // Paso 4: Construir el objeto de respuesta final, incluyendo las estadísticas.
    const responseData = {
  id: empleado.id,
  nombre: empleado.nombre,
  apellido: empleado.apellido,
  cargo: empleado.organizaciones?.[0]?.cargo?.nombre || 'Sin cargo asignado',
  departamento: empleado.organizaciones?.[0]?.departamento?.nombre || 'Sin departamento asignado',
  empresa: empleado.organizaciones?.[0]?.empresa?.nombre || 'Sin empresa asignada',
  computadores: asignacionesComputador.map((a: any) => a.computador),
  dispositivos: asignacionesDispositivo.map((a: any) => a.dispositivo),
  lineasTelefonicas,
  estadisticas: {
    totalComputadores,
    totalDispositivos,
    totalLineas,
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
