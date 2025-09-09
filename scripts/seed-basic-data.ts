import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando datos básicos de prueba...');

  try {
    // Verificar si ya existen empresas
    const existingEmpresas = await prisma.empresa.count();
    if (existingEmpresas > 0) {
      console.log('⚠️  Ya existen empresas en la base de datos. Saltando creación...');
      return;
    }

    // Crear una empresa básica
    console.log('🏢 Creando empresa básica...');
    const empresa = await prisma.empresa.create({
      data: {
        nombre: 'Mi Empresa Demo',
        descripcion: 'Empresa de demostración para pruebas'
      }
    });

    // Crear un departamento básico
    console.log('🏬 Creando departamento básico...');
    const departamento =       await prisma.departamento.create({
        data: {
          nombre: 'Desarrollo',
          empresaId: empresa.id
        }
      });

    // Crear un cargo básico
    console.log('👔 Creando cargo básico...');
    const cargo = await prisma.cargo.create({
      data: {
        nombre: 'Desarrollador',
        descripcion: 'Desarrollador de software',
        departamentoId: departamento.id
      }
    });

    // Crear algunos empleados básicos
    console.log('👥 Creando empleados básicos...');
    const empleados = [
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        ced: '12345678',
        fechaNacimiento: '1990-01-15',
        fechaIngreso: '2023-01-01',
        departamentoId: departamento.id,
        cargoId: cargo.id
      },
      {
        nombre: 'María',
        apellido: 'García',
        ced: '87654321',
        fechaNacimiento: '1988-05-20',
        fechaIngreso: '2023-02-01',
        departamentoId: departamento.id,
        cargoId: cargo.id
      },
      {
        nombre: 'Carlos',
        apellido: 'López',
        ced: '11223344',
        fechaNacimiento: '1992-09-10',
        fechaIngreso: '2023-03-01',
        departamentoId: departamento.id,
        cargoId: cargo.id
      }
    ];

    const empleadosCreados = [];
    for (const empleado of empleados) {
      const empleadoCreado = await prisma.empleado.create({
        data: empleado
      });
      empleadosCreados.push(empleadoCreado);
    }

    // Asignar el primer empleado como gerente del departamento
    await prisma.departamento.update({
      where: { id: departamento.id },
      data: { gerenteId: empleadosCreados[0].id }
    });

    console.log('✅ Datos básicos creados exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - 1 empresa: ${empresa.nombre}`);
    console.log(`   - 1 departamento: ${departamento.nombre}`);
    console.log(`   - 1 cargo: ${cargo.nombre}`);
    console.log(`   - ${empleadosCreados.length} empleados`);
    console.log(`   - Gerente asignado: ${empleadosCreados[0].nombre} ${empleadosCreados[0].apellido}`);

  } catch (error) {
    console.error('❌ Error creando datos básicos:', error);
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
