import { PrismaClient } from '@prisma/client';

// Usuario admin con contraseña hasheada
const adminUser = {
  username: 'admin',
  password: '$2b$10$iNYKd8me0KNuNZ1cg0SqEO1NJzHpIGK7lcaybY.X8u.Er2gd377ju', // admin123
  role: 'admin'
};

// Función para crear usuario admin
async function seedAdminUser(prisma: PrismaClient) {
  console.log('👤 Creando usuario admin...');
  
  // Verificar si ya existe el usuario admin
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  });
  
  if (existingAdmin) {
    console.log('✅ Usuario admin ya existe, actualizando contraseña...');
    await prisma.user.update({
      where: { username: 'admin' },
      data: {
        password: adminUser.password,
        role: adminUser.role
      }
    });
  } else {
    console.log('✅ Creando nuevo usuario admin...');
    await prisma.user.create({
      data: adminUser
    });
  }
  
  console.log('✅ Usuario admin configurado correctamente');
}

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando seed de la base de datos...');
  
  // Crear usuario admin
  await seedAdminUser(prisma);
  
  console.log('🎉 Seed completado exitosamente');
  console.log('');
  console.log('📋 CREDENCIALES DE ACCESO:');
  console.log('   Usuario: admin');
  console.log('   Contraseña: admin123');
  console.log('   Rol: admin');
}

main()
    .catch((e) => {
        console.error('❌ Error durante el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });