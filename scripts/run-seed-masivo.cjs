const { execSync } = require('child_process');

console.log('🚀 Ejecutando script de generación masiva de datos...');

try {
  execSync('npx tsx scripts/seed-masivo-datos-prueba.ts', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Script ejecutado exitosamente');
} catch (error) {
  console.error('❌ Error ejecutando el script:', error.message);
  process.exit(1);
}
