// scripts/seed-empresas.cjs
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de empresas y usuarios...');
  
  // Crear empresa
  const empresa = await prisma.empresa.create({
    data: {
      nombre: 'IMGC',
      descripcion: 'Industria Maderera y Gestión de Activos'
    }
  });
  console.log('Empresa creada:', empresa.nombre);
  
  // Crear usuarios del sistema con nuevos roles
  const users = [
    { username: 'adminti', password: 'maveit2013', role: 'admin' },
    { username: 'monitor', password: 'Masisa,.2025', role: 'user' },
    { username: 'viewer', password: 'viewer123', role: 'viewer' },
    { username: 'assigner', password: 'assigner123', role: 'assigner' },
  ];
  
  for (const user of users) {
    const createdUser = await prisma.user.create({
      data: user,
    });
    console.log(`Usuario creado: ${createdUser.username} (${createdUser.role})`);
  }
  
  console.log('Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


