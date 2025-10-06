#!/usr/bin/env npx tsx

/**
 * Script para generar 100 equipos de ejemplo usando el catálogo existente
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Datos de ejemplo para expandir el catálogo
const computerModels = [
  // Dell
  { marca: 'Dell', modelo: 'OptiPlex 7090', tipo: 'computador' },
  { marca: 'Dell', modelo: 'Latitude 5520', tipo: 'computador' },
  { marca: 'Dell', modelo: 'Inspiron 15 3000', tipo: 'computador' },
  { marca: 'Dell', modelo: 'Precision 3650', tipo: 'computador' },
  { marca: 'Dell', modelo: 'XPS 13', tipo: 'computador' },
  
  // HP
  { marca: 'HP', modelo: 'EliteBook 840', tipo: 'computador' },
  { marca: 'HP', modelo: 'ProBook 450', tipo: 'computador' },
  { marca: 'HP', modelo: 'Pavilion 15', tipo: 'computador' },
  { marca: 'HP', modelo: 'EliteDesk 800', tipo: 'computador' },
  { marca: 'HP', modelo: 'ZBook Studio', tipo: 'computador' },
  
  // Lenovo
  { marca: 'Lenovo', modelo: 'ThinkPad E15', tipo: 'computador' },
  { marca: 'Lenovo', modelo: 'ThinkPad T490', tipo: 'computador' },
  { marca: 'Lenovo', modelo: 'ThinkCentre M920', tipo: 'computador' },
  { marca: 'Lenovo', modelo: 'IdeaPad 3', tipo: 'computador' },
  { marca: 'Lenovo', modelo: 'ThinkPad X1 Carbon', tipo: 'computador' },
  
  // ASUS
  { marca: 'ASUS', modelo: 'VivoBook S15', tipo: 'computador' },
  { marca: 'ASUS', modelo: 'ROG Strix G15', tipo: 'computador' },
  { marca: 'ASUS', modelo: 'ZenBook 14', tipo: 'computador' },
  
  // Acer
  { marca: 'Acer', modelo: 'Aspire 5', tipo: 'computador' },
  { marca: 'Acer', modelo: 'Swift 3', tipo: 'computador' },
  { marca: 'Acer', modelo: 'Nitro 5', tipo: 'computador' },
];

const deviceModels = [
  // Cisco
  { marca: 'Cisco', modelo: 'Catalyst 2960', tipo: 'dispositivo' },
  { marca: 'Cisco', modelo: 'Catalyst 3850', tipo: 'dispositivo' },
  { marca: 'Cisco', modelo: 'ASR 1001-X', tipo: 'dispositivo' },
  { marca: 'Cisco', modelo: 'Meraki MR46', tipo: 'dispositivo' },
  
  // TP-Link
  { marca: 'TP-Link', modelo: 'Archer C7', tipo: 'dispositivo' },
  { marca: 'TP-Link', modelo: 'Archer AX73', tipo: 'dispositivo' },
  { marca: 'TP-Link', modelo: 'TL-SG1024', tipo: 'dispositivo' },
  { marca: 'TP-Link', modelo: 'Omada EAP660', tipo: 'dispositivo' },
  
  // Ubiquiti
  { marca: 'Ubiquiti', modelo: 'UniFi Dream Machine', tipo: 'dispositivo' },
  { marca: 'Ubiquiti', modelo: 'UniFi Switch 24', tipo: 'dispositivo' },
  { marca: 'Ubiquiti', modelo: 'UniFi AP AC Pro', tipo: 'dispositivo' },
  
  // HP Networking
  { marca: 'HP', modelo: 'ProCurve 2920', tipo: 'dispositivo' },
  { marca: 'HP', modelo: 'Aruba 6300M', tipo: 'dispositivo' },
  
  // Netgear
  { marca: 'Netgear', modelo: 'ProSAFE GS724T', tipo: 'dispositivo' },
  { marca: 'Netgear', modelo: 'Nighthawk AX8', tipo: 'dispositivo' },
];

const estados = ['OPERATIVO', 'ASIGNADO', 'EN_MANTENIMIENTO', 'EN_RESGUARDO', 'DE_BAJA'];

const sistemasOperativos = ['Windows 11 Pro', 'Windows 10 Pro', 'Windows 10 Home', 'Ubuntu 22.04 LTS', 'macOS Monterey'];
const arquitecturas = ['x64', 'ARM64'];
const procesadores = ['Intel Core i5-11400', 'Intel Core i7-11700K', 'AMD Ryzen 5 5600X', 'AMD Ryzen 7 5800X', 'Intel Core i3-10100'];
const memorias = ['8GB DDR4', '16GB DDR4', '32GB DDR4', '8GB DDR5', '16GB DDR5'];
const almacenamientos = ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD', '1TB HDD + 256GB SSD'];
const proveedores = ['Tecnología Total', 'Computación Integral', 'Sistemas Avanzados', 'Equipos Corporativos', 'Soluciones IT'];

async function createCatalogIfNeeded() {
  console.log('🔧 Creando catálogo expandido...');
  
  // Crear marcas si no existen
  const allModels = [...computerModels, ...deviceModels];
  const marcasUnicas = [...new Set(allModels.map(m => m.marca))];
  
  for (const nombreMarca of marcasUnicas) {
    await prisma.marca.upsert({
      where: { nombre: nombreMarca },
      update: {},
      create: { nombre: nombreMarca }
    });
  }
  
  // Crear modelos de equipos
  for (const modelData of allModels) {
    const marca = await prisma.marca.findUnique({ where: { nombre: modelData.marca } });
    if (!marca) continue;
    
    const modeloEquipo = await prisma.modeloEquipo.upsert({
      where: { id: `${marca.id}-${modelData.modelo}` },
      update: {},
      create: {
        id: `${marca.id}-${modelData.modelo}`,
        nombre: modelData.modelo,
        tipo: modelData.tipo
      }
    });
    
    // Crear relación marca-modelo
    await prisma.marcaModeloEquipo.upsert({
      where: {
        marcaId_modeloEquipoId: {
          marcaId: marca.id,
          modeloEquipoId: modeloEquipo.id
        }
      },
      update: {},
      create: {
        marcaId: marca.id,
        modeloEquipoId: modeloEquipo.id
      }
    });
  }
  
  console.log('✅ Catálogo expandido creado');
}

function generateSerial(prefix: string, index: number): string {
  const paddedIndex = index.toString().padStart(6, '0');
  return `${prefix}${paddedIndex}`;
}

function generateCodigoImgc(index: number): string {
  const paddedIndex = index.toString().padStart(4, '0');
  return `IMG-${paddedIndex}`;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function createComputadores(count: number) {
  console.log(`💻 Creando ${count} computadores...`);
  
  const computadorModelos = await prisma.modeloEquipo.findMany({
    where: { tipo: 'computador' },
    include: {
      marcaModelos: {
        include: {
          marca: true
        }
      }
    }
  });
  
  if (computadorModelos.length === 0) {
    console.log('❌ No hay modelos de computadores en el catálogo');
    return;
  }
  
  for (let i = 1; i <= count; i++) {
    const modelo = getRandomElement(computadorModelos);
    const marca = modelo.marcaModelos[0]?.marca;
    
    if (!marca) continue;
    
    const computador = await prisma.computador.create({
      data: {
        serial: generateSerial('PC', i),
        estado: getRandomElement(estados),
        codigoImgc: generateCodigoImgc(i),
        host: `host-${i}`,
        fechaCompra: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        numeroFactura: `FACT-${generateSerial('', i)}`,
        proveedor: getRandomElement(proveedores),
        monto: Math.floor(Math.random() * 5000) + 800,
        sisOperativo: getRandomElement(sistemasOperativos),
        arquitectura: getRandomElement(arquitecturas),
        procesador: getRandomElement(procesadores),
        ram: getRandomElement(memorias),
        almacenamiento: getRandomElement(almacenamientos),
        macWifi: `00:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
        macEthernet: `00:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
        officeVersion: Math.random() > 0.3 ? 'Microsoft Office 2021' : null,
        anydesk: Math.random() > 0.7 ? `AD-${Math.floor(Math.random() * 100000000)}` : null,
      }
    });
    
    // Crear relación computador-modelo
    await prisma.computadorModeloEquipo.create({
      data: {
        computadorId: computador.id,
        modeloEquipoId: modelo.id
      }
    });
    
    if (i % 10 === 0) {
      console.log(`  ✅ ${i}/${count} computadores creados`);
    }
  }
  
  console.log(`✅ ${count} computadores creados exitosamente`);
}

async function createDispositivos(count: number) {
  console.log(`📱 Creando ${count} dispositivos...`);
  
  const dispositivoModelos = await prisma.modeloEquipo.findMany({
    where: { tipo: 'dispositivo' },
    include: {
      marcaModelos: {
        include: {
          marca: true
        }
      }
    }
  });
  
  if (dispositivoModelos.length === 0) {
    console.log('❌ No hay modelos de dispositivos en el catálogo');
    return;
  }
  
  for (let i = 1; i <= count; i++) {
    const modelo = getRandomElement(dispositivoModelos);
    const marca = modelo.marcaModelos[0]?.marca;
    
    if (!marca) continue;
    
    const dispositivo = await prisma.dispositivo.create({
      data: {
        serial: generateSerial('DEV', i),
        estado: getRandomElement(estados),
        mac: `00:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
        codigoImgc: generateCodigoImgc(i + 100), // Para evitar conflictos con computadores
        fechaCompra: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        numeroFactura: `FACT-${generateSerial('', i + 100)}`,
        proveedor: getRandomElement(proveedores),
        monto: Math.floor(Math.random() * 3000) + 200,
      }
    });
    
    // Crear relación dispositivo-modelo
    await prisma.dispositivoModeloEquipo.create({
      data: {
        dispositivoId: dispositivo.id,
        modeloEquipoId: modelo.id
      }
    });
    
    if (i % 10 === 0) {
      console.log(`  ✅ ${i}/${count} dispositivos creados`);
    }
  }
  
  console.log(`✅ ${count} dispositivos creados exitosamente`);
}

async function generateSampleEquipment() {
  console.log('🚀 Generando 100 equipos de ejemplo...\n');
  
  try {
    // Crear catálogo expandido
    await createCatalogIfNeeded();
    
    // Generar 60 computadores y 40 dispositivos (100 total)
    await createComputadores(60);
    await createDispositivos(40);
    
    // Verificar resultados
    const totalComputadores = await prisma.computador.count();
    const totalDispositivos = await prisma.dispositivo.count();
    const totalEquipos = totalComputadores + totalDispositivos;
    
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Total computadores: ${totalComputadores}`);
    console.log(`✅ Total dispositivos: ${totalDispositivos}`);
    console.log(`✅ Total equipos: ${totalEquipos}`);
    
    // Mostrar distribución por estado
    const estadosComputadores = await prisma.computador.groupBy({
      by: ['estado'],
      _count: { estado: true }
    });
    
    const estadosDispositivos = await prisma.dispositivo.groupBy({
      by: ['estado'],
      _count: { estado: true }
    });
    
    console.log('\n📈 DISTRIBUCIÓN POR ESTADO:');
    console.log('Computadores:');
    estadosComputadores.forEach(estado => {
      console.log(`  - ${estado.estado}: ${estado._count.estado}`);
    });
    
    console.log('Dispositivos:');
    estadosDispositivos.forEach(estado => {
      console.log(`  - ${estado.estado}: ${estado._count.estado}`);
    });
    
    console.log('\n🎉 Generación de equipos de ejemplo completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error generando equipos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar generación
generateSampleEquipment();

