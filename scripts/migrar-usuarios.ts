// scripts/migrar-usuarios.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializa el cliente de Prisma
const prisma = new PrismaClient();

// Define la estructura de una fila de tu CSV
interface UserCSVRow {
    legajo:              number;  // o number si parseas luego
  ced:                 string;
  nombre:              string;
  apellido:            string;
  cargo:               string;
  departamento_nombre: string;
}

async function main() {
  console.log('Iniciando migración de usuarios...');

  // --- PASO 1: Cargar Gerencias y departamentos en memoria para mapeo ---
  console.log('Obteniendo Gerencias y departamentos de la base de datos...');
  
  const departamentos = await prisma.departamento.findMany();

  // Crea mapas de búsqueda para un acceso rápido.
  // La clave es el nombre (como está en el CSV) y el valor es el ID de la base de datos.
  const departamentoMap = new Map(departamentos.map(j => [j.nombre, j.id]));

  console.log(`Se encontraron ${departamentoMap.size} departamentos.`);

  // --- PASO 2: Leer el archivo CSV y procesar cada usuario ---
  const csvFilePath = path.join(__dirname, 'usuarios.csv');
  const usuariosParaCrear: any[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({
        separator: ';',       // <- Aquí le indicas que use punto y coma
        mapHeaders: ({ header }) => header.trim(), 
        mapValues:  ({ value })   => value.trim()
      }))
      .on('data', (row: UserCSVRow) => {
        console.log(Object.keys(row), row);

        const departamentoId = departamentoMap.get(row.departamento_nombre);

        if (!departamentoId) {
          console.warn(`ADVERTENCIA: No se encontró la departamento "${row.departamento_nombre}" para el usuario ${row.legajo}. Se omitirá este usuario.`);
          return;
        }
        const legajoNum = Number(row.legajo);
        if (Number.isNaN(legajoNum)) {
            console.warn(`Legajo inválido (“${row.legajo}”), omitiendo fila.`);
            return;
        }

        // Prepara el objeto de datos del usuario para Prisma
        const userData = {
            legajo: legajoNum,
            ced: row.ced,
          nombre: row.nombre,
          apellido: row.apellido,
          cargo: row.cargo, 
          departamentoId: departamentoId, // <-- ID obtenido del mapa
        };
        usuariosParaCrear.push(userData);
      })
      .on('end', () => {
        console.log(`Lectura del CSV completada. Se procesaron ${usuariosParaCrear.length} usuarios.`);
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });

  // --- PASO 3: Insertar los usuarios en la base de datos ---
  if (usuariosParaCrear.length > 0) {
    console.log('Insertando usuarios en la base de datos...');
    
    // Usamos `createMany` para una inserción masiva y más eficiente
    const result = await prisma.usuario.createMany({
      data: usuariosParaCrear,
      skipDuplicates: true, // Si un email ya existe, simplemente lo omite
    });

    console.log(`¡Migración completada! Se crearon ${result.count} nuevos usuarios.`);
  } else {
    console.log('No hay usuarios nuevos para insertar.');
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