import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabaseKeepAdminEmpresasCatalogo() {
  try {
    console.log('🧹 Iniciando limpieza de base de datos...');
    console.log('📋 Manteniendo: Administrador, Empresas y Catálogo');
    
    // 1. Eliminar asignaciones (dependen de empleados y equipos)
    console.log('🗑️  Eliminando asignaciones...');
    await prisma.asignaciones.deleteMany();
    console.log('✅ Asignaciones eliminadas');

    // 2. Eliminar historial de modificaciones (depende de computadores)
    console.log('🗑️  Eliminando historial de modificaciones...');
    await prisma.historialModificaciones.deleteMany();
    console.log('✅ Historial de modificaciones eliminado');

    // 3. Eliminar historial de movimientos (depende de usuarios)
    console.log('🗑️  Eliminando historial de movimientos...');
    await prisma.historialMovimientos.deleteMany();
    console.log('✅ Historial de movimientos eliminado');

    // 4. Eliminar computadores (dependen de empleados, departamentos, ubicaciones, modelos)
    console.log('🗑️  Eliminando computadores...');
    await prisma.computador.deleteMany();
    console.log('✅ Computadores eliminados');

    // 5. Eliminar dispositivos (dependen de empleados, departamentos, ubicaciones, modelos)
    console.log('🗑️  Eliminando dispositivos...');
    await prisma.dispositivo.deleteMany();
    console.log('✅ Dispositivos eliminados');

    // 6. Eliminar empleados (dependen de departamentos y cargos)
    console.log('🗑️  Eliminando empleados...');
    await prisma.empleado.deleteMany();
    console.log('✅ Empleados eliminados');

    // 7. Eliminar cargos (dependen de departamentos)
    console.log('🗑️  Eliminando cargos...');
    await prisma.cargo.deleteMany();
    console.log('✅ Cargos eliminados');

    // 8. Eliminar departamentos (dependen de empresas)
    console.log('🗑️  Eliminando departamentos...');
    await prisma.departamento.deleteMany();
    console.log('✅ Departamentos eliminados');

    // 9. Eliminar ubicaciones
    console.log('🗑️  Eliminando ubicaciones...');
    await prisma.ubicacion.deleteMany();
    console.log('✅ Ubicaciones eliminadas');

    // 10. Eliminar usuarios (excepto administradores)
    console.log('🗑️  Eliminando usuarios no administradores...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          not: 'admin'
        }
      }
    });
    console.log(`✅ ${deletedUsers.count} usuarios no administradores eliminados`);

    // 11. Verificar que queden solo administradores
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true
      }
    });
    
    console.log('👤 Usuarios restantes:');
    remainingUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.role})`);
    });

    // 12. Verificar empresas restantes
    const remainingEmpresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nombre: true
      }
    });
    
    console.log('🏢 Empresas restantes:');
    remainingEmpresas.forEach(empresa => {
      console.log(`   - ${empresa.nombre}`);
    });

    // 13. Verificar catálogo restante
    const remainingMarcas = await prisma.marca.findMany({
      select: {
        id: true,
        nombre: true
      }
    });
    
    const remainingModelos = await prisma.modeloDispositivo.findMany({
      select: {
        id: true,
        nombre: true,
        tipo: true,
        marca: {
          select: {
            nombre: true
          }
        }
      }
    });
    
    console.log('📦 Catálogo restante:');
    console.log(`   - ${remainingMarcas.length} marcas`);
    console.log(`   - ${remainingModelos.length} modelos`);
    
    if (remainingModelos.length > 0) {
      console.log('   Modelos:');
      remainingModelos.forEach(modelo => {
        console.log(`     - ${modelo.nombre} (${modelo.tipo}) - ${modelo.marca.nombre}`);
      });
    }

    console.log('\n🎉 Limpieza completada exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - Usuarios: ${remainingUsers.length} (solo administradores)`);
    console.log(`   - Empresas: ${remainingEmpresas.length}`);
    console.log(`   - Marcas: ${remainingMarcas.length}`);
    console.log(`   - Modelos: ${remainingModelos.length}`);
    console.log(`   - Departamentos: 0`);
    console.log(`   - Empleados: 0`);
    console.log(`   - Computadores: 0`);
    console.log(`   - Dispositivos: 0`);
    console.log(`   - Asignaciones: 0`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
cleanDatabaseKeepAdminEmpresasCatalogo()
  .then(() => {
    console.log('✅ Script ejecutado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando el script:', error);
    process.exit(1);
  });
