const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function compareImport() {
  try {
    // Leer datos del JSON
    const jsonData = JSON.parse(fs.readFileSync('./public/Empleados_IMGC_Filtrados_20250915_1153.json', 'utf8'));
    console.log(`Total en JSON: ${jsonData.length}`);
    
    // Obtener empleados de la BD
    const dbEmpleados = await prisma.empleado.findMany({
      select: {
        nombre: true,
        apellido: true,
        email: true
      }
    });
    console.log(`Total en BD: ${dbEmpleados.length}`);
    
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
    
    console.log(`\nEmpleados en JSON pero no en BD: ${missingInDB.length}`);
    missingInDB.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.Nombre} ${emp.Apellido} - ${emp.Email}`);
    });
    
    // Encontrar empleados en BD pero no en JSON
    const missingInJSON = [];
    for (const [key, emp] of dbMap) {
      if (!jsonMap.has(key)) {
        missingInJSON.push(emp);
      }
    }
    
    console.log(`\nEmpleados en BD pero no en JSON: ${missingInJSON.length}`);
    missingInJSON.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.nombre} ${emp.apellido} - ${emp.email}`);
    });
    
    // Verificar duplicados en JSON
    const jsonNames = jsonData.map(emp => `${emp.Nombre} ${emp.Apellido}`);
    const duplicates = jsonNames.filter((name, index) => jsonNames.indexOf(name) !== index);
    console.log(`\nNombres duplicados en JSON: ${duplicates.length}`);
    if (duplicates.length > 0) {
      console.log('Duplicados:', [...new Set(duplicates)]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareImport();
