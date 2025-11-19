#!/usr/bin/env npx tsx
/**
 * detect-orphan-asignados.ts
 *
 * Propósito:
 *   Detectar equipos (computadores y dispositivos) que están en estado 'ASIGNADO'
 *   pero NO poseen una asignación activa válida (fila en AsignacionesEquipos con:
 *     - activo = true
 *     - targetEmpleadoId no nulo
 *     - actionType en ['ASIGNACION','ASSIGNMENT'])
 *
 * Funcionalidad:
 *   1. Lista de "huérfanos" (estado ASIGNADO sin asignación activa válida).
 *   2. Lista de inconsistencias inversas (estado NO ASIGNADO con asignación activa válida).
 *   3. Para cada huérfano intenta localizar un último empleado histórico (última asignación con targetEmpleadoId != null).
 *   4. Modo DRY-RUN por defecto (solo reporta).
 *   5. Flags:
 *       --apply        Aplica correcciones.
 *       --downgrade    Al aplicar: cambia estado a 'OPERATIVO' si no puede recuperar empleado histórico.
 *       --assign <id>  Al aplicar: asigna TODOS los huérfanos sin histórico al empleado indicado (crea asignación activa nueva).
 *       --limit <n>    Limita el número de equipos procesados (debug/performance).
 *       --json         Imprime resultado en JSON final además del log humano.
 *
 * Estrategia de Corrección (cuando --apply):
 *   - Si existe empleado histórico: crea UNA nueva asignación activa (actionType='ASIGNACION') y deja estado como ASIGNADO.
 *   - Si NO existe histórico:
 *       a) Si --assign <empleadoId>: crea asignación con ese empleado.
 *       b) Else si --downgrade: cambia estado a OPERATIVO (log ⚠️ downgrade).
 *       c) Else: deja huérfano (log ❌ no corregido).
 *   - Inconsistencias inversas (estado NO asignado pero con asignación activa válida): desactiva asignación activa (activo=false).
 *
 * Seguridad:
 *   - No borra registros, solo crea nuevas asignaciones o actualiza estado/activo.
 *   - Usa transacciones por equipo para asegurar consistencia.
 *
 * Uso:
 *   DRY-RUN:
 *     npx tsx scripts/detect-orphan-asignados.ts
 *   Aplicar (downgrade donde no hay histórico):
 *     npx tsx scripts/detect-orphan-asignados.ts --apply --downgrade
 *   Aplicar asignando a empleado específico (mantener ASIGNADO):
 *     npx tsx scripts/detect-orphan-asignados.ts --apply --assign 3ce9ce06-ece6-4846-b234-d63a78918a9c
 */

import { prisma } from '../src/lib/prisma';

interface EquipoHuérfano {
  id: string;
  tipo: 'COMPUTADOR' | 'DISPOSITIVO';
  serial: string;
  codigoImgc: string;
  ultimoEmpleadoHistoricoId?: string | null;
  ultimoEmpleadoHistoricoNombre?: string | null;
}

interface InconsistenciaInversa {
  id: string;
  tipo: 'COMPUTADOR' | 'DISPOSITIVO';
  serial: string;
  codigoImgc: string;
  asignacionActivaId: string;
  empleadoId?: string | null;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flags: Record<string,string|boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const next = args[i+1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  return {
    apply: !!flags['apply'],
    downgrade: !!flags['downgrade'],
    assignEmpleadoId: typeof flags['assign'] === 'string' ? String(flags['assign']) : undefined,
    limit: flags['limit'] ? Number(flags['limit']) : undefined,
    json: !!flags['json'],
  };
}

async function main() {
  const { apply, downgrade, assignEmpleadoId, limit, json } = parseArgs();
  console.log(`\n🚀 Iniciando detección de asignaciones huérfanas (DRY-RUN=${!apply})...`);
  if (assignEmpleadoId && downgrade) {
    console.log('⚠️ Se proporcionaron --assign y --downgrade: prioridad a --assign para huérfanos sin histórico');
  }

  // Helper para obtener equipos según estado
  const computadoresAsignados = await prisma.computador.findMany({
    where: { estado: 'ASIGNADO' },
    select: { id: true, serial: true, codigoImgc: true }
  });
  const dispositivosAsignados = await prisma.dispositivo.findMany({
    where: { estado: 'ASIGNADO' },
    select: { id: true, serial: true, codigoImgc: true }
  });

  const computadoresNoAsignadosConActiva = await prisma.computador.findMany({
    where: { estado: { not: 'ASIGNADO' }, asignaciones: { some: { activo: true, targetEmpleadoId: { not: null }, actionType: { in: ['ASIGNACION','ASSIGNMENT'] } } } },
    select: { id: true, serial: true, codigoImgc: true }
  });
  const dispositivosNoAsignadosConActiva = await prisma.dispositivo.findMany({
    where: { estado: { not: 'ASIGNADO' }, asignaciones: { some: { activo: true, targetEmpleadoId: { not: null }, actionType: { in: ['ASIGNACION','ASSIGNMENT'] } } } },
    select: { id: true, serial: true, codigoImgc: true }
  });

  const huérfanos: EquipoHuérfano[] = [];
  const inversas: InconsistenciaInversa[] = [];

  // Revisar equipos en estado ASIGNADO y chequear si tienen asignación activa válida
  async function evaluarAsignados(lista: {id:string;serial:string;codigoImgc:string}[], tipo: 'COMPUTADOR'|'DISPOSITIVO') {
    for (const item of lista) {
      // Buscar asignación activa válida
      const activa = await prisma.asignacionesEquipos.findFirst({
        where: {
          activo: true,
          actionType: { in: ['ASIGNACION','ASSIGNMENT'] },
          targetEmpleadoId: { not: null },
          [tipo === 'COMPUTADOR' ? 'computadorId' : 'dispositivoId']: item.id
        }
      });
      if (!activa) {
        // buscar último histórico con targetEmpleadoId (aunque esté inactivo)
        const historica = await prisma.asignacionesEquipos.findFirst({
          where: {
            targetEmpleadoId: { not: null },
            [tipo === 'COMPUTADOR' ? 'computadorId' : 'dispositivoId']: item.id
          },
          orderBy: { date: 'desc' }
        });
        huérfanos.push({
          id: item.id,
            tipo,
          serial: item.serial,
          codigoImgc: item.codigoImgc,
          ultimoEmpleadoHistoricoId: historica?.targetEmpleadoId || null,
          ultimoEmpleadoHistoricoNombre: historica?.targetEmpleadoId ? undefined : null // se podría enriquecer con include empleado
        });
      }
      if (limit && huérfanos.length >= limit) break;
    }
  }

  async function evaluarNoAsignadosConActiva(lista: {id:string;serial:string;codigoImgc:string}[], tipo: 'COMPUTADOR'|'DISPOSITIVO') {
    for (const item of lista) {
      const activa = await prisma.asignacionesEquipos.findFirst({
        where: {
          activo: true,
          actionType: { in: ['ASIGNACION','ASSIGNMENT'] },
          targetEmpleadoId: { not: null },
          [tipo === 'COMPUTADOR' ? 'computadorId' : 'dispositivoId']: item.id
        }
      });
      if (activa) {
        inversas.push({
          id: item.id,
          tipo,
          serial: item.serial,
          codigoImgc: item.codigoImgc,
          asignacionActivaId: activa.id,
          empleadoId: activa.targetEmpleadoId
        });
      }
      if (limit && inversas.length >= limit) break;
    }
  }

  await evaluarAsignados(computadoresAsignados, 'COMPUTADOR');
  await evaluarAsignados(dispositivosAsignados, 'DISPOSITIVO');
  await evaluarNoAsignadosConActiva(computadoresNoAsignadosConActiva, 'COMPUTADOR');
  await evaluarNoAsignadosConActiva(dispositivosNoAsignadosConActiva, 'DISPOSITIVO');

  console.log(`\n📊 RESUMEN`);
  console.log(`   ASIGNADOS (computadores): ${computadoresAsignados.length}`);
  console.log(`   ASIGNADOS (dispositivos): ${dispositivosAsignados.length}`);
  console.log(`   Huérfanos encontrados: ${huérfanos.length}`);
  console.log(`   Inconsistencias inversas: ${inversas.length}`);

  if (huérfanos.length) {
    console.log('\n🔍 Huérfanos:');
    huérfanos.forEach(h => {
      console.log(`   - ${h.tipo} ${h.serial} (${h.codigoImgc}) sin asignación activa. Histórico empleado: ${h.ultimoEmpleadoHistoricoId || 'Ninguno'}`);
    });
  } else {
    console.log('\n✅ No se detectaron huérfanos.');
  }

  if (inversas.length) {
    console.log('\n⚠️ Inconsistencias inversas:');
    inversas.forEach(i => {
      console.log(`   - ${i.tipo} ${i.serial} (${i.codigoImgc}) estado NO ASIGNADO pero asignación activa ${i.asignacionActivaId}`);
    });
  } else {
    console.log('\n✅ No se detectaron inconsistencias inversas.');
  }

  const applied: string[] = [];
  const skipped: string[] = [];

  if (apply) {
    console.log('\n🔧 Aplicando correcciones...');
    // Corrección huérfanos
    for (const h of huérfanos) {
      await prisma.$transaction(async tx => {
        // Re-evaluar por seguridad dentro de transacción
        const activa = await tx.asignacionesEquipos.findFirst({
          where: {
            activo: true,
            actionType: { in: ['ASIGNACION','ASSIGNMENT'] },
            targetEmpleadoId: { not: null },
            [h.tipo === 'COMPUTADOR' ? 'computadorId' : 'dispositivoId']: h.id
          }
        });
        if (activa) {
          skipped.push(`${h.tipo}:${h.id}: ya corregido concurrentemente`);
          return;
        }
        let empleadoAsignar: string | undefined;
        if (h.ultimoEmpleadoHistoricoId) {
          empleadoAsignar = h.ultimoEmpleadoHistoricoId;
        } else if (assignEmpleadoId) {
          empleadoAsignar = assignEmpleadoId;
        }
        if (empleadoAsignar) {
          // Crear nueva asignación y asegurar estado ASIGNADO
          await tx.asignacionesEquipos.create({
            data: {
              actionType: 'ASIGNACION',
              itemType: h.tipo === 'COMPUTADOR' ? 'Computador' : 'Dispositivo',
              targetType: 'EMPLEADO',
              notes: h.ultimoEmpleadoHistoricoId ? 'Recuperación de asignación histórica' : 'Asignación por script (sin histórico)',
              activo: true,
              targetEmpleadoId: empleadoAsignar,
              [h.tipo === 'COMPUTADOR' ? 'computadorId' : 'dispositivoId']: h.id
            }
          });
          await tx[h.tipo === 'COMPUTADOR' ? 'computador' : 'dispositivo'].update({
            where: { id: h.id },
            data: { estado: 'ASIGNADO' }
          });
          applied.push(`${h.tipo}:${h.id}: asignación creada (empleado ${empleadoAsignar})`);
        } else if (downgrade) {
          await tx[h.tipo === 'COMPUTADOR' ? 'computador' : 'dispositivo'].update({
            where: { id: h.id },
            data: { estado: 'OPERATIVO' }
          });
          applied.push(`${h.tipo}:${h.id}: downgraded a OPERATIVO (sin histórico)`);
        } else {
          skipped.push(`${h.tipo}:${h.id}: sin histórico y sin flags (--assign / --downgrade)`);
        }
      });
    }

    // Corrección inversas: desactivar asignación activa
    for (const i of inversas) {
      await prisma.$transaction(async tx => {
        await tx.asignacionesEquipos.update({
          where: { id: i.asignacionActivaId },
          data: { activo: false, notes: 'Desactivada por script (estado no asignado)' }
        });
        applied.push(`${i.tipo}:${i.id}: asignación activa ${i.asignacionActivaId} desactivada`);
      });
    }

    console.log('\n✅ Correcciones aplicadas:');
    applied.forEach(a => console.log(`   - ${a}`));
    if (skipped.length) {
      console.log('\n⚠️ No corregidos / Skipped:');
      skipped.forEach(s => console.log(`   - ${s}`));
    }
  } else {
    console.log('\nℹ️ Modo DRY-RUN: no se aplicaron cambios. Use --apply para corregir.');
  }

  if (json) {
    const output = { resumen: { huérfanos: huérfanos.length, inversas: inversas.length }, huérfanos, inversas, applied, skipped, applyMode: apply };
    console.log('\nJSON_OUTPUT_START');
    console.log(JSON.stringify(output, null, 2));
    console.log('JSON_OUTPUT_END');
  }

  console.log('\n🎉 Finalizado detect-orphan-asignados');
}

main().catch(e => {
  console.error('❌ Error en script detect-orphan-asignados:', e);
}).finally(async () => {
  await prisma.$disconnect();
});
