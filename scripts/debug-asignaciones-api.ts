import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugAsignacionesAPI() {
  try {
    console.log('🔍 Debuggeando API de asignaciones...\n');

    const asignaciones = await prisma.asignaciones.findMany({
      orderBy: { date: 'desc' },
      include: {
        computador: {
          include: {
            modelo: {
              include: {
                marca: true
              }
            }
          }
        },
        dispositivo: {
          include: {
            modelo: {
              include: {
                marca: true
              }
            }
          }
        },
        targetEmpleado: true,
        targetDepartamento: true,
      },
    });

    console.log(`📊 Total de asignaciones: ${asignaciones.length}\n`);

    asignaciones.forEach((a, index) => {
      console.log(`\n${index + 1}. Asignación ID: ${a.id}`);
      console.log(`   Fecha: ${a.date.toISOString().split('T')[0]}`);
      console.log(`   Action Type: ${a.actionType}`);
      console.log(`   Target Type: ${a.targetType}`);
      console.log(`   Item Type: ${a.itemType}`);
      
      // Información del equipo
      if (a.itemType === 'Computador' && a.computador) {
        console.log(`   Equipo: ${a.computador.modelo.marca.nombre} ${a.computador.modelo.nombre} (${a.computador.serial})`);
      } else if (a.itemType === 'Dispositivo' && a.dispositivo) {
        console.log(`   Equipo: ${a.dispositivo.modelo.marca.nombre} ${a.dispositivo.modelo.nombre} (${a.dispositivo.serial})`);
      }

      // Información del destino
      if (a.targetType === 'Usuario' && a.targetEmpleado) {
        console.log(`   Asignado a: ${a.targetEmpleado.nombre} ${a.targetEmpleado.apellido}`);
      } else if (a.targetType === 'Departamento' && a.targetDepartamento) {
        console.log(`   Asignado a: ${a.targetDepartamento.nombre}`);
      } else {
        console.log(`   Asignado a: N/A`);
      }

      console.log(`   Gerente: ${a.gerente || 'N/A'}`);
      console.log(`   Motivo: ${a.motivo || 'N/A'}`);
    });

    // Simular el procesamiento de la API
    console.log('\n🔄 Procesando datos como lo hace la API...\n');

    const resultadoFinal = asignaciones.map((a) => {
      let itemAsignado;
      if (a.itemType === 'Computador' && a.computador) {
        itemAsignado = {
          id: a.computador.id,
          tipo: 'Computador',
          serial: a.computador.serial,
          descripcion: `${a.computador.modelo.marca.nombre} ${a.computador.modelo.nombre}`,
        };
      } else if (a.itemType === 'Dispositivo' && a.dispositivo) {
        itemAsignado = {
          id: a.dispositivo.id,
          tipo: 'Dispositivo',
          serial: a.dispositivo.serial,
          descripcion: `${a.dispositivo.modelo.marca.nombre} ${a.dispositivo.modelo.nombre}`,
        };
      }

      let asignadoA;
      if (a.targetType === 'Usuario' && a.targetEmpleado) {
        asignadoA = {
          id: a.targetEmpleado.id,
          tipo: 'Usuario',
          nombre: `${a.targetEmpleado.nombre} ${a.targetEmpleado.apellido}`,
        };
      } else if (a.targetType === 'Departamento' && a.targetDepartamento) {
        asignadoA = {
          id: a.targetDepartamento.id,
          tipo: 'Departamento',
          nombre: a.targetDepartamento.nombre,
        };
      }

      return {
        id: a.id,
        date: a.date,
        notes: a.notes,
        item: itemAsignado,
        asignadoA: asignadoA,
        gerente: a.gerente,
        serialC: a.serialC,
        modeloC: a.modeloC,
        motivo: a.motivo,
        localidad: a.localidad,
      };
    });

    console.log('📋 Datos procesados por la API:');
    resultadoFinal.forEach((item, index) => {
      console.log(`\n${index + 1}. ID: ${item.id}`);
      console.log(`   Item: ${item.item?.descripcion} (${item.item?.serial})`);
      console.log(`   Asignado A: ${item.asignadoA?.nombre || 'Sin asignar'}`);
      console.log(`   Tipo: ${item.asignadoA?.tipo || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAsignacionesAPI();


