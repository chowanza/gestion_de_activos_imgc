import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

interface EmpleadoData {
  Nombre: string;
  Apellido: string;
  Email?: string;
  Empresa: string;
  Departamento: string;
  Cargo?: string;
  Cedula?: string;
  'Fecha de Nacimiento'?: string;
  'Fecha de Ingreso'?: string;
}

async function importFromJSON(filePath: string): Promise<EmpleadoData[]> {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    throw error;
  }
}

async function importFromCSV(filePath: string): Promise<EmpleadoData[]> {
  return new Promise((resolve, reject) => {
    const results: EmpleadoData[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

async function findOrCreateEmpresa(nombre: string) {
  let empresa = await prisma.empresa.findFirst({
    where: { nombre: { contains: nombre } }
  });

  if (!empresa) {
    console.log(`Creando nueva empresa: ${nombre}`);
    empresa = await prisma.empresa.create({
      data: {
        nombre: nombre,
        logo: null
      }
    });
  }

  return empresa;
}

async function findOrCreateDepartamento(nombre: string, empresaId: string) {
  let departamento = await prisma.departamento.findFirst({
    where: { 
      nombre: { contains: nombre },
      empresaId: empresaId
    }
  });

  if (!departamento) {
    console.log(`Creando nuevo departamento: ${nombre} en empresa ${empresaId}`);
    departamento = await prisma.departamento.create({
      data: {
        nombre: nombre,
        empresaId: empresaId
      }
    });
  }

  return departamento;
}

async function findOrCreateCargo(nombre: string, departamentoId: string) {
  if (!nombre || nombre.trim() === '') {
    return null;
  }

  let cargo = await prisma.cargo.findFirst({
    where: { 
      nombre: { contains: nombre },
      departamentoId: departamentoId
    }
  });

  if (!cargo) {
    console.log(`Creando nuevo cargo: ${nombre} en departamento ${departamentoId}`);
    cargo = await prisma.cargo.create({
      data: {
        nombre: nombre,
        descripcion: `Cargo importado: ${nombre}`,
        departamentoId: departamentoId
      }
    });
  }

  return cargo;
}

function formatDate(dateString: string | undefined): string | null {
  if (!dateString || dateString.trim() === '') {
    return null;
  }

  // Si la fecha viene en formato dd/mm/yyyy, convertirla a yyyy-mm-dd
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Si ya está en formato yyyy-mm-dd, devolverla tal como está
  if (dateString.includes('-')) {
    return dateString;
  }

  return null;
}

async function importEmpleados() {
  try {
    console.log('🚀 Iniciando importación de empleados...\n');

    // Leer datos desde JSON (preferimos JSON por ser más confiable)
    const jsonPath = path.join(process.cwd(), 'public', 'Empleados_IMGC_Filtrados_20250915_1153.json');
    const csvPath = path.join(process.cwd(), 'public', 'Empleados_IMGC_Filtrados_20250915_1153.csv');

    let empleadosData: EmpleadoData[] = [];

    // Intentar cargar desde JSON primero
    if (fs.existsSync(jsonPath)) {
      console.log('📄 Cargando datos desde JSON...');
      empleadosData = await importFromJSON(jsonPath);
    } else if (fs.existsSync(csvPath)) {
      console.log('📄 Cargando datos desde CSV...');
      empleadosData = await importFromCSV(csvPath);
    } else {
      throw new Error('No se encontraron archivos de datos (JSON o CSV)');
    }

    console.log(`📊 Total de empleados a importar: ${empleadosData.length}\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const [index, empleadoData] of empleadosData.entries()) {
      try {
        console.log(`Procesando empleado ${index + 1}/${empleadosData.length}: ${empleadoData.Nombre} ${empleadoData.Apellido}`);

        // Buscar o crear empresa
        const empresa = await findOrCreateEmpresa(empleadoData.Empresa);

        // Buscar o crear departamento
        const departamento = await findOrCreateDepartamento(empleadoData.Departamento, empresa.id);

        // Buscar o crear cargo
        const cargo = await findOrCreateCargo(empleadoData.Cargo || 'Sin cargo', departamento.id);
        if (!cargo) {
          console.log(`⚠️  No se pudo crear el cargo para ${empleadoData.Nombre} ${empleadoData.Apellido}`);
          continue;
        }

        // Verificar si el empleado ya existe (por email o nombre completo)
        const existingEmpleado = await prisma.empleado.findFirst({
          where: {
            OR: [
              { email: empleadoData.Email },
              {
                AND: [
                  { nombre: { contains: empleadoData.Nombre } },
                  { apellido: { contains: empleadoData.Apellido } }
                ]
              }
            ]
          }
        });

        if (existingEmpleado) {
          console.log(`  ⚠️  Empleado ya existe, saltando...`);
          continue;
        }

        // Crear empleado
        const newEmpleado = await prisma.empleado.create({
          data: {
            nombre: empleadoData.Nombre.trim(),
            apellido: empleadoData.Apellido.trim(),
            email: empleadoData.Email?.trim() || null,
            ced: empleadoData.Cedula?.trim() || '',
            cargoId: cargo.id,
            departamentoId: departamento.id,
            fechaNacimiento: formatDate(empleadoData['Fecha de Nacimiento']),
            fechaIngreso: formatDate(empleadoData['Fecha de Ingreso']),
            fotoPerfil: null
          }
        });

        console.log(`  ✅ Empleado creado: ${newEmpleado.nombre} ${newEmpleado.apellido}`);
        successCount++;

      } catch (error) {
        console.error(`  ❌ Error procesando empleado ${empleadoData.Nombre} ${empleadoData.Apellido}:`, error);
        errors.push(`${empleadoData.Nombre} ${empleadoData.Apellido}: ${error}`);
        errorCount++;
      }
    }

    console.log('\n📈 Resumen de importación:');
    console.log(`✅ Empleados importados exitosamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n🔍 Detalles de errores:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n🎉 Importación completada!');

  } catch (error) {
    console.error('💥 Error durante la importación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la importación
importEmpleados();
