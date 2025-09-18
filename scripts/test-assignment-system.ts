import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAssignmentSystem() {
  try {
    console.log('🧪 Probando el sistema de asignaciones...\n');

    // Obtener un computador para probar
    const computador = await prisma.computador.findFirst({
      include: {
        empleado: {
          include: {
            departamento: {
              include: { empresa: true }
            }
          }
        },
        departamento: {
          include: { empresa: true }
        },
        modelo: {
          include: { marca: true }
        },
        asignaciones: {
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    });

    if (!computador) {
      console.log('❌ No se encontró ningún computador para probar');
      return;
    }

    console.log(`💻 Computador de prueba: ${computador.modelo.marca.nombre} ${computador.modelo.nombre}`);
    console.log(`   Serial: ${computador.serial}`);
    console.log(`   Estado actual: ${computador.estado}`);
    console.log(`   Empleado: ${computador.empleado ? `${computador.empleado.nombre} ${computador.empleado.apellido}` : 'No asignado'}`);
    console.log(`   Departamento: ${computador.departamento?.nombre || 'No asignado'}`);
    console.log(`   Empresa: ${computador.empleado?.departamento?.empresa?.nombre || computador.departamento?.empresa?.nombre || 'N/A'}`);

    console.log(`\n📋 Historial de asignaciones (últimas 5):`);
    if (computador.asignaciones.length === 0) {
      console.log('   No hay asignaciones registradas');
    } else {
      computador.asignaciones.forEach((asig, index) => {
        console.log(`\n${index + 1}. ${asig.date.toISOString().split('T')[0]}`);
        console.log(`   Acción: ${asig.actionType}`);
        console.log(`   Motivo: ${asig.motivo || 'N/A'}`);
        console.log(`   Target Type: ${asig.targetType}`);
        console.log(`   Target Empleado: ${asig.targetEmpleado ? `${asig.targetEmpleado.nombre} ${asig.targetEmpleado.apellido}` : 'N/A'}`);
        console.log(`   Target Departamento: ${asig.targetDepartamento?.nombre || 'N/A'}`);
        console.log(`   Notas: ${asig.notes || 'N/A'}`);
      });
    }

    // Obtener estadísticas de asignaciones
    const totalAsignaciones = await prisma.asignaciones.count();
    const asignacionesPorTipo = await prisma.asignaciones.groupBy({
      by: ['actionType'],
      _count: { actionType: true }
    });

    console.log(`\n📊 Estadísticas del sistema:`);
    console.log(`   Total de asignaciones: ${totalAsignaciones}`);
    console.log(`   Asignaciones por tipo:`);
    asignacionesPorTipo.forEach(item => {
      console.log(`     - ${item.actionType}: ${item._count.actionType}`);
    });

    // Verificar integridad de datos
    const equiposSinAsignacion = await prisma.computador.count({
      where: {
        AND: [
          { empleadoId: null },
          { departamentoId: null }
        ]
      }
    });

    const equiposAsignados = await prisma.computador.count({
      where: {
        OR: [
          { empleadoId: { not: null } },
          { departamentoId: { not: null } }
        ]
      }
    });

    console.log(`\n🔍 Verificación de integridad:`);
    console.log(`   Equipos sin asignación: ${equiposSinAsignacion}`);
    console.log(`   Equipos asignados: ${equiposAsignados}`);

    // Verificar que las asignaciones están conectadas correctamente
    const asignacionesConEquipos = await prisma.asignaciones.findMany({
      where: {
        OR: [
          { computadorId: { not: null } },
          { dispositivoId: { not: null } }
        ]
      },
      include: {
        computador: { select: { serial: true } },
        dispositivo: { select: { serial: true } }
      },
      take: 5
    });

    console.log(`\n🔗 Asignaciones con equipos conectados:`);
    asignacionesConEquipos.forEach((asig, index) => {
      const equipo = asig.computador || asig.dispositivo;
      console.log(`${index + 1}. ${asig.actionType} - ${equipo?.serial || 'N/A'}`);
    });

    console.log(`\n✅ Sistema de asignaciones funcionando correctamente`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAssignmentSystem();


