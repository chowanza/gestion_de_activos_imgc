const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPuertoOrinoco() {
  try {
    console.log('🔍 Verificando empleados "Documentos Puerto Orinoco"...\n');
    
    // Buscar empleados con nombre "Documentos" y apellido que contenga "Puerto Orinoco"
    const empleados = await prisma.empleado.findMany({
      where: {
        AND: [
          { nombre: { contains: "Documentos" } },
          { apellido: { contains: "Puerto Orinoco" } }
        ]
      },
      select: {
        nombre: true,
        apellido: true,
        email: true
      }
    });
    
    console.log(`📊 Empleados "Documentos Puerto Orinoco" en BD: ${empleados.length}`);
    
    empleados.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.nombre} ${emp.apellido} - ${emp.email}`);
    });
    
    // Verificar emails específicos
    const email1 = "Documentos.Puertorinoco.01@imgc.us";
    const email2 = "Documentos.Ptorinoco@imgc.us";
    
    const emp1 = await prisma.empleado.findFirst({
      where: { email: email1 }
    });
    
    const emp2 = await prisma.empleado.findFirst({
      where: { email: email2 }
    });
    
    console.log(`\n📧 Verificación de emails específicos:`);
    console.log(`Email 1 (${email1}): ${emp1 ? '✅ Existe' : '❌ No existe'}`);
    console.log(`Email 2 (${email2}): ${emp2 ? '✅ Existe' : '❌ No existe'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPuertoOrinoco();
