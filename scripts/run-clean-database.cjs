const { execSync } = require('child_process');

console.log('🧹 Ejecutando script de limpieza de base de datos...');
console.log('⚠️  ADVERTENCIA: Se eliminarán todos los datos excepto empresas y usuario administrador');

try {
  execSync('npx tsx scripts/clean-database.ts', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Limpieza de base de datos completada exitosamente');
} catch (error) {
  console.error('❌ Error ejecutando la limpieza:', error.message);
  process.exit(1);
}
