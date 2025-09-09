const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos de prueba...');

  try {
    // 1. Crear empresa
    const empresa = await prisma.empresa.upsert({
      where: { id: 'empresa-1' },
      update: {},
      create: {
        id: 'empresa-1',
        nombre: 'IMGC',
        descripcion: 'Instituto de Medicina Genómica y Computacional'
      }
    });
    console.log('✅ Empresa creada:', empresa.nombre);

    // 2. Crear departamentos
    const departamento1 = await prisma.departamento.upsert({
      where: { id: 'depto-1' },
      update: {},
      create: {
        id: 'depto-1',
        nombre: 'Tecnología',
        empresaId: empresa.id
      }
    });

    const departamento2 = await prisma.departamento.upsert({
      where: { id: 'depto-2' },
      update: {},
      create: {
        id: 'depto-2',
        nombre: 'Recursos Humanos',
        empresaId: empresa.id
      }
    });
    console.log('✅ Departamentos creados');

    // 3. Crear cargos
    const cargo1 = await prisma.cargo.upsert({
      where: { id: 'cargo-1' },
      update: {},
      create: {
        id: 'cargo-1',
        nombre: 'Desarrollador',
        descripcion: 'Desarrollador de software',
        departamentoId: departamento1.id
      }
    });

    const cargo2 = await prisma.cargo.upsert({
      where: { id: 'cargo-2' },
      update: {},
      create: {
        id: 'cargo-2',
        nombre: 'Analista',
        descripcion: 'Analista de sistemas',
        departamentoId: departamento1.id
      }
    });

    const cargo3 = await prisma.cargo.upsert({
      where: { id: 'cargo-3' },
      update: {},
      create: {
        id: 'cargo-3',
        nombre: 'Gerente',
        descripcion: 'Gerente de departamento',
        departamentoId: departamento2.id
      }
    });
    console.log('✅ Cargos creados');

    // 4. Crear empleados
    const empleado1 = await prisma.empleado.upsert({
      where: { id: 'user-1' },
      update: {},
      create: {
        id: 'user-1',
        nombre: 'Juan',
        apellido: 'Pérez',
        ced: '12345678',
        departamentoId: departamento1.id,
        cargoId: cargo1.id
      }
    });

    const empleado2 = await prisma.empleado.upsert({
      where: { id: 'user-2' },
      update: {},
      create: {
        id: 'user-2',
        nombre: 'María',
        apellido: 'González',
        ced: '87654321',
        departamentoId: departamento1.id,
        cargoId: cargo2.id
      }
    });

    const empleado3 = await prisma.empleado.upsert({
      where: { id: 'user-3' },
      update: {},
      create: {
        id: 'user-3',
        nombre: 'Carlos',
        apellido: 'López',
        ced: '11223344',
        departamentoId: departamento2.id,
        cargoId: cargo3.id
      }
    });
    console.log('✅ Empleados creados');

    // 5. Verificar si ya existe el usuario admin
    let adminUser = await prisma.user.findFirst({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await prisma.user.create({
        data: {
          id: 'admin-1',
          username: 'admin',
          password: hashedPassword,
          role: 'admin'
        }
      });
      console.log('✅ Usuario admin creado');
    } else {
      console.log('✅ Usuario admin ya existe');
    }

    console.log('🎉 Seed completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`- 1 Empresa: ${empresa.nombre}`);
    console.log(`- 2 Departamentos: ${departamento1.nombre}, ${departamento2.nombre}`);
    console.log(`- 3 Cargos: ${cargo1.nombre}, ${cargo2.nombre}, ${cargo3.nombre}`);
    console.log(`- 3 Empleados: ${empleado1.nombre} ${empleado1.apellido}, ${empleado2.nombre} ${empleado2.apellido}, ${empleado3.nombre} ${empleado3.apellido}`);
    console.log(`- 1 Usuario del sistema: ${adminUser.username} (${adminUser.role})`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
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
