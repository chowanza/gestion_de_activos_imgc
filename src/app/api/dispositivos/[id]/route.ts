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
        { empleadoId: null },
        { departamentoId: null }
      ]
    };
  } else if (asignado === 'true') {
    where = {
      OR: [
        { empleadoId: { not: null } },
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
                empleado: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    cargo: true,
                    fotoPerfil: true,
                    departamento: {
                      include: {
                        empresa: true
                      }
                    }
                  }
                },      // Incluye el objeto 'empleado' asignado (si existe)
                ubicacion: true, // Incluye la ubicación asignada (si existe)
                asignaciones: {
                  include: {
                    targetEmpleado: {
                      select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        cargo: true,
                        fotoPerfil: true,
                        departamento: {
                          include: {
                            empresa: true
                          }
                        }
                      }
                    },
                  },
                  orderBy: {
                    date: 'desc'
                  }
                },
            }
        });

        if (!dispositivo) {
            return NextResponse.json({ message: 'dispositivo no encontrado' }, { status: 404 });
        }

        // Solo historial de asignaciones para dispositivos
        const historialDeAsignaciones = dispositivo.asignaciones.map(a => ({
            id: `asig-${a.id}`, // Prefijo para evitar colisión de IDs
            tipo: 'asignacion', // Tipo para identificarlo en el frontend
            fecha: a.date,
            detalle: a, // Mantenemos el objeto original anidado
        }));

        // Ordenar el historial final
        const historialCombinado = historialDeAsignaciones
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        // Construimos el objeto de respuesta final
        const responseData = {
            ...dispositivo,      // Todos los datos del dispositivo
            historial: historialCombinado,          // El array de historial combinado
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
          
        const { serial, codigoImgc, estado, ubicacionId, mac, modeloId, fechaCompra, numeroFactura, proveedor, monto } = body;

        const updatedEquipo = await prisma.dispositivo.update({
            where: { id },
            data: {
                serial,
                codigoImgc,  // Campo obligatorio
                estado,
                mac,
                ubicacionId: ubicacionId || null,
                // Nuevos campos de compra
                fechaCompra: fechaCompra ? new Date(fechaCompra) : null,
                numeroFactura: numeroFactura || null,
                proveedor: proveedor || null,
                monto: monto || null,
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

        // 3. Eliminar registros relacionados primero
        await prisma.asignaciones.deleteMany({
            where: { dispositivoId: id }
        });

        // 4. Eliminar el registro de la base de datos
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
