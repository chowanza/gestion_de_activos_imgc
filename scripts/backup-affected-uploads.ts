import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Write a JSON backup of rows that contain '/uploads/' in the relevant fields.
 */
async function main() {
  console.log('� Backing up rows that reference "/uploads/"');

  try {
    const empresas = await prisma.empresa.findMany({ where: { logo: { contains: '/uploads/' } } });
    const modelos = await prisma.modeloEquipo.findMany({ where: { img: { contains: '/uploads/' } } });
    const computs = await prisma.computador.findMany({ where: { host: { contains: '/uploads/' } } });
    const empleados = await prisma.empleado.findMany({ where: { fotoPerfil: { contains: '/uploads/' } } });
    const asignaciones = await prisma.asignacionesEquipos.findMany({ where: { evidenciaFotos: { contains: '/uploads/' } } });

    const out = { empresas, modelos, computs, empleados, asignaciones };

    const backupDir = path.join(process.cwd(), 'scripts', 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const outPath = path.join(backupDir, `affected-uploads-backup-${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');

    console.log(`✅ Backup written to ${outPath}`);
    console.log(`  empresas: ${empresas.length}`);
    console.log(`  modelos: ${modelos.length}`);
    console.log(`  computadores: ${computs.length}`);
    console.log(`  empleados: ${empleados.length}`);
    console.log(`  asignaciones: ${asignaciones.length}`);

    return outPath;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute immediately when run with node/tsx
main().catch(() => process.exit(1));
