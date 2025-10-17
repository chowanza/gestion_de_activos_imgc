#!/usr/bin/env -S node

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const dryRun = !apply;

  console.log('🔎 Inspecting modeloEquipo and dependent relations');

  // Find remaining modeloEquipo rows
  const modelos = await prisma.modeloEquipo.findMany({ select: { id: true, nombre: true } });
  console.log(`Found ${modelos.length} modeloEquipo rows`);
  if (modelos.length === 0) {
    console.log('Nothing to do.');
    await prisma.$disconnect();
    return;
  }

  // For each modelo, count dependents
  const report: any[] = [];
  for (const m of modelos) {
    const marcaCount = await prisma.marcaModeloEquipo.count({ where: { modeloEquipoId: m.id } });
    const compCount = await prisma.computadorModeloEquipo.count({ where: { modeloEquipoId: m.id } });
    const dispCount = await prisma.dispositivoModeloEquipo.count({ where: { modeloEquipoId: m.id } });
    report.push({ id: m.id, nombre: m.nombre, marcaModeloEquipo: marcaCount, computadorModeloEquipo: compCount, dispositivoModeloEquipo: dispCount });
  }

  console.table(report.map(r => ({ id: r.id, nombre: r.nombre, marca: r.marcaModeloEquipo, computador: r.computadorModeloEquipo, dispositivo: r.dispositivoModeloEquipo })));

  if (dryRun) {
    console.log('\nℹ️  Dry-run complete. To remove dependents and modelos run with --apply');
    await prisma.$disconnect();
    return;
  }

  console.log('\n⚠️ APPLY MODE: deleting dependents then modeloEquipo rows');

  // Delete dependents first
  for (const m of modelos) {
    try {
      const marcaRes = await prisma.marcaModeloEquipo.deleteMany({ where: { modeloEquipoId: m.id } });
      const compRes = await prisma.computadorModeloEquipo.deleteMany({ where: { modeloEquipoId: m.id } });
      const dispRes = await prisma.dispositivoModeloEquipo.deleteMany({ where: { modeloEquipoId: m.id } });
      console.log(`Deleted for modelo ${m.id}: marcaModeloEquipo=${marcaRes.count}, computadorModeloEquipo=${compRes.count}, dispositivoModeloEquipo=${dispRes.count}`);
    } catch (e) {
      console.warn(`Error deleting dependents for modelo ${m.id}:`, e);
    }
  }

  // Now delete modeloEquipo rows
  try {
    const res = await prisma.modeloEquipo.deleteMany();
    console.log(`Deleted ${res.count} modeloEquipo rows`);
  } catch (e) {
    console.error('Error deleting modeloEquipo rows:', e);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); try { await prisma.$disconnect(); } catch {} process.exit(1); });
