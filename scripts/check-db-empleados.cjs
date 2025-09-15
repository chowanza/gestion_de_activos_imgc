const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmpleados() {
  try {
    console.log('=== VERIFICACIÓN DE EMPLEADOS EN BASE DE DATOS ===');
    
    // Contar total de empleados
    const totalEmpleados = await prisma.empleado.count();
    console.log(`Total empleados en BD: ${totalEmpleados}`);
    
    // Contar empleados con email
    const empleadosConEmail = await prisma.empleado.count({
      where: {
        email: {
          not: null
        }
      }
    });
    console.log(`Empleados con email en BD: ${empleadosConEmail}`);
    
    // Mostrar algunos empleados con email
    const empleados = await prisma.empleado.findMany({
      where: {
        email: {
          not: null
        }
      },
      select: {
        nombre: true,
        apellido: true,
        email: true
      },
      take: 10
    });
    
    console.log('\n=== PRIMEROS 10 EMPLEADOS CON EMAIL ===');
    empleados.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.nombre} ${emp.apellido} - ${emp.email}`);
    });
    
    // Verificar empleados sin email
    const sinEmail = await prisma.empleado.findMany({
      where: {
        OR: [
          { email: null },
          { email: '' }
        ]
      },
      select: {
        nombre: true,
        apellido: true,
        email: true
      },
      take: 10
    });
    
    console.log(`\nEmpleados sin email: ${sinEmail.length}`);
    if (sinEmail.length > 0) {
      console.log('Primeros 10 sin email:');
      sinEmail.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.nombre} ${emp.apellido} - ${emp.email}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmpleados();
