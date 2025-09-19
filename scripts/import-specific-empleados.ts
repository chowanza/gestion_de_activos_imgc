import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function importSpecificEmpleados() {
  try {
    console.log('🚀 Importando empleados específicos faltantes...\n');

    // Los 4 empleados específicos que faltan
    const missingEmpleados = [
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
        const cargo = await findOrCreateCargo(empleadoData.Cargo || 'Sin cargo', departamento.id);
        if (!cargo) {
          console.log(`⚠️  No se pudo crear el cargo para ${empleadoData.Nombre} ${empleadoData.Apellido}`);
          continue;
        }

        // Verificar si el empleado ya existe por email
        const existingEmpleado = await prisma.empleado.findFirst({
          where: {
            email: empleadoData.Email
          }
        });

        if (existingEmpleado) {
          console.log(`  ⚠️  Empleado ya existe (por email), saltando...`);
          continue;
        }

        // Crear empleado
        const newEmpleado = await prisma.empleado.create({
          data: {
            nombre: empleadoData.Nombre.trim(),
            apellido: empleadoData.Apellido.trim(),
            email: empleadoData.Email?.trim() || null,
            ced: '',
            cargoId: cargo.id,
            departamentoId: departamento.id,
            fechaNacimiento: null,
            fechaIngreso: null,
            fotoPerfil: null
          }
        });

        console.log(`  ✅ Empleado creado: ${newEmpleado.nombre} ${newEmpleado.apellido} - ${newEmpleado.email}`);
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
importSpecificEmpleados();
