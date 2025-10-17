#!/usr/bin/env npx tsx

/**
 * scripts/find-uploads-starts.ts
 *
 * Finds rows where file fields START with '/uploads/' (exact candidates for conversion)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🔎 Searching for values that START with /uploads/');

    const empresas = await prisma.empresa.findMany({ where: { logo: { startsWith: '/uploads/' } }, select: { id: true, nombre: true, logo: true } });
    console.log(`Found ${empresas.length} empresas (startsWith '/uploads/')`);
    for (const e of empresas) console.log(`- empresa id=${e.id} nombre=${e.nombre} -> ${e.logo}`);

    const modelos = await prisma.modeloEquipo.findMany({ where: { img: { startsWith: '/uploads/' } }, select: { id: true, nombre: true, img: true } });
    console.log(`Found ${modelos.length} modeloEquipo (startsWith '/uploads/')`);
    for (const m of modelos) console.log(`- modelo id=${m.id} nombre=${m.nombre} -> ${m.img}`);

    const computs = await prisma.computador.findMany({ where: { host: { startsWith: '/uploads/' } }, select: { id: true, codigoImgc: true, host: true } });
    console.log(`Found ${computs.length} computador rows (startsWith '/uploads/')`);
    for (const c of computs) console.log(`- computador id=${c.id} codigoImgc=${c.codigoImgc} -> ${c.host}`);

    const empleados = await prisma.empleado.findMany({ where: { fotoPerfil: { startsWith: '/uploads/' } }, select: { id: true, nombre: true, apellido: true, fotoPerfil: true } });
    console.log(`Found ${empleados.length} empleados (startsWith '/uploads/')`);
    for (const emp of empleados) console.log(`- empleado id=${emp.id} nombre=${emp.nombre} ${emp.apellido} -> ${emp.fotoPerfil}`);

    const asignaciones = await prisma.asignacionesEquipos.findMany({ where: { evidenciaFotos: { startsWith: '/uploads/' } }, select: { id: true, evidenciaFotos: true } });
    console.log(`Found ${asignaciones.length} asignacionesEquipos (startsWith '/uploads/')`);
    for (const a of asignaciones) console.log(`- asignacion id=${a.id} -> ${a.evidenciaFotos}`);

  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
