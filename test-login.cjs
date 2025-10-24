const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function testLogin() {
  const prisma = new PrismaClient();
  
  try {
    // Buscar el usuario
    const user = await prisma.user.findUnique({ where: { username: 'admin' } });
    console.log('Usuario encontrado:', user ? { username: user.username, role: user.role, passwordLength: user.password.length } : 'No encontrado');
    
    if (!user) {
      console.log('Usuario no encontrado');
      return;
    }
    
    // Probar diferentes contraseñas
    const passwords = ['test', 'admin123', 'admin', 'password'];
    
    for (const password of passwords) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`Contraseña "${password}": ${isValid ? 'VÁLIDA' : 'inválida'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
