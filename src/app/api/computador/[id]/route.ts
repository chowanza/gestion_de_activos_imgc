import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { Prisma, HistorialModificaciones } from '@prisma/client';


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
        const computador = await prisma.computador.findUnique({
            where: { id },
            include: {
                modelo: {         // Incluye el objeto 'modelo' relacionado
                    include: {
                        marca: true // Dentro de 'modelo', incluye también la 'marca'
                    }
                },
                asignaciones: {
                  include: {
                    targetUsuario: true,
                    targetDepartamento: true
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
                historialModificaciones: {
                  orderBy: {
                      fecha: 'desc' // Ordenar por fecha, el más reciente primero
                  }
              }
            }
        });

        if (!computador) {
            return NextResponse.json({ message: 'Computador no encontrado' }, { status: 404 });
        }

      const historialDeAsignaciones = computador.asignaciones.map(a => ({
      id: `asig-${a.id}`, // Prefijo para evitar colisión de IDs
      tipo: 'asignacion', // Tipo para identificarlo en el frontend
      fecha: a.date,
      detalle: a, // Mantenemos el objeto original anidado
    }));

    const historialDeModificaciones = computador.historialModificaciones.map(m => ({
      id: `mod-${m.id}`, // Prefijo para evitar colisión de IDs
      tipo: 'modificacion', // Tipo para identificarlo en el frontend
      fecha: m.fecha,
      detalle: m, // Mantenemos el objeto original anidado
    }));

    // Combinar y ordenar el historial final
    const historialCombinado = [...historialDeAsignaciones, ...historialDeModificaciones]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        // Construimos el objeto de respuesta final
        const responseData = {
            ...computador,      // Todos los datos del computador
            historial: historialCombinado,          // El array de historial que consultamos por separado
         // El objeto simplificado del último movimiento
        };


        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipo' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/')[3];
    const body = await request.json();

    // --- PASO 1: OBTENER EL ESTADO ACTUAL DEL COMPUTADOR ---
    const computadorActual = await prisma.computador.findUnique({
      where: { id },
    });

    if (!computadorActual) {
      return NextResponse.json({ message: 'Computador no encontrado' }, { status: 404 });
    }

    const modificaciones: Prisma.HistorialModificacionesCreateManyInput[] = [];
    const camposAComparar: Array<keyof typeof computadorActual> = [
      'ram', 'almacenamiento', 'procesador', 'estado', 'nsap',
      'host', 'ubicacion', 'sisOperativo', 'arquitectura', 'sapVersion', 'officeVersion'
    ];

    // --- PASO 2: COMPARAR VALORES Y PREPARAR HISTORIAL ---
    for (const campo of camposAComparar) {
      if (body[campo] !== undefined && computadorActual[campo] !== body[campo]) {
        modificaciones.push({
          computadorId: id,
          campo: campo,
          valorAnterior: computadorActual[campo] || "N/A",
          valorNuevo: body[campo],
        });
      }
    }

    // --- PASO 3: EJECUTAR ACTUALIZACIÓN Y CREACIÓN DE HISTORIAL EN UNA TRANSACCIÓN ---
    const updatedEquipo = await prisma.$transaction(async (tx) => {
      // Si hay modificaciones, las creamos
      if (modificaciones.length > 0) {
        await tx.historialModificaciones.createMany({
          data: modificaciones,
        });
      }

      // Actualizamos el computador con todos los datos del body
      const equipoActualizado = await tx.computador.update({
        where: { id },
        data: {
            serial: body.serial,
            estado: body.estado,
            nsap: body.nsap,
            host: body.host,
            ubicacion: body.ubicacion,
            sisOperativo: body.sisOperativo,
            arquitectura: body.arquitectura,
            ram: body.ram,
            almacenamiento: body.almacenamiento,
            procesador: body.procesador,
            sapVersion: body.sapVersion,
            officeVersion: body.officeVersion,
            modelo: body.modeloId ? { connect: { id: body.modeloId } } : undefined,
            usuario: body.usuarioId ? { connect: { id: body.usuarioId } } : { disconnect: true },
            departamento: body.departamentoId ? { connect: { id: body.departamentoId } } : undefined, // Ajusta según tu lógica si puede ser null
        },
      });

      return equipoActualizado;
    });

    return NextResponse.json(updatedEquipo, { status: 200 });

  } catch (error) {
    console.error("[PUT /api/computador]", error);
    return NextResponse.json({ message: 'Error al actualizar equipo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    await prisma.computador.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'Equipo eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar equipo' }, { status: 500 });
  }
}
