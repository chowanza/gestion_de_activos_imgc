#!/usr/bin/env -S node

/**
 * Verificar consistencia entre estado del equipo y asignaciones activas.
 *
 * Funcionalidad:
 * - Detecta equipos con estado ASIGNADO sin asignación activa
 * - Detecta equipos NO asignados con asignación activa
 * - Reporta equipos EN_MANTENIMIENTO sin asignación activa (warning)
 * - --apply: corrige inconsistencias creando/desactivando asignaciones
 * - --downgrade: además, cambia estado a OPERATIVO si no es posible recuperar empleado
 *
 * Uso:
 *   npx tsx scripts/verificar-consistencia-asignaciones.ts          # DRY-RUN
 *   npx tsx scripts/verificar-consistencia-asignaciones.ts --apply  # Aplicar correcciones
 *   npx tsx scripts/verificar-consistencia-asignaciones.ts --apply --downgrade  # También baja estado a OPERATIVO si no hay empleado
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type EquipoTipo = 'Computador' | 'Dispositivo';

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const downgrade = args.includes('--downgrade');
  const dryRun = !apply;

  console.log('🚀 Iniciando verificación de consistencia de asignaciones...');
  console.log(dryRun ? 'ℹ️  Modo DRY-RUN (sin cambios)' : '⚠️  APPLY MODE: Se aplicarán correcciones');
  if (apply && downgrade) console.log('⚠️  Opción --downgrade activada: equipos sin empleado histórico pasarán a OPERATIVO');

  const estadosNoAsignados = ['OPERATIVO','EN_RESGUARDO','DE_BAJA'];
  const estadosAsignados = ['ASIGNADO','EN_MANTENIMIENTO'];

  // Helpers
  const findLastEmployeeAssignment = async (tipo: EquipoTipo, id: string) => {
    const last = await prisma.asignacionesEquipos.findFirst({
      where: {
        [tipo === 'Computador' ? 'computadorId' : 'dispositivoId']: id,
        targetEmpleadoId: { not: null }
      },
      orderBy: { date: 'desc' }
    });
    return last || null;
  };

  const createActiveAssignment = async (
    tipo: EquipoTipo,
    id: string,
    targetEmpleadoId: string | null,
    ubicacionId: string | null
  ) => {
    if (dryRun) return;
    await prisma.asignacionesEquipos.create({
      data: {
        date: new Date(),
        actionType: 'ASIGNACION',
        targetType: 'Usuario',
        targetEmpleadoId,
        itemType: tipo,
        computadorId: tipo === 'Computador' ? id : null,
        dispositivoId: tipo === 'Dispositivo' ? id : null,
        motivo: 'Corrección de consistencia: crear asignación activa faltante',
        notes: 'Script verificar-consistencia-asignaciones',
        evidenciaFotos: null,
        gerenteId: null,
        ubicacionId,
        activo: true,
      }
    });
  };

  const deactivateActiveAssignments = async (tipo: EquipoTipo, id: string) => {
    if (dryRun) return { count: 0 } as { count: number };
    return prisma.asignacionesEquipos.updateMany({
      where: {
        [tipo === 'Computador' ? 'computadorId' : 'dispositivoId']: id,
        activo: true
      },
      data: { activo: false }
    });
  };

  const createStateRecord = async (
    tipo: EquipoTipo,
    id: string,
    actionType: 'DEVOLUCION' | 'CAMBIO_ESTADO',
    targetEmpleadoId: string | null,
    motivo: string
  ) => {
    if (dryRun) return;
    await prisma.asignacionesEquipos.create({
      data: {
        date: new Date(),
        actionType,
        targetType: targetEmpleadoId ? 'Usuario' : 'SISTEMA',
        targetEmpleadoId,
        itemType: tipo,
        computadorId: tipo === 'Computador' ? id : null,
        dispositivoId: tipo === 'Dispositivo' ? id : null,
        motivo,
        notes: 'Script verificar-consistencia-asignaciones',
        evidenciaFotos: null,
        gerenteId: null,
        ubicacionId: null,
        activo: false
      }
    });
  };

  const setEstado = async (tipo: EquipoTipo, id: string, estado: string) => {
    if (dryRun) return;
    if (tipo === 'Computador') {
      await prisma.computador.update({ where: { id }, data: { estado } });
    } else {
      await prisma.dispositivo.update({ where: { id }, data: { estado } });
    }
  };

  // Query equipos
  const [computadores, dispositivos] = await Promise.all([
    prisma.computador.findMany({
      include: { asignaciones: { where: { activo: true } } }
    }),
    prisma.dispositivo.findMany({
      include: { asignaciones: { where: { activo: true } } }
    })
  ]);

  // Clasificar
  const compAsignadoSinActiva = computadores.filter(c => c.estado === 'ASIGNADO' && (c.asignaciones?.length ?? 0) === 0);
  const dispAsignadoSinActiva = dispositivos.filter(d => d.estado === 'ASIGNADO' && (d.asignaciones?.length ?? 0) === 0);

  const compNoAsignadoConActiva = computadores.filter(c => estadosNoAsignados.includes(c.estado) && (c.asignaciones?.length ?? 0) > 0);
  const dispNoAsignadoConActiva = dispositivos.filter(d => estadosNoAsignados.includes(d.estado) && (d.asignaciones?.length ?? 0) > 0);

  const compMantSinActiva = computadores.filter(c => c.estado === 'EN_MANTENIMIENTO' && (c.asignaciones?.length ?? 0) === 0);
  const dispMantSinActiva = dispositivos.filter(d => d.estado === 'EN_MANTENIMIENTO' && (d.asignaciones?.length ?? 0) === 0);

  console.log('\n📊 RESUMEN');
  console.log(`🖥️  Computadores ASIGNADO sin activa: ${compAsignadoSinActiva.length}`);
  console.log(`📱 Dispositivos ASIGNADO sin activa: ${dispAsignadoSinActiva.length}`);
  console.log(`🖥️  Computadores NO asignados con activa: ${compNoAsignadoConActiva.length}`);
  console.log(`📱 Dispositivos NO asignados con activa: ${dispNoAsignadoConActiva.length}`);
  console.log(`🛠️  Computadores EN_MANTENIMIENTO sin activa (warning): ${compMantSinActiva.length}`);
  console.log(`🛠️  Dispositivos EN_MANTENIMIENTO sin activa (warning): ${dispMantSinActiva.length}`);

  // Correcciones
  const fixAsignadoSinActiva = async (tipo: EquipoTipo, items: { id: string }[]) => {
    for (const item of items) {
      const last = await findLastEmployeeAssignment(tipo, item.id);
      if (last?.targetEmpleadoId) {
        console.log(`✅ ${tipo} ${item.id}: creando asignación activa para empleado ${last.targetEmpleadoId}`);
        await createActiveAssignment(tipo, item.id, last.targetEmpleadoId, last.ubicacionId ?? null);
      } else {
        console.log(`⚠️  ${tipo} ${item.id}: no hay historial de empleado. ${apply && downgrade ? 'Bajando a OPERATIVO' : 'Sin cambios'}`);
        if (apply && downgrade) {
          await deactivateActiveAssignments(tipo, item.id);
          await setEstado(tipo, item.id, 'OPERATIVO');
          await createStateRecord(tipo, item.id, 'CAMBIO_ESTADO', null, 'Corrección: estado no consistente, sin empleado histórico');
        }
      }
    }
  };

  const fixNoAsignadoConActiva = async (tipo: EquipoTipo, items: { id: string }[]) => {
    for (const item of items) {
      console.log(`🔄 ${tipo} ${item.id}: desactivando asignaciones activas en estado NO asignado`);
      const active = await prisma.asignacionesEquipos.findMany({
        where: {
          [tipo === 'Computador' ? 'computadorId' : 'dispositivoId']: item.id,
          activo: true
        }
      });
      await deactivateActiveAssignments(tipo, item.id);
      const targetEmpleadoId = active[0]?.targetEmpleadoId ?? null;
      await createStateRecord(tipo, item.id, 'DEVOLUCION', targetEmpleadoId, 'Corrección: estado no asignado con asignación activa');
    }
  };

  if (apply) {
    console.log('\n🛠️  Aplicando correcciones...');
    await fixAsignadoSinActiva('Computador', compAsignadoSinActiva);
    await fixAsignadoSinActiva('Dispositivo', dispAsignadoSinActiva);
    await fixNoAsignadoConActiva('Computador', compNoAsignadoConActiva);
    await fixNoAsignadoConActiva('Dispositivo', dispNoAsignadoConActiva);
    console.log('🎉 Correcciones aplicadas');
  } else {
    console.log('\n🧪 DRY-RUN: No se aplicaron cambios. Use --apply para corregir.');
  }

  console.log('\n✅ Verificación completada');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
