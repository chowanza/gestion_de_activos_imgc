#!/usr/bin/env npx tsx

/**
 * scripts/list-missing-uploads.ts
 *
 * Scans database records that reference uploaded files and reports which files
 * are missing from disk. This is a safe, read-only admin helper.
 *
 * Usage: npx tsx scripts/list-missing-uploads.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizePath(dbPath: string | null | undefined): string | null {
  if (!dbPath) return null;
  // Skip absolute URLs (external)
  if (/^https?:\/\//i.test(dbPath)) return null;

  // Some entries may already be stored as /api/uploads/..., convert to /uploads/ for filesystem path
  let p = dbPath.replace(/^\/api\/uploads\//, '/uploads/');

  // Ensure it starts with /uploads/
  if (!p.startsWith('/uploads/')) return null;

  // Return the filesystem path under public/
  return path.join(process.cwd(), 'public', p.replace(/^\//, ''));
}

async function checkEmpresas(): Promise<Array<any>> {
  const rows = await prisma.empresa.findMany({ select: { id: true, nombre: true, logo: true } });
  const missing: Array<any> = [];

  for (const r of rows) {
    const filePath = normalizePath(r.logo);
    if (!filePath) continue;
    if (!fs.existsSync(filePath)) {
      missing.push({ table: 'empresa', id: r.id, nombre: r.nombre, field: 'logo', dbValue: r.logo, filePath });
    }
  }

  return missing;
}

async function checkModelos(): Promise<Array<any>> {
  // The modelos may store images in different relations. Check modeloEquipo.img and modeloEquipo.img (string) if present
  const rows = await prisma.modeloEquipo.findMany({ select: { id: true, nombre: true, img: true } });
  const missing: Array<any> = [];

  for (const r of rows) {
    const filePath = normalizePath(r.img);
    if (!filePath) continue;
    if (!fs.existsSync(filePath)) {
      missing.push({ table: 'modeloEquipo', id: r.id, nombre: r.nombre, field: 'img', dbValue: r.img, filePath });
    }
  }

  return missing;
}

async function checkComputadores(): Promise<Array<any>> {
  // Some computadores may have host or foto fields; adapt if present. We'll check 'host' only if it looks like an upload path
  const rows = await prisma.computador.findMany({ select: { id: true, codigoImgc: true, host: true } });
  const missing: Array<any> = [];

  for (const r of rows) {
    const filePath = normalizePath(r.host);
    if (!filePath) continue;
    if (!fs.existsSync(filePath)) {
      missing.push({ table: 'computador', id: r.id, codigoImgc: r.codigoImgc, field: 'host', dbValue: r.host, filePath });
    }
  }

  return missing;
}

async function main() {
  console.log('🚀 Starting missing uploads check...\n');

  try {
    const [empresas, modelos, computadores] = await Promise.all([
      checkEmpresas(),
      checkModelos(),
      checkComputadores()
    ]);

    const all = [...empresas, ...modelos, ...computadores];

    if (all.length === 0) {
      console.log('✅ No missing uploaded files detected.');
    } else {
      console.log(`❌ Found ${all.length} missing uploaded file(s):\n`);
      for (const m of all) {
        console.log(`- [${m.table}] id=${m.id} field=${m.field} dbValue=${m.dbValue}`);
        console.log(`  expected file: ${m.filePath}\n`);
      }

      console.log('\nTip: remove or update DB rows that reference these missing files, or re-upload the missing assets.');
    }

  } catch (error) {
    console.error('❌ Error checking uploads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
