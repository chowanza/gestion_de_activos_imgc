const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Ejecutando limpieza de base de datos...');
console.log('📋 Manteniendo: Administrador, Empresas y Catálogo');
console.log('⚠️  ADVERTENCIA: Esta operación eliminará todos los datos excepto administradores, empresas y catálogo');
console.log('');

// Confirmar antes de ejecutar
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('¿Estás seguro de que quieres continuar? (escribe "SI" para confirmar): ', (answer) => {
  if (answer.trim().toUpperCase() === 'SI') {
    try {
      console.log('🔄 Ejecutando limpieza...');
      
      // Ejecutar el script de limpieza
      execSync('npx tsx scripts/clean-database-keep-admin-empresas-catalogo.ts', {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..')
      });
      
      console.log('✅ Limpieza completada exitosamente');
    } catch (error) {
      console.error('❌ Error ejecutando la limpieza:', error.message);
      process.exit(1);
    }
  } else {
    console.log('❌ Operación cancelada');
  }
  
  rl.close();
});
