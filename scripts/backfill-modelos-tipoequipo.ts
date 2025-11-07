#!/usr/bin/env npx tsx
/**
 * Backfill de campo opcional tipoEquipoId en ModeloEquipo usando el string legacy 'tipo'.
 *
 * Modo por defecto: dry-run (no modifica nada) y muestra un resumen de qué actualizaría.
 * Usar --apply para ejecutar las actualizaciones.
 *
 * Lógica:
 *  - Carga todos los ModeloEquipo cuyo tipoEquipoId es null.
 *  - Intenta encontrar coincidencia exacta (case-insensitive) en TipoEquipo por (nombre, categoria inferida).
 *  - Si no se puede inferir la categoría por lista base, intenta buscar por nombre sin categoría.
 *  - Sólo actualiza si encuentra exactamente un TipoEquipo válido.
 *  - Registra auditoría (si se desea ampliar) actualmente solo log de consola.
 *
 * Seguridad:
 *  - No elimina ni crea tipos.
 *  - No modifica el campo 'tipo' (legacy) existente.
 */

import prisma from '../src/lib/prisma';

const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');

const TIPOS_COMPUTADORAS = ['Laptop','Desktop','Servidor','Workstation','All-in-One'];
const TIPOS_DISPOSITIVOS = ['Impresora','Cámara','Tablet','Smartphone','Monitor','Teclado','Mouse','Router','Switch','Proyector','Escáner','Altavoces','Micrófono','Webcam','DVR'];

function inferCategoria(nombre: string): 'COMPUTADORA' | 'DISPOSITIVO' | null {
  const lower = nombre.toLowerCase();
  if (TIPOS_COMPUTADORAS.some(t => t.toLowerCase() === lower)) return 'COMPUTADORA';
  if (TIPOS_DISPOSITIVOS.some(t => t.toLowerCase() === lower)) return 'DISPOSITIVO';
  return null;
}

async function main() {
  console.log('🔄 Iniciando backfill tipoEquipoId (modo ' + (APPLY ? 'APPLY' : 'DRY-RUN') + ')');
  try {
    // Verificar que la columna exista en la BD actual
    const columnExistsRows = await prisma.$queryRawUnsafe<any[]>(
      "SELECT 1 AS ok FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'tipoEquipoId' AND TABLE_NAME = 'ModeloEquipo'"
    );
    const columnExists = Array.isArray(columnExistsRows) && columnExistsRows.length > 0;
    if (!columnExists) {
      console.log('⚠️ La columna tipoEquipoId no existe en la base de datos actual.');
      console.log('   > Aplique la migración correspondiente antes de ejecutar este backfill.');
      console.log('   > Alternativa: ejecute primero el script de sincronización de tipos y despliegue las migraciones en el entorno destino.');
      return;
    }

    // Precargar todos los tipos en memoria (si existen) para matching case-insensitive
    const tipos = await prisma.tipoEquipo.findMany().catch(() => [] as any[]);
    if ((tipos as any[]).length === 0) {
      console.log('⚠️ No hay registros en TipoEquipo. Ejecute primero: npx tsx scripts/sync-tipos-equipos.ts');
      if (!FORCE) {
        console.log('⏭️ Abortado (usa --force para continuar sin Tipos en BD, no recomendado).');
        return;
      } else {
        console.log('⚠️ Continuando por --force (no se asignará ningún tipoEquipoId).');
      }
    }
    const mapComp = new Map<string, string>();
    const mapDisp = new Map<string, string>();
    for (const t of tipos as any[]) {
      const key = String(t.nombre).toLowerCase();
      if (t.categoria === 'COMPUTADORA') mapComp.set(key, t.id);
      if (t.categoria === 'DISPOSITIVO') mapDisp.set(key, t.id);
    }

    // Evitar referencias tipadas a columnas no presentes en el cliente generado: obtener todos y filtrar en JS
    const todos = await prisma.modeloEquipo.findMany();
    const pendientes = todos.filter((m: any) => (m as any).tipoEquipoId == null);

    if (pendientes.length === 0) {
      console.log('✅ No hay modelos pendientes (todos ya tienen tipoEquipoId o no existen).');
      return;
    }

    console.log(`📊 Modelos sin tipoEquipoId: ${pendientes.length}`);

    let asignables: Array<{ id: string; nombre: string; tipoLegacy: string; tipoEquipoId: string; categoria: string }> = [];
    let sinCoincidencia: Array<{ id: string; nombre: string; tipoLegacy: string }> = [];

    for (const modelo of pendientes) {
      const categoria = inferCategoria(modelo.tipo);
      const key = String(modelo.tipo).toLowerCase();
      let tipoId: string | undefined;
      if (categoria === 'COMPUTADORA') tipoId = mapComp.get(key);
      else if (categoria === 'DISPOSITIVO') tipoId = mapDisp.get(key);
      // Fallback: buscar por nombre sin categoría
      if (!tipoId) tipoId = mapComp.get(key) || mapDisp.get(key);

      if (tipoId) {
        asignables.push({
          id: modelo.id,
          nombre: modelo.nombre,
          tipoLegacy: modelo.tipo,
          tipoEquipoId: tipoId,
          categoria: categoria || 'DESCONOCIDA'
        });
      } else {
        sinCoincidencia.push({ id: modelo.id, nombre: modelo.nombre, tipoLegacy: modelo.tipo });
      }
    }

    console.log(`✅ Coincidencias encontradas: ${asignables.length}`);
    console.log(`⚠️ Sin coincidencia: ${sinCoincidencia.length}`);

    if (!APPLY) {
      console.log('\n🔎 DRY-RUN Detalle de asignables (primeros 20):');
      for (const a of asignables.slice(0,20)) {
        console.log(`  • Modelo "${a.nombre}" (tipo="${a.tipoLegacy}") → TipoEquipoId=${a.tipoEquipoId} (${a.categoria})`);
      }
      if (sinCoincidencia.length) {
        console.log('\n⚠️ Sin coincidencia (primeros 20):');
        for (const s of sinCoincidencia.slice(0,20)) {
          console.log(`  • Modelo "${s.nombre}" (tipo="${s.tipoLegacy}")`);
        }
      }
      console.log('\n💡 Ejecuta con --apply para realizar las actualizaciones.');
      return;
    }

    if (APPLY) {
      console.log('\n✍️ Aplicando actualizaciones...');
      let updatedCount = 0;
      for (const a of asignables) {
        await prisma.modeloEquipo.update({
          where: { id: a.id },
          // Cast a any para evitar error de tipos cuando el cliente no está regenerado en el entorno
          data: ({ tipoEquipoId: a.tipoEquipoId } as any)
        });
        updatedCount++;
        console.log(`  ✅ Actualizado modelo "${a.nombre}" → tipoEquipoId=${a.tipoEquipoId}`);
      }
      console.log(`\n🎉 Backfill completado. Modelos actualizados: ${updatedCount}`);
      if (sinCoincidencia.length) {
        console.log('⚠️ Quedaron sin coincidencia: ' + sinCoincidencia.length);
      }
    }
  } catch (error) {
    console.error('❌ Error en backfill:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
