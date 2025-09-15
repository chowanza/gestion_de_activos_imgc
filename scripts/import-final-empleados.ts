import { PrismaClient } from '@prisma/client';

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

  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  if (dateString.includes('-')) {
    return dateString;
  }

  return null;
}

async function importFinalEmpleados() {
  try {
    console.log('🚀 Importando empleados faltantes...\n');

    // Empleados específicos que faltan
    const missingEmpleados: EmpleadoData[] = [
      {
        Nombre: "Documentos",
        Apellido: "Marketing",
        Email: "Documentos.marketing@imgc.us",
        Empresa: "IMGC Internacional",
        Departamento: "Marketing",
        Cargo: "Archivista"
      },
      {
        Nombre: "Documentos",
        Apellido: "Group",
        Email: "DocumentosGroup@imgc.us",
        Empresa: "IMGC Group",
        Departamento: "Administración",
        Cargo: "Documentador"
      },
      {
        Nombre: "Documentos",
        Apellido: "SAO",
        Email: "Documentos.sao@imgc.us",
        Empresa: "Servicios Ambientales Orinoco (SAO)",
        Departamento: "Servicios Ambientales",
        Cargo: "Archivista"
      },
      {
        Nombre: "Documentos",
        Apellido: "SHL",
        Email: "documentos.shl@imgc.us",
        Empresa: "IMGC IRON",
        Departamento: "Administración",
        Cargo: "Archivista"
      },
      {
        Nombre: "Documentos",
        Apellido: "Puerto Orinoco",
        Email: "documentos.puerto.orinoco@imgc.us",
        Empresa: "Puerto Orinoco Catamarán",
        Departamento: "Operaciones",
        Cargo: "Documentador"
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const [index, empleadoData] of missingEmpleados.entries()) {
      try {
        console.log(`Procesando empleado ${index + 1}/${missingEmpleados.length}: ${empleadoData.Nombre} ${empleadoData.Apellido}`);

        // Buscar o crear empresa
        const empresa = await findOrCreateEmpresa(empleadoData.Empresa);

        // Buscar o crear departamento
        const departamento = await findOrCreateDepartamento(empleadoData.Departamento, empresa.id);

        // Buscar o crear cargo
        const cargo = await findOrCreateCargo(empleadoData.Cargo, departamento.id);

        // Verificar si el empleado ya existe
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
            cargoId: cargo?.id || null,
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
        errorCount++;
      }
    }

    console.log('\n📈 Resumen de importación:');
    console.log(`✅ Empleados importados exitosamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);

    // Verificar total final
    const totalEmpleados = await prisma.empleado.count();
    console.log(`\n📊 Total de empleados en la base de datos: ${totalEmpleados}`);

  } catch (error) {
    console.error('💥 Error durante la importación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la importación
importFinalEmpleados();
