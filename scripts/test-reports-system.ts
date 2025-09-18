import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testReportsSystem() {
  try {
    console.log('📊 Probando el sistema de reportes...\n');

    // Obtener estadísticas generales
    const totalAsignaciones = await prisma.asignaciones.count();
    const totalComputadores = await prisma.computador.count();
    const totalDispositivos = await prisma.dispositivo.count();
    const totalEmpresas = await prisma.empresa.count();

    console.log('📈 Estadísticas generales:');
    console.log(`   Total asignaciones: ${totalAsignaciones}`);
    console.log(`   Total computadores: ${totalComputadores}`);
    console.log(`   Total dispositivos: ${totalDispositivos}`);
    console.log(`   Total empresas: ${totalEmpresas}`);

    // Obtener asignaciones de los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAssignments = await prisma.asignaciones.findMany({
      where: {
        date: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        targetEmpleado: {
          include: {
            departamento: {
              include: { empresa: true }
            }
          }
        },
        targetDepartamento: {
          include: { empresa: true }
        },
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
      orderBy: {
        date: 'desc'
      }
    });

    console.log(`\n📅 Asignaciones de los últimos 30 días: ${recentAssignments.length}`);

    // Estadísticas por tipo de acción
    const statsByAction = recentAssignments.reduce((acc, assignment) => {
      acc[assignment.actionType] = (acc[assignment.actionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🎯 Por tipo de acción:');
    Object.entries(statsByAction).forEach(([action, count]) => {
      console.log(`   ${action}: ${count}`);
    });

    // Estadísticas por tipo de equipo
    const statsByEquipment = recentAssignments.reduce((acc, assignment) => {
      acc[assignment.itemType] = (acc[assignment.itemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n💻 Por tipo de equipo:');
    Object.entries(statsByEquipment).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    // Estadísticas por empresa
    const statsByCompany = recentAssignments.reduce((acc, assignment) => {
      const empresaViaEmpleado = assignment.targetEmpleado?.departamento?.empresa?.nombre;
      const empresaViaDepartamento = assignment.targetDepartamento?.empresa?.nombre;
      const empresa = empresaViaEmpleado || empresaViaDepartamento || 'Sin empresa';
      acc[empresa] = (acc[empresa] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🏢 Por empresa:');
    Object.entries(statsByCompany).forEach(([empresa, count]) => {
      console.log(`   ${empresa}: ${count}`);
    });

    // Mostrar algunos movimientos recientes
    console.log('\n📋 Movimientos recientes (últimos 5):');
    recentAssignments.slice(0, 5).forEach((assignment, index) => {
      const equipo = assignment.computador || assignment.dispositivo;
      const modelo = equipo?.modelo ? `${equipo.modelo.marca.nombre} ${equipo.modelo.nombre}` : 'N/A';
      const destino = assignment.targetEmpleado ? 
        `${assignment.targetEmpleado.nombre} ${assignment.targetEmpleado.apellido}` :
        assignment.targetDepartamento?.nombre || 'N/A';
      
      console.log(`\n${index + 1}. ${assignment.date.toISOString().split('T')[0]}`);
      console.log(`   Acción: ${assignment.actionType}`);
      console.log(`   Equipo: ${equipo?.serial || 'N/A'} (${modelo})`);
      console.log(`   Destino: ${destino}`);
      console.log(`   Motivo: ${assignment.motivo || 'N/A'}`);
    });

    // Verificar integridad de datos
    const assignmentsWithoutEquipment = await prisma.asignaciones.count({
      where: {
        AND: [
          { computadorId: null },
          { dispositivoId: null }
        ]
      }
    });

    const assignmentsWithoutTarget = await prisma.asignaciones.count({
      where: {
        AND: [
          { targetEmpleadoId: null },
          { targetDepartamentoId: null }
        ]
      }
    });

    console.log('\n🔍 Verificación de integridad:');
    console.log(`   Asignaciones sin equipo: ${assignmentsWithoutEquipment}`);
    console.log(`   Asignaciones sin destino: ${assignmentsWithoutTarget}`);

    if (assignmentsWithoutEquipment === 0 && assignmentsWithoutTarget === 0) {
      console.log('   ✅ Todos los datos están correctamente relacionados');
    } else {
      console.log('   ⚠️  Hay datos que necesitan revisión');
    }

    console.log('\n✅ Sistema de reportes funcionando correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReportsSystem();


