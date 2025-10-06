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
      estado: 'OPERATIVO'
    };
  } else if (asignado === 'true') {
    where = {
      estado: 'ASIGNADO'
    };
  }
  
  console.log(`[API/COMPUTADOR] Cláusula 'where' de Prisma construida:`, JSON.stringify(where, null, 2));
  try {
          await Promise.resolve();
  
        const id = request.nextUrl.pathname.split('/')[3];
        const computador = await prisma.computador.findUnique({
            where: { id },
            include: {
                computadorModelos: {
                    include: {
                        modeloEquipo: {
                            include: {
                                marcaModelos: {
                                    include: {
                                        marca: true
                                    }
                                }
                            }
                        }
                    }
                },
                asignaciones: {
                  include: {
                    targetEmpleado: {
                      select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        fotoPerfil: true,
                        organizaciones: {
                          where: { activo: true },
                          include: {
                            cargo: true,
                            departamento: true,
                            empresa: true
                          }
                        }
                      }
                    },
                    ubicacion: true
                  },
                  orderBy: {
                    date: 'desc'
                  }
                },
                historialModificaciones: {
                  orderBy: {
                      fecha: 'desc'
                  }
              }
            }
        });

        if (!computador) {
            return NextResponse.json({ message: 'Computador no encontrado' }, { status: 404 });
        }

        // Mapear las nuevas relaciones al formato esperado por el frontend
        const modeloEquipo = computador.computadorModelos[0]?.modeloEquipo;
        const marca = modeloEquipo?.marcaModelos[0]?.marca;
        
        // Mapear empleado de la asignación activa
        const asignacionActiva = computador.asignaciones.find(a => a.activo);
        const empleadoMapeado = asignacionActiva?.targetEmpleado ? {
          ...asignacionActiva.targetEmpleado,
          cargo: asignacionActiva.targetEmpleado.organizaciones[0]?.cargo || null,
          departamento: asignacionActiva.targetEmpleado.organizaciones[0]?.departamento || null,
          empresa: asignacionActiva.targetEmpleado.organizaciones[0]?.empresa || null
        } : null;

        // Mapear asignaciones
        const asignacionesMapeadas = computador.asignaciones.map(a => ({
          ...a,
          targetEmpleado: a.targetEmpleado ? {
            ...a.targetEmpleado,
            cargo: a.targetEmpleado.organizaciones[0]?.cargo || null,
            departamento: a.targetEmpleado.organizaciones[0]?.departamento || null,
            empresa: a.targetEmpleado.organizaciones[0]?.empresa || null
          } : null
        }));

        // Obtener ubicación de la asignación activa o la más reciente
        const ubicacion = asignacionActiva?.ubicacion || 
          computador.asignaciones.find(a => a.ubicacion)?.ubicacion || null;

        // Crear objeto computador mapeado
        const computadorMapeado = {
          ...computador,
          modeloId: modeloEquipo?.id || '', // Agregar modeloId para el formulario
          modelo: modeloEquipo ? {
            ...modeloEquipo,
            marca: marca
          } : null,
          empleado: empleadoMapeado,
          ubicacion: ubicacion,
          asignaciones: asignacionesMapeadas
        };

      const historialDeAsignaciones = computadorMapeado.asignaciones.map(a => ({
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
            ...computadorMapeado,      // Todos los datos del computador mapeado
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
      'serial', 'codigoImgc', 'ram', 'almacenamiento', 'procesador', 'estado',
      'host', 'sisOperativo', 'arquitectura', 'officeVersion', 'anydesk'
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
      // Si hay modificaciones, las creamos en HistorialModificaciones
      if (modificaciones.length > 0) {
        await tx.historialModificaciones.createMany({
          data: modificaciones,
        });

        // También registrar en AsignacionesEquipos para la línea de tiempo inteligente
        await tx.asignacionesEquipos.create({
          data: {
            date: new Date(),
            actionType: 'Edit',
            targetType: 'Sistema',
            targetEmpleadoId: null,
            itemType: 'Computador',
            computadorId: id,
            dispositivoId: null,
            motivo: `Edición de computador ${computadorActual.serial}`,
            notes: `Se modificaron ${modificaciones.length} campo(s): ${modificaciones.map(m => m.campo).join(', ')}`,
            gerenteId: null,
            activo: false, // IMPORTANTE: No debe interferir con asignaciones activas
          },
        });
      }

      // Actualizamos el computador con todos los datos del body
      const equipoActualizado = await tx.computador.update({
        where: { id },
        data: {
            serial: body.serial,
            codigoImgc: body.codigoImgc,
            estado: body.estado,
            host: body.host,
            sisOperativo: body.sisOperativo,
            arquitectura: body.arquitectura,
            ram: body.ram,
            almacenamiento: body.almacenamiento,
            procesador: body.procesador,
            officeVersion: body.officeVersion,
            anydesk: body.anydesk,
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
      select: { serial: true }
    });

    if (!computador) {
      return NextResponse.json({ message: 'Computador no encontrado' }, { status: 404 });
    }

    // Eliminar registros relacionados primero
    await prisma.historialModificaciones.deleteMany({
      where: { computadorId: id }
    });

    await prisma.asignacionesEquipos.deleteMany({
      where: { computadorId: id }
    });

    // Eliminar relaciones con modelos
    await prisma.computadorModeloEquipo.deleteMany({
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
      `Computador ${computador.serial} eliminado`,
      undefined // TODO: Obtener userId del token/sesión
    );

    return NextResponse.json({ message: 'Equipo eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar equipo' }, { status: 500 });
  }
}
