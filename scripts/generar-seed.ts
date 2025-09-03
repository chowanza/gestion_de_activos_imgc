// scripts/generar-seed.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // <-- AÑADE ESTA LÍNEA

// Obtiene la ruta del directorio actual en un entorno ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando la generación del script de siembra a partir de la base de datos actual...');

  // 1. Leer los datos de todas las tablas que quieres respaldar
  console.log('Leyendo datos de Gerencias, Departamentos y Usuarios...');
  const gerencias = await prisma.gerencia.findMany();
  const users = await prisma.user.findMany();
  const departamentos = await prisma.departamento.findMany();
  const usuarios = await prisma.usuario.findMany();
  const dispositivos = await prisma.dispositivo.findMany();
  const computadores = await prisma.computador.findMany();
  const asignaciones = await prisma.asignaciones.findMany();
  const modelos = await prisma.modeloDispositivo.findMany();

  // 2. Crear el contenido del archivo de siembra como un string
  // Usamos JSON.stringify para convertir los arrays de objetos en texto con formato
  const seedFileContent = `
// Este archivo fue generado automáticamente por el script 'generar-seed.ts'
// Contiene una instantánea de los datos de la base de datos en el momento de su creación.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando la siembra de datos desde la instantánea...');

  // Usamos una transacción para asegurar que todas las operaciones se completen o ninguna lo haga.
  await prisma.$transaction(async (tx) => {

    // Insertar Gerencias
    // NOTA: No podemos usar createMany porque no maneja bien las relaciones anidadas.
    // Además, para la restauración, es mejor ir tabla por tabla.
    await tx.gerencia.createMany({
      data: ${JSON.stringify(gerencias, null, 2)},
      skipDuplicates: true,
    });
    console.log('${gerencias.length} gerencias procesadas.');

    // Insertar Departamentos
    await tx.departamento.createMany({
      data: ${JSON.stringify(departamentos, null, 2)},
      skipDuplicates: true,
    });
    console.log('${departamentos.length} departamentos procesados.');

    // Insertar Usuarios
    await tx.user.createMany({
      data: ${JSON.stringify(usuarios, null, 2)},
      skipDuplicates: true,
    });
    console.log('${usuarios.length} usuarios procesados.');

    // Agrega aquí los createMany para otros modelos
    /*
    await tx.dispositivo.createMany({
      data: ${JSON.stringify(dispositivos, null, 2)},
      skipDuplicates: true,
    });
    await tx.users.createMany({
      data: ${JSON.stringify(users, null, 2)},
      skipDuplicates: true,
    });
        await tx.modelos.createMany({
      data: ${JSON.stringify(modelos, null, 2)},
      skipDuplicates: true,
    });
        await tx.computadores.createMany({
      data: ${JSON.stringify(computadores, null, 2)},
      skipDuplicates: true,
    });
    await tx.asignaciones.createMany({
      data: ${JSON.stringify(asignaciones, null, 2)},
      skipDuplicates: true,
    });
    console.log('${users.length} dispositivos procesados.');
    */
  });

  console.log('Siembra desde la instantánea completada.');
}

main()
  .catch((e) => {
    console.error('Ocurrió un error durante la siembra desde la instantánea:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

  // 3. Escribir el contenido en un nuevo archivo
  const outputPath = path.join(__dirname, '../prisma/seed-snapshot.ts');
  fs.writeFileSync(outputPath, seedFileContent.trim());

  console.log(`\n¡Éxito! ✅`);
  console.log(`El archivo de siembra ha sido generado en: ${outputPath}`);
  console.log(`Ahora puedes usar este archivo para restaurar tus datos.`);
}

main()
  .catch((e) => {
    console.error('Ocurrió un error generando el script de siembra:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });