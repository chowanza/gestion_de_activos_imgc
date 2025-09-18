import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDellAssignment() {
  try {
    console.log('🔧 Corrigiendo asignación del Dell Latitude 5520...\n');

    // Buscar el computador Dell
    const dell = await prisma.computador.findFirst({
      where: {
        serial: 'DELL-003-2024'
      }
    });

    if (!dell) {
      console.log('❌ No se encontró el computador Dell');
      return;
    }

    console.log(`💻 Computador encontrado: ${dell.serial}`);
    console.log(`   Estado actual: ${dell.estado}`);
    console.log(`   Empleado ID actual: ${dell.empleadoId || 'No asignado'}`);
    console.log(`   Departamento ID actual: ${dell.departamentoId || 'No asignado'}\n`);

    // Buscar la última asignación activa
    const ultimaAsignacion = await prisma.asignaciones.findFirst({
      where: {
        computadorId: dell.id,
        actionType: 'Asignacion'
      },
      include: {
        targetEmpleado: {
          include: {
            departamento: {
              include: {
                empresa: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    if (!ultimaAsignacion || !ultimaAsignacion.targetEmpleado) {
      console.log('❌ No se encontró una asignación activa válida');
      return;
    }

    const empleado = ultimaAsignacion.targetEmpleado;
    console.log(`👤 Empleado asignado: ${empleado.nombre} ${empleado.apellido}`);
    console.log(`   ID: ${empleado.id}`);
    console.log(`   Departamento: ${empleado.departamento.nombre}`);
    console.log(`   Empresa: ${empleado.departamento.empresa.nombre}\n`);

    // Actualizar el computador con la información correcta
    console.log('🔄 Actualizando computador...');
    const computadorActualizado = await prisma.computador.update({
      where: {
        id: dell.id
      },
      data: {
        empleadoId: empleado.id,
        departamentoId: empleado.departamentoId
      }
    });

    console.log('✅ Computador actualizado exitosamente:');
    console.log(`   Empleado ID: ${computadorActualizado.empleadoId}`);
    console.log(`   Departamento ID: ${computadorActualizado.departamentoId}`);

    // Verificar que ahora tiene empresa
    const computadorVerificado = await prisma.computador.findUnique({
      where: {
        id: dell.id
      },
      include: {
        empleado: {
          include: {
            departamento: {
              include: {
                empresa: true
              }
            }
          }
        },
        departamento: {
          include: {
            empresa: true
          }
        }
      }
    });

    const empresaViaEmpleado = computadorVerificado?.empleado?.departamento?.empresa?.nombre;
    const empresaViaDepartamento = computadorVerificado?.departamento?.empresa?.nombre;
    const tieneEmpresa = empresaViaEmpleado || empresaViaDepartamento;

    console.log(`\n🎯 VERIFICACIÓN FINAL:`);
    console.log(`   Empresa (via empleado): ${empresaViaEmpleado || 'N/A'}`);
    console.log(`   Empresa (via depto): ${empresaViaDepartamento || 'N/A'}`);
    console.log(`   ✅ Tiene empresa: ${tieneEmpresa ? 'SÍ' : 'NO'}`);

    if (tieneEmpresa) {
      console.log(`\n🎉 ¡Problema resuelto! El computador Dell ahora está correctamente relacionado con la empresa ${tieneEmpresa}`);
    } else {
      console.log(`\n❌ Aún hay un problema con la relación a la empresa`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDellAssignment();



