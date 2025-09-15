const { exec } = require('child_process');

console.log('🚀 Ejecutando importación de empleados...\n');

exec('npx tsx scripts/import-empleados.ts', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error ejecutando el script:', error);
    return;
  }
  
  if (stderr) {
    console.error('⚠️  Advertencias:', stderr);
  }
  
  console.log(stdout);
  console.log('\n✅ Script de importación completado!');
});
