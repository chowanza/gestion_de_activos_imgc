import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    console.log('Actualizando contraseña del usuario administrador...');
    
    // Buscar el usuario admin
    const admin = await prisma.user.findFirst({
      where: { username: 'adminti' }
    });

    if (!admin) {
      console.log('Usuario administrador no encontrado.');
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash('maveit2013', 10);

    // Actualizar la contraseña
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    });

    console.log('Contraseña del usuario administrador actualizada exitosamente:');
    console.log('- Usuario:', admin.username);
    console.log('- Contraseña: maveit2013 (ahora hasheada)');
    console.log('- Rol:', admin.role);
    
  } catch (error) {
    console.error('Error al actualizar la contraseña del usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
