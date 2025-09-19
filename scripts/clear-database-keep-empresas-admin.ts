import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpieza de base de datos...');
  console.log('📋 Manteniendo: Empresas y Usuario Admin');
  console.log('🗑️  Eliminando: Departamentos, Empleados, Cargos, Equipos, Asignaciones');

  try {
    // Obtener información antes de eliminar
    const empresasCount = await prisma.empresa.count();
    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    
    console.log(`📊 Estado actual:`);
    console.log(`   - ${empresasCount} empresas`);
    console.log(`   - ${adminCount} usuarios admin`);

    // Eliminar en orden correcto (respetando foreign keys)
    console.log('\n🗑️  Eliminando asignaciones...');
    const asignacionesDeleted = await prisma.asignaciones.deleteMany();
    console.log(`   ✅ ${asignacionesDeleted.count} asignaciones eliminadas`);

    console.log('🗑️  Eliminando computadores...');
    const computadoresDeleted = await prisma.computador.deleteMany();
    console.log(`   ✅ ${computadoresDeleted.count} computadores eliminados`);

    console.log('🗑️  Eliminando dispositivos...');
    const dispositivosDeleted = await prisma.dispositivo.deleteMany();
    console.log(`   ✅ ${dispositivosDeleted.count} dispositivos eliminados`);


    console.log('🗑️  Eliminando empleados...');
    const empleadosDeleted = await prisma.empleado.deleteMany();
    console.log(`   ✅ ${empleadosDeleted.count} empleados eliminados`);

    console.log('🗑️  Eliminando cargos...');
    const cargosDeleted = await prisma.cargo.deleteMany();
    console.log(`   ✅ ${cargosDeleted.count} cargos eliminados`);

    console.log('🗑️  Eliminando departamentos...');
    const departamentosDeleted = await prisma.departamento.deleteMany();
    console.log(`   ✅ ${departamentosDeleted.count} departamentos eliminados`);

    console.log('🗑️  Eliminando modelos de dispositivos...');
    const modelosDeleted = await prisma.modeloDispositivo.deleteMany();
    console.log(`   ✅ ${modelosDeleted.count} modelos eliminados`);

    console.log('🗑️  Eliminando marcas...');
    const marcasDeleted = await prisma.marca.deleteMany();
    console.log(`   ✅ ${marcasDeleted.count} marcas eliminadas`);

    // Eliminar usuarios que NO sean admin
    console.log('🗑️  Eliminando usuarios (excepto admin)...');
    const usuariosDeleted = await prisma.user.deleteMany({
      where: {
        role: {
          not: 'admin'
        }
      }
    });
    console.log(`   ✅ ${usuariosDeleted.count} usuarios no-admin eliminados`);

    // Eliminar historial de movimientos
    console.log('🗑️  Eliminando historial de movimientos...');
    const historialDeleted = await prisma.historialMovimientos.deleteMany();
    console.log(`   ✅ ${historialDeleted.count} registros de historial eliminados`);

    // Verificar qué se mantuvo
    const empresasFinal = await prisma.empresa.count();
    const adminFinal = await prisma.user.count({ where: { role: 'admin' } });
    const departamentosFinal = await prisma.departamento.count();
    const empleadosFinal = await prisma.empleado.count();
    const equiposFinal = await prisma.computador.count() + await prisma.dispositivo.count();

    console.log('\n✅ Limpieza completada exitosamente!');
    console.log('📊 Estado final:');
    console.log(`   - ${empresasFinal} empresas (mantenidas)`);
    console.log(`   - ${adminFinal} usuarios admin (mantenidos)`);
    console.log(`   - ${departamentosFinal} departamentos (eliminados)`);
    console.log(`   - ${empleadosFinal} empleados (eliminados)`);
    console.log(`   - ${equiposFinal} equipos (eliminados)`);

    if (empresasFinal > 0) {
      console.log('\n🏢 Empresas mantenidas:');
      const empresas = await prisma.empresa.findMany({
        select: { nombre: true }
      });
      empresas.forEach(empresa => {
        console.log(`   - ${empresa.nombre}`);
      });
    }

    if (adminFinal > 0) {
      console.log('\n👤 Usuarios admin mantenidos:');
      const admins = await prisma.user.findMany({
        where: { role: 'admin' },
        select: { username: true, role: true }
      });
      admins.forEach(admin => {
        console.log(`   - ${admin.username} (${admin.role})`);
      });
    }

    console.log('\n🎯 Base de datos lista para nuevos datos de prueba!');
    console.log('💡 Puedes ejecutar el script de datos básicos o completos ahora.');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
