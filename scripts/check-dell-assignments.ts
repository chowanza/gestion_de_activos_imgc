import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDellAssignments() {
  try {
    console.log('🔍 Verificando asignaciones del Dell Latitude 5520...\n');

    // Buscar el computador Dell
    const dell = await prisma.computador.findFirst({
      where: {
        serial: 'DELL-003-2024'
      },
      include: {
        modelo: {
          include: {
            marca: true
          }
        }
      }
    });

    if (!dell) {
      console.log('❌ No se encontró el computador Dell');
      return;
    }

    console.log(`💻 Computador encontrado: ${dell.modelo.marca.nombre} ${dell.modelo.nombre}`);
    console.log(`   Serial: ${dell.serial}`);
    console.log(`   Estado: ${dell.estado}`);
    console.log(`   Empleado ID: ${dell.empleadoId || 'No asignado'}`);
    console.log(`   Departamento ID: ${dell.departamentoId || 'No asignado'}\n`);

    // Buscar asignaciones relacionadas con este computador
    const asignaciones = await prisma.asignaciones.findMany({
      where: {
        computadorId: dell.id
      },
      include: {
        targetEmpleado: true,
        targetDepartamento: {
          include: {
            empresa: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    console.log(`📋 Historial de asignaciones (${asignaciones.length} registros):`);
    if (asignaciones.length === 0) {
      console.log('   No hay asignaciones registradas para este computador');
    } else {
      asignaciones.forEach((asig, index) => {
        console.log(`\n${index + 1}. Fecha: ${asig.date.toISOString().split('T')[0]}`);
        console.log(`   Acción: ${asig.actionType}`);
        console.log(`   Motivo: ${asig.motivo || 'N/A'}`);
        console.log(`   Target Type: ${asig.targetType}`);
        console.log(`   Target Empleado: ${asig.targetEmpleado ? `${asig.targetEmpleado.nombre} ${asig.targetEmpleado.apellido}` : 'N/A'}`);
        console.log(`   Target Departamento: ${asig.targetDepartamento?.nombre || 'N/A'}`);
        console.log(`   Empresa: ${asig.targetDepartamento?.empresa?.nombre || 'N/A'}`);
        console.log(`   Notas: ${asig.notes || 'N/A'}`);
      });
    }

    // Buscar la última asignación activa
    const ultimaAsignacion = asignaciones.find(a => a.actionType === 'Asignacion');
    if (ultimaAsignacion) {
      console.log(`\n🎯 ÚLTIMA ASIGNACIÓN ACTIVA:`);
      console.log(`   Empleado: ${ultimaAsignacion.targetEmpleado ? `${ultimaAsignacion.targetEmpleado.nombre} ${ultimaAsignacion.targetEmpleado.apellido}` : 'N/A'}`);
      console.log(`   Departamento: ${ultimaAsignacion.targetDepartamento?.nombre || 'N/A'}`);
      console.log(`   Empresa: ${ultimaAsignacion.targetDepartamento?.empresa?.nombre || 'N/A'}`);
      
      if (ultimaAsignacion.targetEmpleado) {
        console.log(`\n👤 DATOS DEL EMPLEADO ASIGNADO:`);
        console.log(`   ID: ${ultimaAsignacion.targetEmpleado.id}`);
        console.log(`   Cédula: ${ultimaAsignacion.targetEmpleado.ced}`);
        console.log(`   Email: ${ultimaAsignacion.targetEmpleado.email || 'N/A'}`);
        console.log(`   Departamento ID: ${ultimaAsignacion.targetEmpleado.departamentoId || 'N/A'}`);
        console.log(`   Cargo ID: ${ultimaAsignacion.targetEmpleado.cargoId || 'N/A'}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDellAssignments();



