import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/role-middleware';
import { Prisma, HistorialModificaciones } from '@prisma/client';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';


export async function GET(request: NextRequest) {
  // Require view permission to access computador details
  const check = await requirePermission('canView')(request);
  if (check instanceof NextResponse) return check;

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
        
        // Validar que el ID existe y tiene formato UUID válido
        if (!id || id.length !== 36) {
          console.error('[GET /api/computador/:id] ID inválido:', id);
          return NextResponse.json({ 
            message: 'ID de computador inválido',
            error: 'Invalid computer ID format'
          }, { status: 400 });
        }
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
              },
              intervenciones: {
                include: {
                  empleado: {
                    select: {
                      id: true,
                      nombre: true,
                      apellido: true
                    }
                  }
                },
                orderBy: {
                  fecha: 'desc'
                }
              }
            }
        });

    if (!computador) {
            return NextResponse.json({ message: 'Computador no encontrado' }, { status: 404 });
        }
        
        // Auditoría: vista de detalle de computador
        try {
          const user = await getServerUser(request as any);
          if (user) {
            await AuditLogger.logView(
              'computador',
              id,
              `Vista de detalles del computador: ${computador.serial}`,
              (user as any).id
            );
          }
        } catch (e) {
          console.warn('No se pudo registrar auditoría de vista de computador:', e);
        }

        // Mapear las nuevas relaciones al formato esperado por el frontend
        const modeloEquipo = computador.computadorModelos[0]?.modeloEquipo;
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
            img: normalizeImg((modeloEquipo as any).img),
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

    // Mapear intervenciones al formato del historial
    const historialDeIntervenciones = computador.intervenciones.map(intervencion => ({
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
    const historialCombinado = [...historialDeAsignaciones, ...historialDeModificaciones, ...historialDeIntervenciones]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        // Construimos el objeto de respuesta final
        const responseData = {
            ...computadorMapeado,      // Todos los datos del computador mapeado
            historial: historialCombinado,          // El array de historial que consultamos por separado
         // El objeto simplificado del último movimiento
        };


        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
    console.error('[GET /api/computador/:id] Error:', error);
    
    // Proporcionar información más específica sobre el error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Si es un error de Prisma, proporcionar más contexto
      if (error.message.includes('prisma') || error.message.includes('database')) {
        return NextResponse.json({ 
          message: 'Error de base de datos al obtener computador',
          error: 'Database connection or query failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
      }
      
      // Si es un error de serialización/formato
      if (error.message.includes('JSON') || error.message.includes('serialize')) {
        return NextResponse.json({ 
          message: 'Error de formato de datos al procesar computador',
          error: 'Data serialization failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      message: 'Error interno del servidor al obtener computador',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require permission to manage computadores
    const check = await requirePermission('canManageComputadores')(request);
    if (check instanceof NextResponse) return check;

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
    const camposAComparar: Array<keyof typeof computadorActual | 'fechaCompra' | 'monto' | 'macWifi' | 'macEthernet' | 'numeroFactura' | 'proveedor'> = [
      'serial', 'codigoImgc', 'ram', 'almacenamiento', 'procesador', 'estado',
      'host', 'sisOperativo', 'arquitectura', 'officeVersion', 'anydesk',
      // Campos adicionales que no estaban siendo auditados/actualizados
      'macWifi', 'macEthernet', 'fechaCompra', 'numeroFactura', 'proveedor', 'monto'
    ];

    // --- PASO 2: COMPARAR VALORES Y PREPARAR HISTORIAL ---
    for (const campo of camposAComparar) {
      // Solo comparar si el campo está presente en el body (evita marcar no cambios)
      if ((body as any)[campo] !== undefined) {
        const valorActual = (computadorActual as any)[campo];
        const valorNuevo = (body as any)[campo];

        let valorAnteriorStr = String(valorActual ?? 'N/A');
        let valorNuevoStr = String(valorNuevo ?? 'N/A');

        // Normalizaciones específicas por tipo de dato
        if (campo === 'fechaCompra') {
          valorAnteriorStr = valorActual ? new Date(valorActual).toISOString().split('T')[0] : 'N/A';
          valorNuevoStr = valorNuevo ? new Date(valorNuevo).toISOString().split('T')[0] : 'N/A';
        }
        if (campo === 'monto') {
          // Prisma Decimal puede serializar distinto; comparar como string
          valorAnteriorStr = valorActual != null ? String(valorActual) : 'N/A';
          valorNuevoStr = valorNuevo != null && valorNuevo !== '' ? String(valorNuevo) : 'N/A';
        }

        if (valorAnteriorStr !== valorNuevoStr) {
          modificaciones.push({
            computadorId: id,
            campo: campo as any,
            valorAnterior: valorAnteriorStr,
            valorNuevo: valorNuevoStr,
          });
        }
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
            // Campos nuevos de red
            macWifi: body.macWifi ?? null,
            macEthernet: body.macEthernet ?? null,
            // Campos de compra
            fechaCompra: body.fechaCompra ? new Date(body.fechaCompra) : null,
            numeroFactura: body.numeroFactura ?? null,
            proveedor: body.proveedor ?? null,
            monto: typeof body.monto === 'number' ? body.monto : (body.monto && body.monto !== '' ? parseFloat(body.monto) : null),
        },
      });

      // Actualizar relación de modelo si se provee modeloId
      if (body.modeloId) {
        await tx.computadorModeloEquipo.deleteMany({ where: { computadorId: id } });
        await tx.computadorModeloEquipo.create({
          data: {
            computadorId: id,
            modeloEquipoId: body.modeloId,
          }
        });
      }

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
    // Require explicit delete permission (Admin only)
    const check = await requirePermission('canDelete')(request);
    if (check instanceof NextResponse) return check;

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
