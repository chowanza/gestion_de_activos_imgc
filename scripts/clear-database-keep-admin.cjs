const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabaseKeepAdmin() {
  try {
    console.log('🧹 Iniciando limpieza de la base de datos...');
    
    // Primero, vamos a obtener el usuario admin para mantenerlo
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'admin'
      }
    });

    if (!adminUser) {
      console.log('❌ No se encontró usuario administrador. Abortando...');
      return;
    }

    console.log(`✅ Usuario admin encontrado: ${adminUser.username}`);

    // Eliminar en orden para respetar las foreign keys
    console.log('🗑️ Eliminando asignaciones...');
    await prisma.asignaciones.deleteMany({});

    console.log('🗑️ Eliminando computadores...');
    await prisma.computador.deleteMany({});

    console.log('🗑️ Eliminando dispositivos...');
    await prisma.dispositivo.deleteMany({});

    console.log('🗑️ Eliminando empleados...');
    await prisma.empleado.deleteMany({});

    console.log('🗑️ Eliminando cargos...');
    await prisma.cargo.deleteMany({});

    console.log('🗑️ Eliminando departamentos...');
    await prisma.departamento.deleteMany({});

    console.log('🗑️ Eliminando empresas...');
    await prisma.empresa.deleteMany({});

    console.log('🗑️ Eliminando modelos...');
    await prisma.modeloDispositivo.deleteMany({});

    console.log('🗑️ Eliminando marcas...');
    await prisma.marca.deleteMany({});

    console.log('🗑️ Eliminando líneas telefónicas...');
    await prisma.lineaTelefonica.deleteMany({});

    console.log('🗑️ Eliminando historial de modificaciones...');
    await prisma.historialModificaciones.deleteMany({});

    console.log('🗑️ Eliminando historial de movimientos...');
    await prisma.historialMovimientos.deleteMany({});

    // Eliminar todos los usuarios excepto el admin
    console.log('🗑️ Eliminando usuarios (excepto admin)...');
    await prisma.user.deleteMany({
      where: {
        id: {
          not: adminUser.id
        }
      }
    });

    console.log('✅ Base de datos limpiada exitosamente!');
    console.log(`👤 Usuario admin mantenido: ${adminUser.username} (ID: ${adminUser.id})`);
    
    // Verificar que solo queda el admin
    const remainingUsers = await prisma.user.count();
    console.log(`📊 Total de usuarios restantes: ${remainingUsers}`);

  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
clearDatabaseKeepAdmin()
  .then(() => {
    console.log('🎉 Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en el script:', error);
    process.exit(1);
  });
