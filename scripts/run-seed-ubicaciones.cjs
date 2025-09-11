const { execSync } = require('child_process');

try {
  console.log('🚀 Ejecutando seed de ubicaciones...');
  execSync('npx tsx scripts/seed-ubicaciones.ts', { stdio: 'inherit' });
  console.log('✅ Seed de ubicaciones completado');
} catch (error) {
  console.error('❌ Error ejecutando seed de ubicaciones:', error.message);
  process.exit(1);
}
