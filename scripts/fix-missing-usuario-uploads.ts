#!/usr/bin/env npx tsx

/**
 * scripts/fix-missing-usuario-uploads.ts
 *
 * Finds empleados whose fotoPerfil references files missing from disk and
 * creates a backup JSON then sets fotoPerfil = null for those rows.
 * Run with --apply to actually perform the DB updates; default is dry-run.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const apply = args.includes('--apply');

async function run() {
  try {
    const empleados = await prisma.empleado.findMany({
      where: { fotoPerfil: { contains: '/uploads/usuarios/' } },
      select: { id: true, nombre: true, apellido: true, fotoPerfil: true }
    });

    const affected: any[] = [];

    for (const e of empleados) {
      const raw = e.fotoPerfil as string | null | undefined;
      if (!raw) continue;
      const rel = raw.startsWith('/api/uploads/') ? raw.replace(/^\/api\/uploads\//, '') : raw.startsWith('/uploads/') ? raw.replace(/^\/uploads\//, '') : null;
      const expected = rel ? path.join(process.cwd(), 'public', 'uploads', ...rel.split('/')) : null;
      const exists = expected ? fs.existsSync(expected) : false;
      if (!exists) {
        affected.push({ id: e.id, nombre: e.nombre, apellido: e.apellido, fotoPerfil: raw, expectedPath: expected });
      }
    }

    if (affected.length === 0) {
      console.log('No missing usuario upload files found.');
      return;
    }

    const backupsDir = path.join(process.cwd(), 'scripts', 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const backupPath = path.join(backupsDir, `fix-missing-usuario-uploads-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(affected, null, 2), 'utf-8');
    console.log(`Backup of affected rows written to ${backupPath}`);

    console.log(`Found ${affected.length} empleados with missing fotoPerfil files.`);
    if (!apply) {
      console.log('Dry-run mode. To apply changes run with --apply');
      return;
    }

    for (const a of affected) {
      await prisma.empleado.update({ where: { id: a.id }, data: { fotoPerfil: null } });
      console.log(`Set fotoPerfil=null for empleado ${a.id}`);
    }

    console.log('Applied updates.');

  } catch (error) {
    console.error('Error fixing missing usuario uploads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
