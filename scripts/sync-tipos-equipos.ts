#!/usr/bin/env npx tsx
/**
 * Sincroniza tipos de equipos base (computadoras y dispositivos) con la tabla TipoEquipo.
 * No elimina tipos existentes, solo inserta los que faltan.
 */
import prisma from '../src/lib/prisma';

const TIPOS_COMPUTADORAS = [
  'Laptop','Desktop','Servidor','Workstation','All-in-One'
];

const TIPOS_DISPOSITIVOS = [
  'Impresora','Cámara','Tablet','Smartphone','Monitor','Teclado','Mouse','Router','Switch','Proyector','Escáner','Altavoces','Micrófono','Webcam','DVR'
];

async function run() {
  console.log('🔄 Sincronizando tipos de equipos...');
  try {
    const existentes = await prisma.tipoEquipo.findMany();
    const toCreate: Array<{ nombre: string; categoria: string }> = [];

    for (const nombre of TIPOS_COMPUTADORAS) {
      if (!existentes.find(t => t.nombre.toLowerCase() === nombre.toLowerCase() && t.categoria === 'COMPUTADORA')) {
        toCreate.push({ nombre, categoria: 'COMPUTADORA' });
      }
    }
    for (const nombre of TIPOS_DISPOSITIVOS) {
      if (!existentes.find(t => t.nombre.toLowerCase() === nombre.toLowerCase() && t.categoria === 'DISPOSITIVO')) {
        toCreate.push({ nombre, categoria: 'DISPOSITIVO' });
      }
    }

    if (toCreate.length === 0) {
      console.log('✅ No hay tipos nuevos para insertar.');
    } else {
      for (const item of toCreate) {
        await prisma.tipoEquipo.create({ data: item });
        console.log(`✅ Insertado: ${item.categoria}/${item.nombre}`);
      }
    }

    console.log('📊 Resumen final:');
    const total = await prisma.tipoEquipo.count();
    console.log(`   Total tipos en BD: ${total}`);
  } catch (error) {
    console.error('❌ Error sincronizando tipos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
