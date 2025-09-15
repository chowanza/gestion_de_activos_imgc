const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findMissingEmpleados() {
  try {
    // Leer datos del JSON
    const jsonData = JSON.parse(fs.readFileSync('./public/Empleados_IMGC_Filtrados_20250915_1153.json', 'utf8'));
    console.log(`📊 Total en JSON: ${jsonData.length}`);
    
    // Obtener empleados de la BD
    const dbEmpleados = await prisma.empleado.findMany({
      select: {
        nombre: true,
        apellido: true,
        email: true
      }
    });
    console.log(`📊 Total en BD: ${dbEmpleados.length}`);
    
    // Crear mapas para comparación
    const jsonMap = new Map();
    jsonData.forEach(emp => {
      const key = `${emp.Nombre} ${emp.Apellido}`.toLowerCase();
      jsonMap.set(key, emp);
    });
    
    const dbMap = new Map();
    dbEmpleados.forEach(emp => {
      const key = `${emp.nombre} ${emp.apellido}`.toLowerCase();
      dbMap.set(key, emp);
    });
    
    // Encontrar empleados en JSON pero no en BD
    const missingInDB = [];
    for (const [key, emp] of jsonMap) {
      if (!dbMap.has(key)) {
        missingInDB.push(emp);
      }
    }
    
    console.log(`\n❌ Empleados en JSON pero no en BD: ${missingInDB.length}`);
    missingInDB.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.Nombre} ${emp.Apellido} - ${emp.Email}`);
    });
    
    // Verificar duplicados en JSON
    const jsonNames = jsonData.map(emp => `${emp.Nombre} ${emp.Apellido}`);
    const duplicates = jsonNames.filter((name, index) => jsonNames.indexOf(name) !== index);
    console.log(`\n🔄 Nombres duplicados en JSON: ${duplicates.length}`);
    if (duplicates.length > 0) {
      console.log('Duplicados:', [...new Set(duplicates)]);
    }
    
    // Mostrar algunos empleados de la BD para comparar
    console.log(`\n📋 Primeros 5 empleados en BD:`);
    dbEmpleados.slice(0, 5).forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.nombre} ${emp.apellido} - ${emp.email}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findMissingEmpleados();
