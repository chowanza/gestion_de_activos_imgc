import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/role-middleware';
import { Prisma } from '@prisma/client';
import { dispositivoSchema } from '@/components/equipos-table';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';



// --- GET (Obtener un equipo por ID) ---
export async function GET(request: NextRequest) {
  // Require view permission for dispositivos
  const check = await requirePermission('canView')(request);
  if (check instanceof NextResponse) return check;

  const { searchParams } = new URL(request.url);
  const asignado = searchParams.get('asignado');

  // --- PASO 1: DEPURACIÓN ---
  console.log(`[API/COMPUTADOR] Parámetro 'asignado' recibido: ${asignado}`);

  let where: Prisma.ComputadorWhereInput = {};

  if (asignado === 'false') {
    // --- PASO 2: LÓGICA REFORZADA ---
    // Un equipo NO está asignado si AMBOS campos son null o vacíos.
    where = {
      estado: {
        in: ['OPERATIVO', 'EN_RESGUARDO', 'DE_BAJA']
      }
    };
  } else if (asignado === 'true') {
    where = {
      estado: {
        in: ['ASIGNADO', 'EN_MANTENIMIENTO']
      }
    };
  }
  
  console.log(`[API/COMPUTADOR] Cláusula 'where' de Prisma construida:`, JSON.stringify(where, null, 2));
  try {
        await Promise.resolve();
        const id = request.nextUrl.pathname.split('/')[3];
        const dispositivo = await prisma.dispositivo.findUnique({
            where: { id },
            include: {
                dispositivoModelos: {
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
                  select: {
                    id: true,
                    date: true,
                    notes: true,
                    actionType: true,
                    motivo: true,
                    targetType: true,
                    itemType: true,
                    evidenciaFotos: true,
                    createdAt: true,
                    updatedAt: true,
                    activo: true,
                    targetEmpleadoId: true,
                    computadorId: true,
                    dispositivoId: true,
                    gerenteId: true,
                    ubicacionId: true,
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
                            departamento: {
                              include: {
                                empresaDepartamentos: {
                                  include: {
                                    empresa: true
                                  }
                                }
                              }
                            }
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
                intervenciones: {
                  include: {
                    empleado: {
                      select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        fotoPerfil: true
                      }
                    }
                  },
                  orderBy: {
                    fecha: 'desc'
                  }
                },
            }
        });

        if (!dispositivo) {
            return NextResponse.json({ message: 'dispositivo no encontrado' }, { status: 404 });
        }

        // Auditoría: vista de detalle de dispositivo
        try {
          const user = await getServerUser(request as any);
          if (user) {
            await AuditLogger.logView(
              'dispositivo',
              id,
              `Vista de detalles del dispositivo: ${dispositivo.serial}`,
              (user as any).id
            );
          }
        } catch (e) {
          console.warn('No se pudo registrar auditoría de vista de dispositivo:', e);
        }

        // Mapear las nuevas relaciones al formato esperado por el frontend
        const modeloEquipo = dispositivo.dispositivoModelos[0]?.modeloEquipo;
        const marca = modeloEquipo?.marcaModelos[0]?.marca;
        // Normalize modelo image URL to use streaming endpoint
        const normalizeImg = (raw: string | null | undefined) => {
          if (!raw) return null;
          if (raw.startsWith('/api/uploads/')) return raw;
          if (raw.startsWith('/uploads/')) return raw.replace(/^\/uploads\//, '/api/uploads/');
          if (raw.startsWith('/img/equipos/')) return raw.replace(/^\/img\/equipos\//, '/api/uploads/modelos/');
          return raw;
        };
        
        // Mapear empleado de la asignación activa
        const asignacionActiva = dispositivo.asignaciones.find(a => a.activo);
        const empleadoMapeado = asignacionActiva?.targetEmpleado ? {
          ...asignacionActiva.targetEmpleado,
          cargo: asignacionActiva.targetEmpleado.organizaciones[0]?.cargo || null,
          departamento: asignacionActiva.targetEmpleado.organizaciones[0]?.departamento || null,
          empresa: asignacionActiva.targetEmpleado.organizaciones[0]?.departamento?.empresaDepartamentos?.[0]?.empresa || null
        } : null;

        // Mapear asignaciones
        const asignacionesMapeadas = dispositivo.asignaciones.map(a => ({
          ...a,
          targetEmpleado: a.targetEmpleado ? {
            ...a.targetEmpleado,
            cargo: a.targetEmpleado.organizaciones[0]?.cargo || null,
            departamento: a.targetEmpleado.organizaciones[0]?.departamento || null,
            empresa: a.targetEmpleado.organizaciones[0]?.departamento?.empresaDepartamentos?.[0]?.empresa || null
          } : null
        }));

        // Obtener ubicación de la asignación activa o la más reciente
        const ubicacion = asignacionActiva?.ubicacion || 
          dispositivo.asignaciones.find(a => a.ubicacion)?.ubicacion || null;

        // Historial de asignaciones para dispositivos
        const historialDeAsignaciones = asignacionesMapeadas.map(a => ({
            id: `asig-${a.id}`, // Prefijo para evitar colisión de IDs
            tipo: 'asignacion', // Tipo para identificarlo en el frontend
            fecha: a.date,
            detalle: a, // Mantenemos el objeto original anidado
        }));

        // Mapear intervenciones al formato del historial
        const historialDeIntervenciones = dispositivo.intervenciones.map(intervencion => ({
      id: `intervencion-${intervencion.id}`,
      tipo: 'intervencion' as const,
      fecha: intervencion.fecha.toISOString(),
      detalle: {
        id: intervencion.id,
        notas: intervencion.notas,
        evidenciaFotos: intervencion.evidenciaFotos,
        empleado: intervencion.empleado,
        fecha: intervencion.fecha
      }
    }));

        // Combinar y ordenar el historial final
        const historialCombinado = [...historialDeAsignaciones, ...historialDeIntervenciones]
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        // Construimos el objeto de respuesta final con modeloId incluido
        const responseData = {
            ...dispositivo,      // Todos los datos del dispositivo
      modelo: modeloEquipo ? {
        ...modeloEquipo,
        img: normalizeImg((modeloEquipo as any).img),
        marca: marca
      } : null,
            empleado: empleadoMapeado,
            ubicacion: ubicacion,
            modeloId: dispositivo.dispositivoModelos[0]?.modeloEquipo?.id || null, // Agregar modeloId para el formulario
            asignaciones: asignacionesMapeadas,
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
    // Require permission to manage dispositivos
    const check = await requirePermission('canManageDispositivos')(request);
    if (check instanceof NextResponse) return check;
    const id = request.nextUrl.pathname.split('/')[3];
    try {
        const equipoExistente = await prisma.dispositivo.findUnique({ where: { id } });

        if (!equipoExistente) {
            return NextResponse.json({ message: 'Equipo no encontrado para actualizar' }, { status: 404 });
        }

        const body = await request.json();
          
        const { serial, codigoImgc, estado, ubicacionId, mac, ip, modeloId, fechaCompra, numeroFactura, proveedor, monto } = body;

        // Detectar cambios comparando con el estado actual
        const modificaciones: Array<{campo: string, valorAnterior: string, valorNuevo: string}> = [];
        const camposAComparar = ['serial', 'codigoImgc', 'estado', 'mac', 'ip', 'fechaCompra', 'numeroFactura', 'proveedor', 'monto'];
        
        for (const campo of camposAComparar) {
            const valorActual = (equipoExistente as any)[campo];
            const valorNuevo = (body as any)[campo];
            
            // Solo comparar si el campo existe en el body
            if (valorNuevo !== undefined) {
                // Comparar valores (manejar fechas y nulls)
                let valorAnterior = String(valorActual || "N/A");
                let valorNuevoStr = String(valorNuevo || "N/A");
                
                // Para fechas, convertir a string para comparación
                if (campo === 'fechaCompra') {
                    valorAnterior = valorActual ? new Date(valorActual).toISOString().split('T')[0] : "N/A";
                    valorNuevoStr = valorNuevo ? new Date(valorNuevo).toISOString().split('T')[0] : "N/A";
                }
                
                // Para montos, convertir a número para comparación
                if (campo === 'monto') {
                    valorAnterior = valorActual ? String(valorActual) : "N/A";
                    valorNuevoStr = valorNuevo ? String(valorNuevo) : "N/A";
                }
                
                if (valorAnterior !== valorNuevoStr) {
                    modificaciones.push({
                        campo,
                        valorAnterior,
                        valorNuevo: valorNuevoStr
                    });
                }
            }
        }

        // Ejecutar actualización y registro de historial en una transacción
        const updatedEquipo = await prisma.$transaction(async (tx) => {
            // Si hay modificaciones, registrar en Asignaciones para la línea de tiempo inteligente
            if (modificaciones.length > 0) {
                await tx.asignacionesEquipos.create({
                    data: {
                        date: new Date(),
                        actionType: 'Edit',
                        targetType: 'Sistema',
                        targetEmpleadoId: null,
                        itemType: 'Dispositivo',
                        computadorId: null,
                        dispositivoId: id,
                        motivo: `Edición de dispositivo ${equipoExistente.serial}`,
                        notes: `Se modificaron ${modificaciones.length} campo(s): ${modificaciones.map(m => m.campo).join(', ')}`,
                        gerenteId: null,
                        activo: false, // IMPORTANTE: No debe interferir con asignaciones activas
                    },
                });
            }

            // Actualizar el dispositivo
            const equipoActualizado = await tx.dispositivo.update({
                where: { id },
                data: {
                    serial,
                    codigoImgc,  // Campo obligatorio
                    estado,
                    mac,
                    ip,
                    // Nuevos campos de compra
                    fechaCompra: fechaCompra ? new Date(fechaCompra) : null,
                    numeroFactura: numeroFactura || null,
                    proveedor: proveedor || null,
                    monto: monto && monto !== '' ? parseFloat(monto) : null,
                },
            });

            // Si se proporciona un nuevo modeloId, actualizar la relación
            if (modeloId) {
                // Eliminar relaciones existentes con modelos
                await tx.dispositivoModeloEquipo.deleteMany({
                    where: { dispositivoId: id }
                });

                // Crear nueva relación con el modelo
                await tx.dispositivoModeloEquipo.create({
                    data: {
                        dispositivoId: id,
                        modeloEquipoId: modeloId,
                    },
                });
            }

            return equipoActualizado;
        });

        return NextResponse.json(updatedEquipo, { status: 200 });

    } catch (error) {
        console.error(`Error en PUT /api/dispositivos/${id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar el equipo';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}


// --- DELETE (Eliminar un equipo por ID) ---
export async function DELETE(request: NextRequest) {
  await Promise.resolve();
  // Require explicit delete permission (Admin only)
  const check = await requirePermission('canDelete')(request);
  if (check instanceof NextResponse) return check;
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
        await prisma.asignacionesEquipos.deleteMany({
            where: { dispositivoId: id }
        });

        // Eliminar relaciones con modelos
        await prisma.dispositivoModeloEquipo.deleteMany({
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
