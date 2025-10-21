#!/usr/bin/env npx tsx

/**
 * scripts/check-usuario-uploads.ts
 *
 * Scans the database for empleados with fotoPerfil pointing to /api/uploads/usuarios/
 * or /uploads/usuarios/ and checks whether the referenced file exists under
 * public/uploads/usuarios/. Produces a JSON report in scripts/backups/.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  try {
    const empleados = await prisma.empleado.findMany({
      where: {
        fotoPerfil: {
          contains: '/uploads/usuarios/'
        }
      },
      select: { id: true, nombre: true, apellido: true, fotoPerfil: true }
    });

    console.log(`Found ${empleados.length} empleados referencing /uploads/usuarios/`);

    const report: any[] = [];

    for (const e of empleados) {
      const raw = e.fotoPerfil as string | null | undefined;
      if (!raw) continue;
      // Normalize to path under public/uploads
      const rel = raw.startsWith('/api/uploads/') ? raw.replace(/^\/api\/uploads\//, '') : raw.startsWith('/uploads/') ? raw.replace(/^\/uploads\//, '') : null;
      const expected: string | null = rel ? path.join(process.cwd(), 'public', 'uploads', ...rel.split('/')) : null;
      const exists = expected ? fs.existsSync(expected) : false;
      if (!exists) {
        console.warn(`Missing file for empleado ${e.id} -> ${raw} -> ${expected}`);
      }
      report.push({ id: e.id, nombre: e.nombre, apellido: e.apellido, fotoPerfil: raw, expectedPath: expected, exists });
    }

    // Ensure backups dir
    const backupsDir = path.join(process.cwd(), 'scripts', 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

    const outPath = path.join(backupsDir, `usuario-uploads-report-${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Report written to ${outPath}`);

    if (report.filter(r => !r.exists).length === 0) {
      console.log('All referenced usuario upload files exist on disk.');
    } else {
      console.log(`Missing ${report.filter(r => !r.exists).length} files.`);
    }

  } catch (error) {
    console.error('Error checking usuario uploads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
