import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createEmpleados() {
  try {
    console.log('🚀 Creando empleados de prueba...');

    // Obtener la primera empresa
    const empresa = await prisma.empresa.findFirst();
    if (!empresa) {
      console.log('❌ No hay empresas en la base de datos');
      return;
    }

    // Obtener el primer departamento
    const departamento = await prisma.departamento.findFirst();
    if (!departamento) {
      console.log('❌ No hay departamentos en la base de datos');
      return;
    }

    // Obtener el primer cargo
    const cargo = await prisma.cargo.findFirst();
    if (!cargo) {
      console.log('❌ No hay cargos en la base de datos');
      return;
    }

    // Crear algunos empleados
    const empleados = [
      {
        nombre: 'Jorge',
        apellido: 'Rodriguez',
        ced: '12345678',
        email: 'jorge.rodriguez@empresa.com',
        departamentoId: departamento.id,
        cargoId: cargo.id,
      },
      {
        nombre: 'María',
        apellido: 'González',
        ced: '87654321',
        email: 'maria.gonzalez@empresa.com',
        departamentoId: departamento.id,
        cargoId: cargo.id,
      },
      {
        nombre: 'Carlos',
        apellido: 'López',
        ced: '11223344',
        email: 'carlos.lopez@empresa.com',
        departamentoId: departamento.id,
        cargoId: cargo.id,
      },
    ];

    for (const empleadoData of empleados) {
      const empleado = await prisma.empleado.create({
        data: empleadoData,
      });
      console.log(`✅ Empleado creado: ${empleado.nombre} ${empleado.apellido}`);
    }

    console.log('🎉 Empleados creados exitosamente');
  } catch (error) {
    console.error('❌ Error al crear empleados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createEmpleados();



