#!/usr/bin/env -S node

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const dryRun = !apply;

  console.log('🚀 clean-db-leave-admin starting');
  console.log(dryRun ? 'ℹ️  Running in dry-run mode (no deletions will be performed)'.padEnd(0) : '⚠️  APPLY MODE: will perform deletions');

  // identify admin users (role === 'admin' or username 'admin')
  const admins = await prisma.user.findMany({ where: { OR: [{ role: 'admin' }, { username: 'admin' }] } });
  const adminIds = admins.map((u) => u.id);

  console.log(`Found ${admins.length} admin user(s). Will preserve IDs: ${adminIds.join(', ') || '(none)'}`);

  // Models to backup/delete (ordered for FK safety)
  const models: { name: string; clientKey: string }[] = [
    { name: 'historialMovimientos', clientKey: 'historialMovimientos' },
    { name: 'historialModificaciones', clientKey: 'historialModificaciones' },
    { name: 'intervencionesEquipos', clientKey: 'intervencionesEquipos' },
    { name: 'asignacionesEquipos', clientKey: 'asignacionesEquipos' },
    { name: 'empleadoStatusHistory', clientKey: 'empleadoStatusHistory' },
    { name: 'empleadoEmpresaDepartamentoCargo', clientKey: 'empleadoEmpresaDepartamentoCargo' },
    { name: 'departamentoGerente', clientKey: 'departamentoGerente' },
    { name: 'computadorModeloEquipo', clientKey: 'computadorModeloEquipo' },
    { name: 'dispositivoModeloEquipo', clientKey: 'dispositivoModeloEquipo' },
    { name: 'empresaDepartamento', clientKey: 'empresaDepartamento' },
    { name: 'departamentoCargo', clientKey: 'departamentoCargo' },
    { name: 'computador', clientKey: 'computador' },
    { name: 'dispositivo', clientKey: 'dispositivo' },
    { name: 'empleado', clientKey: 'empleado' },
    { name: 'computadorModeloEquipo', clientKey: 'computadorModeloEquipo' },
    { name: 'modeloEquipo', clientKey: 'modeloEquipo' },
    { name: 'marcaModeloEquipo', clientKey: 'marcaModeloEquipo' },
    { name: 'marca', clientKey: 'marca' },
    { name: 'empresa', clientKey: 'empresa' },
    { name: 'departamento', clientKey: 'departamento' },
    { name: 'cargo', clientKey: 'cargo' },
    { name: 'ubicacion', clientKey: 'ubicacion' },
    { name: 'sysdiagrams', clientKey: 'sysdiagrams' },
  ];

  // Build backup
  const backup: Record<string, any> = {
    meta: {
      timestamp: Date.now(),
      admins: admins.map((a) => ({ id: a.id, username: a.username, role: a.role })),
    },
    data: {},
  };

  for (const m of models) {
    try {
      // @ts-ignore - dynamic access
      const rows = await (prisma as any)[m.clientKey].findMany();
      backup.data[m.name] = rows;
      console.log(`  will backup model ${m.name}: ${rows.length} rows`);
    } catch (error) {
      console.warn(`  skipping model ${m.name} (error reading): ${String(error)}`);
    }
  }

  // Also backup users
  const users = await prisma.user.findMany();
  backup.data.user = users;
  console.log(`  will backup model user: ${users.length} rows`);

  const backupsDir = path.join(process.cwd(), 'scripts', 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  const backupPath = path.join(backupsDir, `clean-db-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`✅ Backup written: ${backupPath}`);

  // Dry-run: report counts that would be deleted
  const deleteCounts: Record<string, number> = {};
  for (const m of models) {
    try {
      // @ts-ignore
      const count = await (prisma as any)[m.clientKey].count();
      deleteCounts[m.name] = count;
    } catch (error) {
      deleteCounts[m.name] = -1; // error
    }
  }
  // users to delete (non-admins)
  const nonAdminCount = await prisma.user.count({ where: { id: { notIn: adminIds.length ? adminIds : [''] } } });
  deleteCounts['user(non-admin)'] = nonAdminCount;

  console.log('--- Dry-run deletion summary ---');
  for (const k of Object.keys(deleteCounts)) {
    console.log(`  ${k}: ${deleteCounts[k]}`);
  }

  if (dryRun) {
    console.log('\nℹ️  Dry-run complete. To perform deletion run with --apply');
    await prisma.$disconnect();
    return;
  }

  // APPLY mode: perform deletions in order
  console.log('\n⚠️  APPLYING deletions now...');
  for (const m of models) {
    try {
      // @ts-ignore
      const res = await (prisma as any)[m.clientKey].deleteMany();
      console.log(`  deleted ${res.count} rows from ${m.name}`);
    } catch (error) {
      console.warn(`  error deleting ${m.name}: ${String(error)}`);
    }
  }

  // finally, delete non-admin users
  try {
    const where = adminIds.length ? { id: { notIn: adminIds } } : {};
    const res = await prisma.user.deleteMany({ where });
    console.log(`  deleted ${res.count} non-admin user(s)`);
  } catch (error) {
    console.warn('  error deleting users:', String(error));
  }

  console.log('\n✅ APPLY complete. Database cleaned. Admin users preserved.');
  console.log(`  backup file: ${backupPath}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Fatal error:', err);
  try { await prisma.$disconnect(); } catch (e) {}
  process.exit(1);
});
