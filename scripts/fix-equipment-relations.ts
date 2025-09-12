import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔧 Corrigiendo relaciones de equipos...\n');

    // 1. Corregir computadores
    console.log('💻 Corrigiendo computadores...');
    const computadoresAsignados = await prisma.computador.findMany({
      where: {
        empleadoId: {
          not: null
        }
      },
      include: {
        empleado: {
          include: {
            departamento: true
          }
        }
      }
    });

    let computadoresCorregidos = 0;
    for (const computador of computadoresAsignados) {
      if (computador.empleado?.departamentoId) {
        await prisma.computador.update({
          where: { id: computador.id },
          data: {
            departamentoId: computador.empleado.departamentoId
          }
        });
        computadoresCorregidos++;
        console.log(`  ✅ ${computador.serial}: departamentoId = ${computador.empleado.departamentoId}`);
      }
    }

    console.log(`  📊 Computadores corregidos: ${computadoresCorregidos}\n`);

    // 2. Corregir dispositivos
    console.log('📱 Corrigiendo dispositivos...');
    const dispositivosAsignados = await prisma.dispositivo.findMany({
      where: {
        empleadoId: {
          not: null
        }
      },
      include: {
        empleado: {
          include: {
            departamento: true
          }
        }
      }
    });

    let dispositivosCorregidos = 0;
    for (const dispositivo of dispositivosAsignados) {
      if (dispositivo.empleado?.departamentoId) {
        await prisma.dispositivo.update({
          where: { id: dispositivo.id },
          data: {
            departamentoId: dispositivo.empleado.departamentoId
          }
        });
        dispositivosCorregidos++;
        console.log(`  ✅ ${dispositivo.serial}: departamentoId = ${dispositivo.empleado.departamentoId}`);
      }
    }

    console.log(`  📊 Dispositivos corregidos: ${dispositivosCorregidos}\n`);

    // 3. Asignar ubicaciones aleatorias
    console.log('📍 Asignando ubicaciones aleatorias...');
    const ubicaciones = await prisma.ubicacion.findMany();
    
    if (ubicaciones.length > 0) {
      // Actualizar computadores
      const computadoresSinUbicacion = await prisma.computador.findMany({
        where: {
          ubicacionId: null
        }
      });

      let computadoresConUbicacion = 0;
      for (const computador of computadoresSinUbicacion) {
        const ubicacionAleatoria = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
        await prisma.computador.update({
          where: { id: computador.id },
          data: {
            ubicacionId: ubicacionAleatoria.id
          }
        });
        computadoresConUbicacion++;
        console.log(`  ✅ ${computador.serial}: ubicación = ${ubicacionAleatoria.nombre}`);
      }

      // Actualizar dispositivos
      const dispositivosSinUbicacion = await prisma.dispositivo.findMany({
        where: {
          ubicacionId: null
        }
      });

      let dispositivosConUbicacion = 0;
      for (const dispositivo of dispositivosSinUbicacion) {
        const ubicacionAleatoria = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
        await prisma.dispositivo.update({
          where: { id: dispositivo.id },
          data: {
            ubicacionId: ubicacionAleatoria.id
          }
        });
        dispositivosConUbicacion++;
        console.log(`  ✅ ${dispositivo.serial}: ubicación = ${ubicacionAleatoria.nombre}`);
      }

      console.log(`  📊 Computadores con ubicación: ${computadoresConUbicacion}`);
      console.log(`  📊 Dispositivos con ubicación: ${dispositivosConUbicacion}\n`);
    }

    // 4. Verificar resultado final
    console.log('🔍 Verificando resultado final...');
    const macbook = await prisma.computador.findFirst({
      where: {
        modelo: {
          nombre: {
            contains: 'MacBook'
          }
        }
      },
      include: {
        modelo: {
          include: {
            marca: true
          }
        },
        empleado: true,
        departamento: {
          include: {
            empresa: true
          }
        },
        ubicacion: true
      }
    });

    if (macbook) {
      console.log(`\n🍎 MacBook Pro (${macbook.serial}):`);
      console.log(`  👤 Asignado a: ${macbook.empleado?.nombre || 'Sin asignar'} ${macbook.empleado?.apellido || ''}`);
      console.log(`  🏢 Empresa: ${macbook.departamento?.empresa?.nombre || 'Sin empresa'}`);
      console.log(`  🏢 Departamento: ${macbook.departamento?.nombre || 'Sin departamento'}`);
      console.log(`  📍 Ubicación: ${macbook.ubicacion?.nombre || 'Sin ubicación'}`);
      console.log(`  📊 Estado: ${macbook.estado}`);
    }

    console.log('\n✅ Corrección de relaciones completada');

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
