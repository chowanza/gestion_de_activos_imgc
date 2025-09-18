import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCompanyDisplay() {
  try {
    console.log('🔍 Verificando que la información de empresa se muestre correctamente...\n');

    // Obtener el computador Dell que está en mantenimiento
    const dell = await prisma.computador.findFirst({
      where: {
        serial: 'DELL-003-2024'
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
        },
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

    console.log(`💻 Computador: ${dell.modelo.marca.nombre} ${dell.modelo.nombre} (${dell.serial})`);
    console.log(`   Estado: ${dell.estado}`);
    console.log(`   Empleado: ${dell.empleado ? `${dell.empleado.nombre} ${dell.empleado.apellido}` : 'No asignado'}`);
    console.log(`   Departamento: ${dell.departamento?.nombre || 'No asignado'}`);
    console.log(`   Empresa (via empleado): ${dell.empleado?.departamento?.empresa?.nombre || 'N/A'}`);
    console.log(`   Empresa (via depto): ${dell.departamento?.empresa?.nombre || 'N/A'}`);

    // Verificar lógica de la interfaz
    const tieneEmpleado = !!dell.empleado;
    const estadoEsAsignado = dell.estado === 'Asignado';
    const estadoEsMantenimiento = dell.estado === 'Mantenimiento';
    
    console.log(`\n🎯 LÓGICA DE LA INTERFAZ:`);
    console.log(`   Estado es 'Asignado': ${estadoEsAsignado}`);
    console.log(`   Estado es 'Mantenimiento': ${estadoEsMantenimiento}`);
    console.log(`   Tiene empleado: ${tieneEmpleado}`);
    console.log(`   Condición para mostrar empresa: ${estadoEsAsignado || (estadoEsMantenimiento && tieneEmpleado)}`);

    if (estadoEsAsignado || (estadoEsMantenimiento && tieneEmpleado)) {
      const empresaNombre = dell.empleado?.departamento?.empresa?.nombre || dell.departamento?.empresa?.nombre || 'N/A';
      console.log(`   ✅ Se mostrará la empresa: ${empresaNombre}`);
    } else {
      console.log(`   ❌ NO se mostrará la empresa`);
    }

    // Verificar que la API devuelve la información correcta
    console.log(`\n🔌 VERIFICACIÓN DE API:`);
    console.log(`   Estructura de datos que devuelve la API:`);
    console.log(`   - empleado.departamento.empresa.nombre: ${dell.empleado?.departamento?.empresa?.nombre || 'undefined'}`);
    console.log(`   - departamento.empresa.nombre: ${dell.departamento?.empresa?.nombre || 'undefined'}`);

    // Simular la lógica del frontend
    const departamentoTag = (
      (dell.estado === 'Asignado' || (dell.estado === 'Mantenimiento' && dell.empleado))
        ? (dell.departamento?.nombre || dell.empleado?.departamento?.nombre || '—')
        : '—'
    );

    const empresaNombre = dell.empleado?.departamento?.empresa?.nombre || dell.departamento?.empresa?.nombre || 'N/A';

    console.log(`\n📱 RESULTADO EN LA INTERFAZ:`);
    console.log(`   Departamento Tag: ${departamentoTag}`);
    console.log(`   Empresa: ${empresaNombre}`);

    if (empresaNombre !== 'N/A') {
      console.log(`\n🎉 ¡ÉXITO! La información de empresa se mostrará correctamente en la interfaz`);
    } else {
      console.log(`\n❌ PROBLEMA: La información de empresa no se está obteniendo correctamente`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCompanyDisplay();



