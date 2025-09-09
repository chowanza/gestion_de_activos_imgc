const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Ejecutando script de datos de prueba...');

try {
  // Ejecutar el script de TypeScript
  execSync('npx tsx scripts/seed-test-data-complete.ts', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Script ejecutado exitosamente!');
} catch (error) {
  console.error('❌ Error ejecutando el script:', error.message);
  process.exit(1);
}
