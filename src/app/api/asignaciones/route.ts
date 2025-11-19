// src/app/api/asignaciones/route.ts (VERSIÓN CORREGIDA)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAnyPermission, requirePermission } from '@/lib/role-middleware';
import { z } from 'zod';
import { getGerente } from '@/utils/getGerente';
import { getServerUser } from '@/lib/auth-server';

const asignacionSchema = z.object({
  action: z.enum(['asignar', 'desvincular']),
  itemId: z.string().uuid(),
  itemType: z.enum(['Computador', 'Dispositivo']),
  asignarA_id: z.string().uuid().optional(),
  asignarA_type: z.enum(['Usuario']).optional(),
  notas: z.string().optional(),
  gerenteId: z.string().optional(),
  gerente: z.string().optional(),
  serialC: z.string().optional(),
  modeloC: z.string().optional(),
  motivo: z.string().optional(),
  ubicacionId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  // Require at least view permission to list asignaciones
  const checkView = await requirePermission('canView')(request);
  if (checkView instanceof NextResponse) return checkView;

  try {
    const asignaciones = await prisma.asignacionesEquipos.findMany({
      orderBy: { date: 'desc' },
      include: {
        computador: {
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
            }
          }
        },
        dispositivo: {
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
            }
          }
        },
        targetEmpleado: {
          include: {
            organizaciones: {
              where: { activo: true },
              include: {
                departamento: true,
                cargo: true
              }
            }
          }
        },
        ubicacion: true,
      },
    });

    const resultadoFinal = asignaciones.map((a) => {
      let itemAsignado;
      if (a.itemType === 'Computador' && a.computador) {
        const modeloEquipo = a.computador.computadorModelos[0]?.modeloEquipo;
        const marca = modeloEquipo?.marcaModelos[0]?.marca;
        itemAsignado = {
          id: a.computador.id,
          tipo: 'Computador',
          serial: a.computador.serial,
          descripcion: marca && modeloEquipo ? `${marca.nombre} ${modeloEquipo.nombre}` : 'Sin modelo',
        };
      } else if (a.itemType === 'Dispositivo' && a.dispositivo) {
        const modeloEquipo = a.dispositivo.dispositivoModelos[0]?.modeloEquipo;
        const marca = modeloEquipo?.marcaModelos[0]?.marca;
        itemAsignado = {
          id: a.dispositivo.id,
          tipo: 'Dispositivo',
          serial: a.dispositivo.serial,
          descripcion: marca && modeloEquipo ? `${marca.nombre} ${modeloEquipo.nombre}` : 'Sin modelo',
          detalles: {
            tipoDispositivo: modeloEquipo?.tipo || 'Desconocido',
          },
        };
      }

      let asignadoA;
      if (a.targetType === 'Usuario' && a.targetEmpleado) {
        const organizacionActiva = a.targetEmpleado.organizaciones[0];
        asignadoA = {
          id: a.targetEmpleado.id,
          tipo: 'Usuario',
          nombre: `${a.targetEmpleado.nombre} ${a.targetEmpleado.apellido}`,
          departamento: organizacionActiva?.departamento?.nombre || null,
          cargo: organizacionActiva?.cargo?.nombre || null,
        };
      }

      return {
        id: a.id,
        date: a.date,
        notes: a.notes,
        item: itemAsignado,
        asignadoA: asignadoA,
        motivo: a.motivo,
        localidad: a.ubicacion?.nombre || null,
      };
    });

    return NextResponse.json(resultadoFinal, { status: 200 });

  } catch (error) {
    console.error("Error al obtener asignaciones:", error);
    return NextResponse.json({ error: "No se pudieron obtener las asignaciones." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require permissions: assigners or admins
    const check = await requireAnyPermission(['canAssign', 'canManageAsignaciones'])(request);
    if (check instanceof NextResponse) return check;

    const user = await getServerUser(request);
    const body = await request.json();
    console.log('[API/ASIGNACIONES] Body recibido:', body);

    const validation = asignacionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Datos inválidos', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      action,                 // 'asignar' | 'desvincular'
      itemId,
      itemType,               // 'Computador' | 'Dispositivo'
      asignarA_id,            // id del Usuario o Departamento
      asignarA_type,          // 'Usuario'
      notas,
      gerenteId,              // <- ID seleccionado manualmente en el frontend (renombrado)
      serialC,
      modeloC,
      motivo,
      ubicacionId,
    } = validation.data;

    // Mapea si lo necesitas (hoy no lo estás usando)
    const prismaModelMapping = {
      Computador: 'computador',
      Dispositivo: 'dispositivo',
    } as const;

    const prismaModelName = prismaModelMapping[itemType as keyof typeof prismaModelMapping];
    if (!prismaModelName) {
      throw new Error(`Tipo de item inválido proporcionado: ${itemType}`);
    }

    console.log(`[API/ASIGNACIONES] Acción: ${action} sobre ${prismaModelName} con ID: ${itemId}`);

    const result = await prisma.$transaction(async (tx) => {
      if (action === 'asignar') {
        if (!asignarA_id || !asignarA_type) {
          throw new Error('Para asignar, se requiere el tipo y el ID del objetivo.');
        }

        // VALIDACIÓN: Verificar que el equipo no esté ya asignado
        let equipoActual;
        if (itemType === 'Computador') {
          equipoActual = await prisma.computador.findUnique({
            where: { id: itemId },
            select: { 
              estado: true, 
              serial: true 
            }
          });
        } else if (itemType === 'Dispositivo') {
          equipoActual = await prisma.dispositivo.findUnique({
            where: { id: itemId },
            select: { 
              estado: true, 
              serial: true 
            }
          });
        }

        if (!equipoActual) {
          throw new Error(`No se encontró el ${itemType.toLowerCase()} con ID: ${itemId}`);
        }

        if (equipoActual.estado === 'ASIGNADO') {
          // Verificar si ya hay una asignación activa para este equipo
          const asignacionExistente = await tx.asignacionesEquipos.findFirst({
            where: {
              [itemType === 'Computador' ? 'computadorId' : 'dispositivoId']: itemId,
              activo: true,
              actionType: 'Assignment'
            },
            include: {
              targetEmpleado: true
            }
          });

          if (asignacionExistente && asignacionExistente.targetEmpleado) {
            throw new Error(
              `El equipo ${equipoActual.serial} ya está asignado a ${asignacionExistente.targetEmpleado.nombre} ${asignacionExistente.targetEmpleado.apellido}. ` +
              `Debe desvincularlo primero antes de asignarlo a otra persona.`
            );
          }
        }

        // 1) Resuelve el gerente automático con el tx de la transacción
        const gerenteAuto = await getGerente(tx, {
          targetType: asignarA_type,
          targetId: asignarA_id,
          preferirGerenteGeneralSiTargetEsGerente: true,
        });

        // 2) Si el frontend envió un gerente seleccionado, tiene prioridad
        let gerenteIdFinal: string | null = null;
        let gerenteNombreFinal: string | null = null;

        if (gerenteId) {
          // Si vino override, úsalo. Si también quieres snapshot de nombre:
          const gSel = await tx.empleado.findUnique({ where: { id: gerenteId } });
          gerenteIdFinal = gSel?.id || null;
          gerenteNombreFinal = gSel ? `${gSel.nombre} ${gSel.apellido}` : null;
        } else if (gerenteAuto) {
          gerenteIdFinal = gerenteAuto.id;
          gerenteNombreFinal = `${gerenteAuto.nombre} ${gerenteAuto.apellido}`;
        }

        // 3) Crear asignación
        await tx.asignacionesEquipos.create({
          data: {
            actionType: 'Assignment',
            itemType,
            computadorId: itemType === 'Computador' ? itemId : null,
            dispositivoId: itemType === 'Dispositivo' ? itemId : null,

            targetType: 'Usuario',
            targetEmpleadoId: asignarA_id,

            notes: notas || null,

            gerenteId: gerenteIdFinal,
            motivo: motivo || null,
            ubicacionId: ubicacionId || null,
            activo: true,
            usuarioId: (user as any)?.id || null,
          },
        });

        // 4) Actualizar el activo
        const updateData: any = {
          estado: 'ASIGNADO',
        };

        if (itemType === 'Computador') {
          await tx.computador.update({ where: { id: itemId }, data: updateData });
        } else if (itemType === 'Dispositivo') {
          await tx.dispositivo.update({ where: { id: itemId }, data: updateData });
        }
      } else {
        // 'desvincular'
        const ultimaAsignacion = await tx.asignacionesEquipos.findFirst({
          where: {
            OR: [{ computadorId: itemId }, { dispositivoId: itemId }],
            actionType: 'Assignment',
            activo: true,
          },
          orderBy: { date: 'desc' },
        });

        if (!ultimaAsignacion) {
          throw new Error('No se encontró una asignación activa para este ítem para desvincular.');
        }

        // Desactivar la asignación actual
        await tx.asignacionesEquipos.update({
          where: { id: ultimaAsignacion.id },
          data: { activo: false }
        });

        // Crear registro de devolución
        await tx.asignacionesEquipos.create({
          data: {
            actionType: 'Return',
            itemType,
            computadorId: itemType === 'Computador' ? itemId : null,
            dispositivoId: itemType === 'Dispositivo' ? itemId : null,
            targetType: ultimaAsignacion.targetType,
            targetEmpleadoId: ultimaAsignacion.targetEmpleadoId,
            notes: notas || `Devolución de ${ultimaAsignacion.targetType}`,
            activo: true,
            usuarioId: (user as any)?.id || null,
          },
        });

        // Actualizar el estado del equipo
        const updateData: any = {
          estado: 'OPERATIVO',
        };

        if (itemType === 'Computador') {
          await tx.computador.update({ where: { id: itemId }, data: updateData });
        } else if (itemType === 'Dispositivo') {
          await tx.dispositivo.update({ where: { id: itemId }, data: updateData });
        }
      }

      return { success: true, message: `Acción '${action}' completada.` };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error en la transacción de asignación:', error);
    return NextResponse.json({ message: error.message || 'Error en el servidor' }, { status: 500 });
  }
}
