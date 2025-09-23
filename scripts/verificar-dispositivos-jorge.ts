import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarDispositivosJorge() {
  console.log('🔍 Verificando dispositivos asignados a Jorge Rodríguez...\n');

  try {
    // 1. Encontrar a Jorge Rodríguez
    const jorgeRodriguez = await prisma.empleado.findFirst({
      where: {
        OR: [
          { nombre: { contains: 'Jorge' } },
          { apellido: { contains: 'Rodriguez' } }
        ]
      }
    });

    if (!jorgeRodriguez) {
      console.log('❌ No se encontró empleado con nombre Jorge Rodríguez');
      return;
    }

    console.log(`👤 Empleado encontrado:`);
    console.log(`   - ID: ${jorgeRodriguez.id}`);
    console.log(`   - Nombre: ${jorgeRodriguez.nombre} ${jorgeRodriguez.apellido}`);
    console.log('');

    // 2. Buscar dispositivos asignados a Jorge
    const dispositivosJorge = await prisma.dispositivo.findMany({
      where: {
        empleadoId: jorgeRodriguez.id
      },
      include: {
        modelo: {
          include: {
            marca: true
          }
        }
      }
    });

    // 3. Buscar computadores asignados a Jorge
    const computadoresJorge = await prisma.computador.findMany({
      where: {
        empleadoId: jorgeRodriguez.id
      },
      include: {
        modelo: {
          include: {
            marca: true
          }
        }
      }
    });

    console.log(`📊 Equipos asignados a Jorge Rodríguez:`);
    console.log(`   - Dispositivos: ${dispositivosJorge.length}`);
    console.log(`   - Computadores: ${computadoresJorge.length}\n`);

    if (dispositivosJorge.length > 0) {
      console.log('📱 DISPOSITIVOS ASIGNADOS:');
      dispositivosJorge.forEach((disp, index) => {
        console.log(`   ${index + 1}. Serial: ${disp.serial}`);
        console.log(`      Estado: ${disp.estado}`);
        console.log(`      Modelo: ${disp.modelo.marca.nombre} ${disp.modelo.nombre}`);
        console.log(`      Código IMGC: ${disp.codigoImgc || 'N/A'}`);
        console.log(`      ⚠️  ${disp.estado === 'OPERATIVO' ? 'INCONSISTENTE - OPERATIVO pero asignado' : 'Estado correcto'}`);
        console.log('');
      });
    }

    if (computadoresJorge.length > 0) {
      console.log('💻 COMPUTADORES ASIGNADOS:');
      computadoresJorge.forEach((comp, index) => {
        console.log(`   ${index + 1}. Serial: ${comp.serial}`);
        console.log(`      Estado: ${comp.estado}`);
        console.log(`      Modelo: ${comp.modelo.marca.nombre} ${comp.modelo.nombre}`);
        console.log(`      Código IMGC: ${comp.codigoImgc || 'N/A'}`);
        console.log(`      ⚠️  ${comp.estado === 'OPERATIVO' ? 'INCONSISTENTE - OPERATIVO pero asignado' : 'Estado correcto'}`);
        console.log('');
      });
    }

    // 4. Buscar todos los equipos con estado OPERATIVO que tengan empleadoId
    console.log('🔍 VERIFICACIÓN GENERAL:');
    
    const dispositivosOperativosAsignados = await prisma.dispositivo.findMany({
      where: {
        estado: 'OPERATIVO',
        empleadoId: { not: null }
      },
      include: {
        empleado: {
          select: {
            nombre: true,
            apellido: true
          }
        },
        modelo: {
          include: {
            marca: true
          }
        }
      }
    });

    const computadoresOperativosAsignados = await prisma.computador.findMany({
      where: {
        estado: 'OPERATIVO',
        empleadoId: { not: null }
      },
      include: {
        empleado: {
          select: {
            nombre: true,
            apellido: true
          }
        },
        modelo: {
          include: {
            marca: true
          }
        }
      }
    });

    console.log(`   - Dispositivos OPERATIVOS con empleadoId: ${dispositivosOperativosAsignados.length}`);
    console.log(`   - Computadores OPERATIVOS con empleadoId: ${computadoresOperativosAsignados.length}`);

    if (dispositivosOperativosAsignados.length > 0) {
      console.log('\n📱 DISPOSITIVOS OPERATIVOS ASIGNADOS (INCONSISTENTES):');
      dispositivosOperativosAsignados.forEach(disp => {
        console.log(`   - Serial: ${disp.serial}`);
        console.log(`     Asignado a: ${disp.empleado?.nombre} ${disp.empleado?.apellido}`);
        console.log(`     Modelo: ${disp.modelo.marca.nombre} ${disp.modelo.nombre}`);
      });
    }

    if (computadoresOperativosAsignados.length > 0) {
      console.log('\n💻 COMPUTADORES OPERATIVOS ASIGNADOS (INCONSISTENTES):');
      computadoresOperativosAsignados.forEach(comp => {
        console.log(`   - Serial: ${comp.serial}`);
        console.log(`     Asignado a: ${comp.empleado?.nombre} ${comp.empleado?.apellido}`);
        console.log(`     Modelo: ${comp.modelo.marca.nombre} ${comp.modelo.nombre}`);
      });
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
verificarDispositivosJorge();
