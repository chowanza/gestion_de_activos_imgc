const fs = require('fs');

// Leer el archivo JSON
const data = JSON.parse(fs.readFileSync('./public/Empleados_IMGC_Filtrados_20250915_1153.json', 'utf8'));

console.log('=== ANÁLISIS DE DATOS DE EMPLEADOS ===');
console.log(`Total entradas en JSON: ${data.length}`);

// Contar empleados con email
const empleadosConEmail = data.filter(emp => emp.Email && emp.Email.trim() !== '');
console.log(`Empleados con email: ${empleadosConEmail.length}`);

// Mostrar algunos ejemplos de emails
console.log('\n=== EJEMPLOS DE EMAILS ===');
empleadosConEmail.slice(0, 10).forEach((emp, index) => {
  console.log(`${index + 1}. ${emp.Nombre} ${emp.Apellido} - ${emp.Email}`);
});

// Verificar duplicados por nombre completo
const nombresCompletos = data.map(emp => `${emp.Nombre} ${emp.Apellido}`);
const duplicados = nombresCompletos.filter((nombre, index) => nombresCompletos.indexOf(nombre) !== index);
console.log(`\nNombres duplicados encontrados: ${duplicados.length}`);
if (duplicados.length > 0) {
  console.log('Duplicados:', [...new Set(duplicados)]);
}

// Verificar empleados sin email
const sinEmail = data.filter(emp => !emp.Email || emp.Email.trim() === '');
console.log(`\nEmpleados sin email: ${sinEmail.length}`);
if (sinEmail.length > 0) {
  console.log('Primeros 10 sin email:');
  sinEmail.slice(0, 10).forEach((emp, index) => {
    console.log(`${index + 1}. ${emp.Nombre} ${emp.Apellido}`);
  });
}
