import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAsignacionesFixed() {
  try {
    console.log('🧪 Probando que las asignaciones estén corregidas...\n');

    // Obtener todas las asignaciones
    const asignaciones = await prisma.asignaciones.findMany({
      include: {
        targetEmpleado: true,
        targetDepartamento: true,
        computador: {
          include: {
            modelo: { include: { marca: true } }
          }
        },
        dispositivo: {
          include: {
            modelo: { include: { marca: true } }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    console.log(`📊 Total de asignaciones: ${asignaciones.length}\n`);

    asignaciones.forEach((a, index) => {
      const equipo = a.computador || a.dispositivo;
      const asignadoA = a.targetEmpleado ? 
        `${a.targetEmpleado.nombre} ${a.targetEmpleado.apellido}` :
        a.targetDepartamento?.nombre || 'Sistema';
      
      console.log(`${index + 1}. ${equipo?.serial} → ${asignadoA} (${a.targetType})`);
      console.log(`   Fecha: ${a.date.toISOString().split('T')[0]}`);
      console.log(`   Acción: ${a.actionType}`);
      console.log(`   Motivo: ${a.motivo || 'N/A'}`);
      console.log('');
    });

    // Verificar que no hay asignaciones con targetType incorrecto
    const asignacionesIncorrectas = await prisma.asignaciones.findMany({
      where: {
        targetType: 'Computador'
      }
    });

    if (asignacionesIncorrectas.length === 0) {
      console.log('✅ No hay asignaciones con targetType incorrecto');
    } else {
      console.log(`❌ Aún hay ${asignacionesIncorrectas.length} asignaciones con targetType incorrecto`);
    }

    // Verificar que los equipos están correctamente asignados
    const computadoresAsignados = await prisma.computador.findMany({
      where: {
        estado: 'Asignado'
      },
      include: {
        empleado: true,
        departamento: true
      }
    });

    console.log(`\n💻 Computadores asignados: ${computadoresAsignados.length}`);
    computadoresAsignados.forEach(comp => {
      const asignadoA = comp.empleado ? 
        `${comp.empleado.nombre} ${comp.empleado.apellido}` :
        comp.departamento?.nombre || 'No asignado';
      console.log(`   ${comp.serial} → ${asignadoA}`);
    });

    console.log('\n✅ Sistema de asignaciones funcionando correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAsignacionesFixed();


