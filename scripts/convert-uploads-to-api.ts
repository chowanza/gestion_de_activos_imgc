#!/usr/bin/env npx tsx

/**
 * scripts/convert-uploads-to-api.ts
 *
 * Finds DB rows that reference paths starting with '/uploads/' and reports a
 * dry-run list of updates to convert them to '/api/uploads/'. Use `--apply`
 * to perform the updates. This script is safe by default (dry-run).
 *
 * Usage examples:
 *   npx tsx scripts/convert-uploads-to-api.ts        # dry-run
 *   npx tsx scripts/convert-uploads-to-api.ts --apply
 */

import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const apply = args.includes('--apply');

function shouldConvert(val: string | null | undefined) {
  if (!val) return false;
  if (/^https?:\/\//i.test(val)) return false;
  return val.startsWith('/uploads/');
}

function convert(val: string) {
  return val.replace(/^\/uploads\//, '/api/uploads/');
}

async function run() {
  console.log(apply ? '⚠️  Running migration (APPLY MODE)' : '🔎 Dry-run: no changes will be made');

  try {
    // Empresas
    const empresas = await prisma.empresa.findMany({ where: { logo: { contains: '/uploads/' } }, select: { id: true, logo: true, nombre: true } });
    console.log(`\nFound ${empresas.length} empresas with /uploads/ references`);
    for (const e of empresas) {
      const newVal = convert(e.logo as string);
      console.log(`- empresa id=${e.id} nombre=${e.nombre}\n  ${e.logo} -> ${newVal}`);
      if (apply) {
        await prisma.empresa.update({ where: { id: e.id }, data: { logo: newVal } });
      }
    }

    // Modelos
    const modelos = await prisma.modeloEquipo.findMany({ where: { img: { contains: '/uploads/' } }, select: { id: true, nombre: true, img: true } });
    console.log(`\nFound ${modelos.length} modeloEquipo with /uploads/ references`);
    for (const m of modelos) {
      const newVal = convert(m.img as string);
      console.log(`- modelo id=${m.id} nombre=${m.nombre}\n  ${m.img} -> ${newVal}`);
      if (apply) {
        await prisma.modeloEquipo.update({ where: { id: m.id }, data: { img: newVal } });
      }
    }

    // Computadores (host field) - optional
    const computs = await prisma.computador.findMany({ where: { host: { contains: '/uploads/' } }, select: { id: true, codigoImgc: true, host: true } });
    console.log(`\nFound ${computs.length} computador rows with /uploads/ references`);
    for (const c of computs) {
      const newVal = convert(c.host as string);
      console.log(`- computador id=${c.id} codigoImgc=${c.codigoImgc}\n  ${c.host} -> ${newVal}`);
      if (apply) {
        await prisma.computador.update({ where: { id: c.id }, data: { host: newVal } });
      }
    }

    // Empleados: fotoPerfil
    const empleados = await prisma.empleado.findMany({ where: { fotoPerfil: { contains: '/uploads/' } }, select: { id: true, nombre: true, apellido: true, fotoPerfil: true } });
    console.log(`\nFound ${empleados.length} empleados with /uploads/ references`);
    for (const emp of empleados) {
      const newVal = convert(emp.fotoPerfil as string);
      console.log(`- empleado id=${emp.id} nombre=${emp.nombre} ${emp.apellido}\n  ${emp.fotoPerfil} -> ${newVal}`);
      if (apply) {
        await prisma.empleado.update({ where: { id: emp.id }, data: { fotoPerfil: newVal } });
      }
    }

    // AsignacionesEquipos: evidenciaFotos is a CSV of URLs, convert each /uploads/ occurrence
    const asignaciones = await prisma.asignacionesEquipos.findMany({ where: { evidenciaFotos: { contains: '/uploads/' } }, select: { id: true, evidenciaFotos: true } });
    console.log(`\nFound ${asignaciones.length} asignacionesEquipos with /uploads/ in evidenciaFotos`);
    for (const a of asignaciones) {
      const original = a.evidenciaFotos as string;
      const parts = original.split(',').map((p: string) => p.trim()).map((p: string) => p.startsWith('/uploads/') ? convert(p) : p);
      const newVal = parts.join(',');
      console.log(`- asignacion id=${a.id}\n  ${original} -> ${newVal}`);
      if (apply) {
        await prisma.asignacionesEquipos.update({ where: { id: a.id }, data: { evidenciaFotos: newVal } });
      }
    }

    if (!apply) {
      console.log('\n✅ Dry-run complete. To apply these changes run with --apply');
    } else {
      console.log('\n✅ Migration applied.');
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
