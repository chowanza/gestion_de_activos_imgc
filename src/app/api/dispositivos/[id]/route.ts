import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { dispositivoSchema } from '@/components/equipos-table';



// --- GET (Obtener un equipo por ID) ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const asignado = searchParams.get('asignado');

  // --- PASO 1: DEPURACIÓN ---
  console.log(`[API/COMPUTADOR] Parámetro 'asignado' recibido: ${asignado}`);

  let where: Prisma.ComputadorWhereInput = {};

  if (asignado === 'false') {
    // --- PASO 2: LÓGICA REFORZADA ---
    // Un equipo NO está asignado si AMBOS campos son null o vacíos.
    where = {
      AND: [
        { usuarioId: null },
        { departamentoId: null }
      ]
    };
  } else if (asignado === 'true') {
    where = {
      OR: [
        { usuarioId: { not: null } },
        { departamentoId: { not: null } },
      ],
    };
  }
  
  console.log(`[API/COMPUTADOR] Cláusula 'where' de Prisma construida:`, JSON.stringify(where, null, 2));
  try {
        await Promise.resolve();
        const id = request.nextUrl.pathname.split('/')[3];
        const dispositivo = await prisma.dispositivo.findUnique({
            where: { id },
            include: {
                modelo: {         // Incluye el objeto 'modelo' relacionado
                    include: {
                        marca: true // Dentro de 'modelo', incluye también la 'marca'
                    }
                },
                usuario: {
                  include:{
                      departamento: true // Incluye el objeto 'departamento' del usuario asignado (si existe)
                  }
                },      // Incluye el objeto 'usuario' asignado (si existe)
                departamento: {
                  include: {
                    gerencia: true, // Incluye la 'gerencia' del departamento (si existe)
                  }
                },
            }
        });

        if (!dispositivo) {
            return NextResponse.json({ message: 'dispositivo no encontrado' }, { status: 404 });
        }

        const historial = await prisma.asignaciones.findMany({
            where: {
                dispositivoId: id,// Importante para no mezclar con dispositivos
            },
            orderBy: {
                date: 'desc' // El más reciente primero
            },
          include: {
            targetUsuario: {
              select: { nombre: true, apellido: true }
            },
            targetDepartamento: {
              select: { nombre: true }
            }
          }
        });

        // --- PASO 3: Combinar los datos para enviar al frontend ---

        // Tomamos el primer elemento del historial (el más reciente) para la "última asignación"
        const ultimaAsignacion = historial.length > 0 ? {
            id: historial[0].id,
            type: historial[0].motivo,
            targetType: historial[0].targetType,
            
            date: historial[0].date.toISOString(),
        } : null;

        // Construimos el objeto de respuesta final
        const responseData = {
            ...dispositivo,      // Todos los datos del computador
            historial,          // El array de historial que consultamos por separado
            ultimaAsignacion    // El objeto simplificado del último movimiento
        };

        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipo' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
     await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    try {
        const equipoExistente = await prisma.dispositivo.findUnique({ where: { id } });

        if (!equipoExistente) {
            return NextResponse.json({ message: 'Equipo no encontrado para actualizar' }, { status: 404 });
        }

        const body = await request.json();
          
        const { serial, nsap, estado, ubicacion, mac, modeloId } = body;

        const updatedEquipo = await prisma.dispositivo.update({
            where: { id },
            data: {
                serial,
                nsap,
                estado,
                mac,
                ubicacion,
            }, // Cuidado con 'as any', valida y tipa los datos.
        });

        return NextResponse.json(updatedEquipo, { status: 200 });

    } catch (error) {
        console.error(`Error en PUT /api/equipos/${id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar el equipo';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}


// --- DELETE (Eliminar un equipo por ID) ---
export async function DELETE(request: NextRequest) {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    try {
        // 1. Obtener el equipo para saber la ruta de su imagen (si tiene)
        const equipoExistente = await prisma.dispositivo.findUnique({
            where: { id },
        });

        if (!equipoExistente) {
            return NextResponse.json({ message: 'Equipo no encontrado para eliminar' }, { status: 404 });
        }

        // 2. Eliminar la imagen del sistema de archivos (si existe)
        // if (equipoExistente.img) {
        //     await deletePreviousImage(equipoExistente.img);
        // }

        // 3. Eliminar el registro de la base de datos
        const deletedEquipo = await prisma.dispositivo.delete({
            where: { id },
        });

        return NextResponse.json(deletedEquipo, { status: 200 }); // O un mensaje de éxito

    } catch (error) {
        console.error(`Error en DELETE /api/dispositivos/${id}:`, error);
        // Manejar errores específicos de Prisma, como P2025 (Registro no encontrado) si es necesario
        // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // return NextResponse.json({ message: 'Error: El equipo ya no existe.' }, { status: 404 });
        // }
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar el equipo';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
