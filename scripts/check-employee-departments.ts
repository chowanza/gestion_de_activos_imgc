import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Verificando departamentos de empleados...\n');

    // 1. Verificar empleados con equipos asignados
    const empleadosConEquipos = await prisma.empleado.findMany({
      where: {
        OR: [
          { computadores: { some: {} } },
          { dispositivos: { some: {} } }
        ]
      },
      include: {
        departamento: {
          include: {
            empresa: true
          }
        },
        computadores: true,
        dispositivos: true
      }
    });

    console.log(`👥 Empleados con equipos: ${empleadosConEquipos.length}\n`);

    empleadosConEquipos.forEach((empleado, index) => {
      console.log(`${index + 1}. ${empleado.nombre} ${empleado.apellido}`);
      console.log(`   🏢 Empresa: ${empleado.departamento?.empresa?.nombre || 'SIN EMPRESA'}`);
      console.log(`   🏢 Departamento: ${empleado.departamento?.nombre || 'SIN DEPARTAMENTO'}`);
      console.log(`   💻 Computadores: ${empleado.computadores.length}`);
      console.log(`   📱 Dispositivos: ${empleado.dispositivos.length}`);
      
      // Verificar si los computadores tienen departamentoId
      empleado.computadores.forEach(comp => {
        console.log(`     💻 ${comp.serial}: departamentoId = ${comp.departamentoId || 'NULL'}`);
      });
      
      // Verificar si los dispositivos tienen departamentoId
      empleado.dispositivos.forEach(disp => {
        console.log(`     📱 ${disp.serial}: departamentoId = ${disp.departamentoId || 'NULL'}`);
      });
      
      console.log('');
    });

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Verificar todos los departamentos disponibles
    console.log('🏢 Departamentos disponibles:');
    const departamentos = await prisma.departamento.findMany({
      include: {
        empresa: true,
        empleados: true
      }
    });

    departamentos.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.nombre} (${dept.empresa.nombre})`);
      console.log(`   👥 Empleados: ${dept.empleados.length}`);
      console.log(`   🆔 ID: ${dept.id}`);
      console.log('');
    });

    console.log('\n' + '='.repeat(60) + '\n');

    // 3. Verificar ubicaciones disponibles
    console.log('📍 Ubicaciones disponibles:');
    const ubicaciones = await prisma.ubicacion.findMany();

    ubicaciones.forEach((ubicacion, index) => {
      console.log(`${index + 1}. ${ubicacion.nombre}`);
      console.log(`   📍 Dirección: ${ubicacion.direccion}`);
      console.log(`   🏢 Piso: ${ubicacion.piso}`);
      console.log(`   🏢 Sala: ${ubicacion.sala}`);
      console.log(`   🆔 ID: ${ubicacion.id}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
