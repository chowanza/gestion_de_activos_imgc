const { execSync } = require('child_process');

console.log('🚀 Ejecutando script de generación de datos IMGC IRON...');

try {
  execSync('npx tsx scripts/seed-imgc-iron.ts', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Script IMGC IRON ejecutado exitosamente');
} catch (error) {
  console.error('❌ Error ejecutando el script IMGC IRON:', error.message);
  process.exit(1);
}
