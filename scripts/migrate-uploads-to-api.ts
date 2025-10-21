#!/usr/bin/env tsx
/**
 * Script: migrate-uploads-to-api.ts
 * Purpose: Update DB records that reference /uploads/... to use /api/uploads/... so
 * the app uses the streaming API and newly uploaded files are available immediately.
 */
import { prisma } from '../src/lib/prisma';

async function run() {
  console.log('Starting migration: replace /uploads/ with /api/uploads/ in DB...');

  try {
    // Empresas: logo
    const empresas = await prisma.empresa.findMany({ where: { logo: { contains: '/uploads/' } } });
    console.log(`Found ${empresas.length} empresas to update`);

    for (const e of empresas) {
      const newLogo = e.logo ? e.logo.replace('/uploads/', '/api/uploads/') : e.logo;
      await prisma.empresa.update({ where: { id: e.id }, data: { logo: newLogo } });
      console.log(`Updated empresa ${e.id} -> ${newLogo}`);
    }

    // Modelos: img
    const modelos = await prisma.modeloEquipo.findMany({ where: { img: { contains: '/uploads/' } } });
    console.log(`Found ${modelos.length} modelos to update`);

    for (const m of modelos) {
      const newImg = m.img ? m.img.replace('/uploads/', '/api/uploads/') : m.img;
      await prisma.modeloEquipo.update({ where: { id: m.id }, data: { img: newImg } });
      console.log(`Updated modelo ${m.id} -> ${newImg}`);
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
