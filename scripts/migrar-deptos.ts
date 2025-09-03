// scripts/migrar-departamentos.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Define la estructura de una fila de tu CSV de departamentos
interface DepartamentoCSVRow {
  nombre: string;
  ceco: string;
  sociedad: string;
  gerencia_nombre: string;
}

async function main() {
  console.log('Iniciando migración de departamentos...');

  // --- PASO 1: Cargar Gerencias en memoria para mapeo ---
  console.log('Obteniendo Gerencias de la base de datos...');
  
  const gerencias = await prisma.gerencia.findMany();

  // Crea un mapa de búsqueda: la clave es el nombre de la gerencia y el valor es su ID.
  const gerenciaMap = new Map(gerencias.map(g => [g.nombre.trim(), g.id]));

  console.log(`Se encontraron ${gerenciaMap.size} gerencias.`);
  if (gerenciaMap.size === 0) {
    console.error("No se encontraron gerencias en la base de datos. Asegúrate de que ya estén creadas.");
    return;
  }

  // --- PASO 2: Leer el archivo CSV y procesar cada departamento ---
  const csvFilePath = path.join(__dirname, 'deptos.csv');
  const departamentosParaCrear: any[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({
        separator: ';', // Usa punto y coma como separador
        mapHeaders: ({ header }) => header.trim(),
        mapValues: ({ value }) => value.trim()
      }))
      .on('data', (row: DepartamentoCSVRow) => {
        // Busca el ID de la gerencia usando el nombre que viene del CSV
        const gerenciaId = gerenciaMap.get(row.gerencia_nombre);

        if (!gerenciaId) {
          console.warn(`ADVERTENCIA: No se encontró la gerencia "${row.gerencia_nombre}" para el departamento ${row.nombre}. Se omitirá esta fila.`);
          return;
        }

        // Prepara el objeto de datos del departamento para Prisma
        const departamentoData = {
          nombre: row.nombre,
          ceco: row.ceco,
          sociedad: row.sociedad,
          gerenciaId: gerenciaId, // <-- ID de la gerencia obtenido del mapa
        };
        departamentosParaCrear.push(departamentoData);
      })
      .on('end', () => {
        console.log(`Lectura del CSV completada. Se procesaron ${departamentosParaCrear.length} departamentos.`);
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });

  // --- PASO 3: Insertar los departamentos en la base de datos ---
  if (departamentosParaCrear.length > 0) {
    console.log('Insertando departamentos en la base de datos...');
    
    // Usamos `createMany` para una inserción masiva y eficiente
    const result = await prisma.departamento.createMany({
      data: departamentosParaCrear,
      skipDuplicates: true, // Si un departamento con un campo unique ya existe, lo omite
    });

    console.log(`¡Migración completada! Se crearon ${result.count} nuevos departamentos.`);
  } else {
    console.log('No hay departamentos nuevos para insertar.');
  }
}

main()
  .catch((e) => {
    console.error('Ocurrió un error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Cierra la conexión de Prisma
    await prisma.$disconnect();
  });