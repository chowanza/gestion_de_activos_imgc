const { execSync } = require('child_process');
const path = require('path');

console.log('🧹 Ejecutando limpieza de base de datos...');
console.log('📋 Manteniendo: Empresas y Usuario Admin');
console.log('🗑️  Eliminando: Todo lo demás');

try {
  // Ejecutar el script de TypeScript
  execSync('npx tsx scripts/clear-database-keep-empresas-admin.ts', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Limpieza ejecutada exitosamente!');
} catch (error) {
  console.error('❌ Error ejecutando la limpieza:', error.message);
  process.exit(1);
}
