import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creando usuario administrador...');
    
    // Verificar si ya existe el usuario admin
    const existingAdmin = await prisma.user.findFirst({
      where: { username: 'adminti' }
    });

    if (existingAdmin) {
      console.log('El usuario administrador ya existe.');
      return;
    }

    // Crear el usuario administrador
    const admin = await prisma.user.create({
      data: {
        username: 'adminti',
        password: 'maveit2013',
        role: 'admin'
      }
    });

    console.log('Usuario administrador creado exitosamente:');
    console.log('- Usuario:', admin.username);
    console.log('- Contraseña: maveit2013');
    console.log('- Rol:', admin.role);
    
  } catch (error) {
    console.error('Error al crear el usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
