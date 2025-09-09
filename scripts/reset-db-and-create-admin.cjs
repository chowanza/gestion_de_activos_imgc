const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetDatabaseAndCreateAdmin() {
  try {
    console.log('🗑️  Eliminando todos los datos de la base de datos...');
    
    // Eliminar en orden para respetar las foreign keys
    await prisma.historialMovimientos.deleteMany();
    await prisma.historialModificaciones.deleteMany();
    await prisma.asignaciones.deleteMany();
    await prisma.computador.deleteMany();
    await prisma.dispositivo.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.cargo.deleteMany();
    await prisma.departamento.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
    await prisma.modeloDispositivo.deleteMany(); // Modelos antes que marcas
    await prisma.marca.deleteMany();
    await prisma.lineaTelefonica.deleteMany();

    console.log('✅ Base de datos limpiada exitosamente');

    console.log('👤 Creando usuario administrador...');
    
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Crear usuario administrador
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
      }
    });

    console.log('✅ Usuario administrador creado:');
    console.log(`   Usuario: ${adminUser.username}`);
    console.log(`   Contraseña: admin123`);
    console.log(`   Rol: ${adminUser.role}`);

    console.log('🎉 Proceso completado exitosamente!');
    console.log('📝 Puedes iniciar sesión con:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');

  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabaseAndCreateAdmin();
