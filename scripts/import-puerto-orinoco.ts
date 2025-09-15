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

async function importPuertoOrinoco() {
  try {
    console.log('🚀 Importando el segundo empleado "Documentos Puerto Orinoco"...\n');

    // El empleado faltante
    const empleadoData = {
      Nombre: "Documentos",
      Apellido: "Puerto Orinoco",
      Email: "Documentos.Ptorinoco@imgc.us",
      Empresa: "Puerto Orinoco Catamarán",
      Departamento: "Documentación",
      Cargo: "Documentador"
    };

    console.log(`Procesando empleado: ${empleadoData.Nombre} ${empleadoData.Apellido}`);

    // Buscar o crear empresa
    const empresa = await findOrCreateEmpresa(empleadoData.Empresa);

    // Buscar o crear departamento
    const departamento = await findOrCreateDepartamento(empleadoData.Departamento, empresa.id);

    // Buscar o crear cargo
    const cargo = await findOrCreateCargo(empleadoData.Cargo, departamento.id);

    // Verificar si el empleado ya existe por email
    const existingEmpleado = await prisma.empleado.findFirst({
      where: {
        email: empleadoData.Email
      }
    });

    if (existingEmpleado) {
      console.log(`  ⚠️  Empleado ya existe (por email), saltando...`);
      return;
    }

    // Crear empleado
    const newEmpleado = await prisma.empleado.create({
      data: {
        nombre: empleadoData.Nombre.trim(),
        apellido: empleadoData.Apellido.trim(),
        email: empleadoData.Email?.trim() || null,
        ced: '',
        cargoId: cargo?.id || null,
        departamentoId: departamento.id,
        fechaNacimiento: null,
        fechaIngreso: null,
        fotoPerfil: null
      }
    });

    console.log(`  ✅ Empleado creado: ${newEmpleado.nombre} ${newEmpleado.apellido} - ${newEmpleado.email}`);

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
importPuertoOrinoco();
