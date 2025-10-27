#!/usr/bin/env node
/**
 * Script: diag-ubicacion.ts
 * Propósito: Diagnosticar por qué una ubicación (por nombre) muestra 0 equipos.
 * Muestra: Id de la ubicación, filas en vw_ubicacion_actual, filas en AsignacionesEquipos,
 * y conteos únicos de computadores/dispositivos.
 * Uso: npx tsx scripts/diag-ubicacion.ts "Telematica"
 */
import { prisma } from '../src/lib/prisma';

async function main() {
  const nameArg = process.argv[2] || 'Telematica';
  console.log(`🔎 Diagnóstico de ubicación: "${nameArg}"`);

  try {
    const ubicacion = await prisma.ubicacion.findFirst({ where: { nombre: { equals: nameArg } } });
    if (!ubicacion) {
      console.warn(`❌ No se encontró ubicación con nombre exactamente "${nameArg}". Buscando coincidencias...`);
      const matches = await prisma.ubicacion.findMany({ where: { nombre: { contains: nameArg } }, take: 10 });
      console.log('Coincidencias encontradas:', matches.map(m => ({ id: m.id, nombre: m.nombre }))); 
      process.exitCode = 1;
      return;
    }

    console.log('✅ Ubicación encontrada:', { id: ubicacion.id, nombre: ubicacion.nombre });

    // Intentar leer desde la vista
    try {
      const vwRows: any[] = await prisma.$queryRawUnsafe(`
        SELECT tipo, equipoId, ubicacionId, date, targetEmpleadoId, asignacionId
        FROM dbo.vw_ubicacion_actual
        WHERE ubicacionId = '${ubicacion.id}'
        ORDER BY date DESC
      `);

      console.log(`
--- vw_ubicacion_actual rows for ${ubicacion.nombre} (${vwRows.length}) ---`);
      console.log(vwRows.slice(0, 20));

      const computadoresInView = new Set(vwRows.filter(r => r.tipo === 'C').map(r => r.equipoId));
      const dispositivosInView = new Set(vwRows.filter(r => r.tipo === 'D').map(r => r.equipoId));

      console.log(`vw counts -> computadores: ${computadoresInView.size}, dispositivos: ${dispositivosInView.size}`);
    } catch (err: any) {
      console.warn('⚠️ No se pudo consultar vw_ubicacion_actual (vista ausente o permiso):', err?.message || err);
    }

    // Leer asignaciones que tengan ubicacionId = ubicacion.id
    const asigns = await prisma.asignacionesEquipos.findMany({
      where: { ubicacionId: ubicacion.id },
      orderBy: { date: 'desc' },
      select: { id: true, computadorId: true, dispositivoId: true, date: true, activo: true, itemType: true, targetEmpleadoId: true }
    });

    console.log(`\n--- AsignacionesEquipos rows for ${ubicacion.nombre} (${asigns.length}) ---`);
    console.log(asigns.slice(0, 30));

    const computadoresSet = new Set<string>();
    const dispositivosSet = new Set<string>();
    asigns.forEach(a => { if (a.computadorId) computadoresSet.add(a.computadorId); if (a.dispositivoId) dispositivosSet.add(a.dispositivoId); });

    console.log(`\nAsignaciones counts -> computadores (unique ids): ${computadoresSet.size}, dispositivos: ${dispositivosSet.size}`);

    // Complement: contar últimas asignaciones por equipo (ROW_NUMBER emulation in JS)
    const allAsigns = await prisma.asignacionesEquipos.findMany({
      where: { OR: [ { computadorId: { not: null } }, { dispositivoId: { not: null } } ] },
      orderBy: { date: 'desc' },
      select: { id: true, computadorId: true, dispositivoId: true, ubicacionId: true, date: true, activo: true }
    });

    const latestMap = new Map<string, any>();
    for (const a of allAsigns) {
      const key = a.computadorId ? `C:${a.computadorId}` : a.dispositivoId ? `D:${a.dispositivoId}` : null;
      if (!key) continue;
      if (!latestMap.has(key)) latestMap.set(key, a);
    }

    const latestAtUbicacion = Array.from(latestMap.values()).filter(a => a.ubicacionId === ubicacion.id);
    console.log(`\nÚltimas asignaciones por equipo que apuntan a ${ubicacion.nombre}: ${latestAtUbicacion.length}`);
    console.log(latestAtUbicacion.slice(0, 40));

    // Mostrar si hay discrepancias: por ejemplo asignaciones presentes pero no en la vista
    console.log('\n✅ Diagnóstico completado');
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
