const fs = require('fs');

// Leer el archivo de la tabla
const tableContent = fs.readFileSync('./src/components/empleados-table.tsx', 'utf8');

console.log('🔍 Verificando configuración de visibilidad de la tabla...\n');

// Buscar todas las referencias a email en el archivo
const emailMatches = tableContent.match(/email/g);
console.log(`📧 Referencias a "email" en el archivo: ${emailMatches ? emailMatches.length : 0}`);

// Buscar la configuración de columnVisibility
const visibilityMatch = tableContent.match(/columnVisibility.*?{.*?}/s);
if (visibilityMatch) {
  console.log('\n🔍 Configuración de columnVisibility:');
  console.log(visibilityMatch[0]);
} else {
  console.log('\n✅ No hay configuración específica de columnVisibility');
}

// Buscar si hay alguna configuración que oculte la columna de email
const emailHidden = tableContent.includes('email: false') || 
                   tableContent.includes('email: false') || 
                   tableContent.includes('email: 0') ||
                   tableContent.includes('email: false');

if (emailHidden) {
  console.log('\n❌ Se encontró configuración que oculta la columna de email');
} else {
  console.log('\n✅ No se encontró configuración que oculte la columna de email');
}

// Buscar la definición de la columna de email
const emailColumnMatch = tableContent.match(/accessorKey: "email".*?},/s);
if (emailColumnMatch) {
  console.log('\n✅ Definición de columna de email encontrada:');
  console.log(emailColumnMatch[0]);
} else {
  console.log('\n❌ No se encontró la definición de la columna de email');
}

// Buscar si hay alguna configuración de visibilidad por defecto
const defaultVisibilityMatch = tableContent.match(/columnVisibility.*?=.*?{.*?}/s);
if (defaultVisibilityMatch) {
  console.log('\n🔍 Configuración de visibilidad por defecto:');
  console.log(defaultVisibilityMatch[0]);
} else {
  console.log('\n✅ No hay configuración de visibilidad por defecto (todas las columnas visibles)');
}
