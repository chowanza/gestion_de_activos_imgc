const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Ejecutando script de datos básicos...');

try {
  // Ejecutar el script de TypeScript
  execSync('npx tsx scripts/seed-basic-data.ts', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Script ejecutado exitosamente!');
} catch (error) {
  console.error('❌ Error ejecutando el script:', error.message);
  process.exit(1);
}
