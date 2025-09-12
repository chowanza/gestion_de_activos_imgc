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

    // Crear algunos empleados
    const empleados = [
      {
        nombre: 'Jorge',
        apellido: 'Rodriguez',
        email: 'jorge.rodriguez@empresa.com',
        telefono: '555-0001',
        empresaId: empresa.id,
      },
      {
        nombre: 'María',
        apellido: 'González',
        email: 'maria.gonzalez@empresa.com',
        telefono: '555-0002',
        empresaId: empresa.id,
      },
      {
        nombre: 'Carlos',
        apellido: 'López',
        email: 'carlos.lopez@empresa.com',
        telefono: '555-0003',
        empresaId: empresa.id,
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



