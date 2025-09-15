const fs = require('fs');

// Leer el archivo de la tabla
const tableContent = fs.readFileSync('./src/components/empleados-table.tsx', 'utf8');

console.log('🔍 Verificando configuración de la tabla...\n');

// Buscar la definición de columnas
const columnStart = tableContent.indexOf('const columns: ColumnDef<Empleado>[] = [');
const columnEnd = tableContent.indexOf('];', columnStart);

if (columnStart !== -1 && columnEnd !== -1) {
  const columnsSection = tableContent.substring(columnStart, columnEnd + 2);
  
  // Buscar la columna de email
  const emailColumnStart = columnsSection.indexOf('accessorKey: "email"');
  if (emailColumnStart !== -1) {
    const emailColumnEnd = columnsSection.indexOf('},', emailColumnStart);
    const emailColumn = columnsSection.substring(emailColumnStart, emailColumnEnd + 2);
    
    console.log('✅ Columna de email encontrada:');
    console.log(emailColumn);
  } else {
    console.log('❌ Columna de email NO encontrada');
  }
} else {
  console.log('❌ No se pudo encontrar la definición de columnas');
}

// Buscar configuración de visibilidad
const visibilityConfig = tableContent.match(/columnVisibility.*?{.*?}/s);
if (visibilityConfig) {
  console.log('\n🔍 Configuración de visibilidad encontrada:');
  console.log(visibilityConfig[0]);
} else {
  console.log('\n✅ No hay configuración de visibilidad específica (todas las columnas visibles por defecto)');
}

// Buscar si hay alguna configuración que oculte la columna de email
const emailHidden = tableContent.includes('email: false') || tableContent.includes('email: false');
if (emailHidden) {
  console.log('\n❌ Se encontró configuración que oculta la columna de email');
} else {
  console.log('\n✅ No se encontró configuración que oculta la columna de email');
}