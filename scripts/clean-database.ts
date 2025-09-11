// scripts/clean-database.ts
// Script para limpiar la base de datos manteniendo solo empresas y usuario administrador

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpieza de base de datos...');
  console.log('⚠️  MANTENIENDO: Empresas y Usuario Administrador');
  console.log('🗑️  ELIMINANDO: Todo lo demás');

  try {
    // 1. Eliminar asignaciones primero (por las relaciones)
    console.log('📋 Eliminando asignaciones...');
    const asignacionesEliminadas = await prisma.asignaciones.deleteMany({});
    console.log(`✅ ${asignacionesEliminadas.count} asignaciones eliminadas`);

    // 2. Eliminar historial de modificaciones
    console.log('📝 Eliminando historial de modificaciones...');
    const historialEliminado = await prisma.historialModificaciones.deleteMany({});
    console.log(`✅ ${historialEliminado.count} registros de historial eliminados`);

    // 3. Eliminar historial de movimientos
    console.log('📊 Eliminando historial de movimientos...');
    const movimientosEliminados = await prisma.historialMovimientos.deleteMany({});
    console.log(`✅ ${movimientosEliminados.count} movimientos eliminados`);

    // 4. Eliminar computadores
    console.log('💻 Eliminando computadores...');
    const computadoresEliminados = await prisma.computador.deleteMany({});
    console.log(`✅ ${computadoresEliminados.count} computadores eliminados`);

    // 5. Eliminar dispositivos
    console.log('📱 Eliminando dispositivos...');
    const dispositivosEliminados = await prisma.dispositivo.deleteMany({});
    console.log(`✅ ${dispositivosEliminados.count} dispositivos eliminados`);

    // 6. Eliminar empleados (excepto administrador)
    console.log('👥 Eliminando empleados...');
    const empleadosEliminados = await prisma.empleado.deleteMany({});
    console.log(`✅ ${empleadosEliminados.count} empleados eliminados`);

    // 7. Eliminar cargos
    console.log('💼 Eliminando cargos...');
    const cargosEliminados = await prisma.cargo.deleteMany({});
    console.log(`✅ ${cargosEliminados.count} cargos eliminados`);

    // 8. Eliminar departamentos
    console.log('🏢 Eliminando departamentos...');
    const departamentosEliminados = await prisma.departamento.deleteMany({});
    console.log(`✅ ${departamentosEliminados.count} departamentos eliminados`);

    // 9. Eliminar ubicaciones
    console.log('📍 Eliminando ubicaciones...');
    const ubicacionesEliminadas = await prisma.ubicacion.deleteMany({});
    console.log(`✅ ${ubicacionesEliminadas.count} ubicaciones eliminadas`);

    // 10. Eliminar modelos de dispositivos
    console.log('📱 Eliminando modelos de dispositivos...');
    const modelosEliminados = await prisma.modeloDispositivo.deleteMany({});
    console.log(`✅ ${modelosEliminados.count} modelos eliminados`);

    // 11. Eliminar marcas
    console.log('🏷️ Eliminando marcas...');
    const marcasEliminadas = await prisma.marca.deleteMany({});
    console.log(`✅ ${marcasEliminadas.count} marcas eliminadas`);

    // 12. Verificar que las empresas se mantuvieron
    console.log('🏢 Verificando empresas...');
    const empresas = await prisma.empresa.findMany();
    console.log(`✅ ${empresas.length} empresas mantenidas`);

    // 13. Verificar que el usuario administrador se mantuvo
    console.log('👤 Verificando usuario administrador...');
    const usuarios = await prisma.user.findMany();
    console.log(`✅ ${usuarios.length} usuarios mantenidos`);

    console.log('\n🎉 ¡Limpieza de base de datos completada exitosamente!');
    console.log('\n📊 Resumen de la limpieza:');
    console.log(`  • Asignaciones eliminadas: ${asignacionesEliminadas.count}`);
    console.log(`  • Historial eliminado: ${historialEliminado.count}`);
    console.log(`  • Movimientos eliminados: ${movimientosEliminados.count}`);
    console.log(`  • Computadores eliminados: ${computadoresEliminados.count}`);
    console.log(`  • Dispositivos eliminados: ${dispositivosEliminados.count}`);
    console.log(`  • Empleados eliminados: ${empleadosEliminados.count}`);
    console.log(`  • Cargos eliminados: ${cargosEliminados.count}`);
    console.log(`  • Departamentos eliminados: ${departamentosEliminados.count}`);
    console.log(`  • Ubicaciones eliminadas: ${ubicacionesEliminadas.count}`);
    console.log(`  • Modelos eliminados: ${modelosEliminados.count}`);
    console.log(`  • Marcas eliminadas: ${marcasEliminadas.count}`);
    console.log(`\n✅ MANTENIDOS:`);
    console.log(`  • Empresas: ${empresas.length}`);
    console.log(`  • Usuarios: ${usuarios.length}`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Error fatal:', e);
    process.exit(1);
  });
