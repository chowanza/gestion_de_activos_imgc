import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, HistorialModificaciones } from '@prisma/client';
import { AuditLogger } from '@/lib/audit-logger';


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const asignado = searchParams.get('asignado');

  // --- PASO 1: DEPURACIÓN ---
  console.log(`[API/COMPUTADOR] Parámetro 'asignado' recibido: ${asignado}`);

  let where: Prisma.ComputadorWhereInput = {};

  if (asignado === 'false') {
    // Un equipo NO está asignado si no tiene empleado asignado
    where = {
      empleadoId: null
    };
  } else if (asignado === 'true') {
    where = {
      empleadoId: { not: null }
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
                    }
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
                        empresa: true // Incluye la empresa del departamento del empleado
                      }
                    }
                  }
                },      // Incluye el objeto 'empleado' asignado (si existe)
                ubicacion: true, // Incluye la ubicación asignada (si existe)
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
      'ram', 'almacenamiento', 'procesador', 'estado',
      'host', 'ubicacionId', 'sisOperativo', 'arquitectura', 'officeVersion', 'anydesk'
    ];

    // --- PASO 2: COMPARAR VALORES Y PREPARAR HISTORIAL ---
    for (const campo of camposAComparar) {
      if (body[campo] !== undefined && computadorActual[campo] !== body[campo]) {
        modificaciones.push({
          computadorId: id,
          campo: campo,
          valorAnterior: String(computadorActual[campo] || "N/A"),
          valorNuevo: String(body[campo]),
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
            host: body.host,
            sisOperativo: body.sisOperativo,
            arquitectura: body.arquitectura,
            ram: body.ram,
            almacenamiento: body.almacenamiento,
            procesador: body.procesador,
            officeVersion: body.officeVersion,
            anydesk: body.anydesk,
            modelo: body.modeloId ? { connect: { id: body.modeloId } } : undefined,
            empleado: body.empleadoId ? { connect: { id: body.empleadoId } } : { disconnect: true },
            ubicacion: body.ubicacionId ? { connect: { id: body.ubicacionId } } : { disconnect: true }
        },
      });

      return equipoActualizado;
    });

    // Registrar en auditoría
    await AuditLogger.logUpdate(
      'computador',
      id,
      `Computador ${computadorActual.serial} actualizado`,
      undefined, // TODO: Obtener userId del token/sesión
      {
        modificaciones: modificaciones.length,
        camposModificados: modificaciones.map(m => m.campo)
      }
    );

    return NextResponse.json(updatedEquipo, { status: 200 });

  } catch (error) {
    console.error("[PUT /api/computador]", error);
    return NextResponse.json({ message: 'Error al actualizar equipo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/')[3];
    
    // Obtener datos del computador antes de eliminarlo para auditoría
    const computador = await prisma.computador.findUnique({
      where: { id },
      select: { serial: true, modelo: { select: { nombre: true } } }
    });

    if (!computador) {
      return NextResponse.json({ message: 'Computador no encontrado' }, { status: 404 });
    }

    // Eliminar registros relacionados primero
    await prisma.historialModificaciones.deleteMany({
      where: { computadorId: id }
    });

    await prisma.asignaciones.deleteMany({
      where: { computadorId: id }
    });

    // Ahora eliminar el computador
    await prisma.computador.delete({
      where: { id },
    });

    // Registrar en auditoría
    await AuditLogger.logDelete(
      'computador',
      id,
      `Computador ${computador.serial} (${computador.modelo.nombre}) eliminado`,
      undefined // TODO: Obtener userId del token/sesión
    );

    return NextResponse.json({ message: 'Equipo eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar equipo' }, { status: 500 });
  }
}
