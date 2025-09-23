import { PrismaClient } from '@prisma/client';
import { ESTADOS_EQUIPO } from '../src/lib/estados-equipo';

const prisma = new PrismaClient();

async function fixDispositivosOperativosAsignados() {
  console.log('🔍 Verificando dispositivos OPERATIVOS asignados incorrectamente...\n');

  try {
    // 1. Encontrar dispositivos con estado OPERATIVO pero asignados a empleados
    const dispositivosInconsistentes = await prisma.dispositivo.findMany({
      where: {
        estado: ESTADOS_EQUIPO.OPERATIVO,
        empleadoId: { not: null }
      },
      include: {
        empleado: {
          select: {
            id: true,
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

    // 2. Encontrar específicamente dispositivos asignados a Jorge Rodríguez
    const jorgeRodriguez = await prisma.empleado.findFirst({
      where: {
        nombre: 'Jorge',
        apellido: 'Rodriguez'
      }
    });

    let dispositivosJorge = [];
    if (jorgeRodriguez) {
      dispositivosJorge = await prisma.dispositivo.findMany({
        where: {
          empleadoId: jorgeRodriguez.id
        },
        include: {
          empleado: {
            select: {
              id: true,
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
    }

    console.log(`📊 Resultados encontrados:`);
    console.log(`   - Dispositivos OPERATIVOS asignados incorrectamente: ${dispositivosInconsistentes.length}`);
    console.log(`   - Dispositivos asignados a Jorge Rodríguez: ${dispositivosJorge.length}\n`);

    if (dispositivosInconsistentes.length > 0) {
      console.log('📱 DISPOSITIVOS OPERATIVOS ASIGNADOS INCORRECTAMENTE:');
      dispositivosInconsistentes.forEach(disp => {
        console.log(`   - Serial: ${disp.serial}`);
        console.log(`     Estado: ${disp.estado}`);
        console.log(`     Asignado a: ${disp.empleado?.nombre} ${disp.empleado?.apellido}`);
        console.log(`     Modelo: ${disp.modelo.marca.nombre} ${disp.modelo.nombre}`);
        console.log('');
      });
    }

    if (dispositivosJorge.length > 0) {
      console.log('👤 DISPOSITIVOS ASIGNADOS A JORGE RODRÍGUEZ:');
      dispositivosJorge.forEach(disp => {
        console.log(`   - Serial: ${disp.serial}`);
        console.log(`     Estado: ${disp.estado}`);
        console.log(`     Asignado a: ${disp.empleado?.nombre} ${disp.empleado?.apellido}`);
        console.log(`     Modelo: ${disp.modelo.marca.nombre} ${disp.modelo.nombre}`);
        console.log(`     ⚠️  ${disp.estado === ESTADOS_EQUIPO.OPERATIVO ? 'INCONSISTENTE - OPERATIVO pero asignado' : 'Estado correcto'}`);
        console.log('');
      });
    }

    // 3. Aplicar corrección masiva
    if (dispositivosInconsistentes.length > 0) {
      console.log('🔧 APLICANDO CORRECCIÓN MASIVA...');
      
      const dispositivosIds = dispositivosInconsistentes.map(d => d.id);
      const resultadoDispositivos = await prisma.dispositivo.updateMany({
        where: {
          id: { in: dispositivosIds },
          estado: ESTADOS_EQUIPO.OPERATIVO,
          empleadoId: { not: null }
        },
        data: {
          estado: ESTADOS_EQUIPO.ASIGNADO
        }
      });
      
      console.log(`✅ ${resultadoDispositivos.count} dispositivos corregidos de OPERATIVO a ASIGNADO`);
    }

    // 4. Verificar computadores también por si acaso
    const computadoresInconsistentes = await prisma.computador.findMany({
      where: {
        estado: ESTADOS_EQUIPO.OPERATIVO,
        empleadoId: { not: null }
      },
      include: {
        empleado: {
          select: {
            id: true,
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

    if (computadoresInconsistentes.length > 0) {
      console.log('\n💻 COMPUTADORES OPERATIVOS ASIGNADOS INCORRECTAMENTE:');
      computadoresInconsistentes.forEach(comp => {
        console.log(`   - Serial: ${comp.serial}`);
        console.log(`     Estado: ${comp.estado}`);
        console.log(`     Asignado a: ${comp.empleado?.nombre} ${comp.empleado?.apellido}`);
        console.log(`     Modelo: ${comp.modelo.marca.nombre} ${comp.modelo.nombre}`);
        console.log('');
      });

      console.log('🔧 CORRIGIENDO COMPUTADORES...');
      const computadoresIds = computadoresInconsistentes.map(c => c.id);
      const resultadoComputadores = await prisma.computador.updateMany({
        where: {
          id: { in: computadoresIds },
          estado: ESTADOS_EQUIPO.OPERATIVO,
          empleadoId: { not: null }
        },
        data: {
          estado: ESTADOS_EQUIPO.ASIGNADO
        }
      });
      
      console.log(`✅ ${resultadoComputadores.count} computadores corregidos de OPERATIVO a ASIGNADO`);
    }

    console.log('\n🎉 Corrección completada exitosamente!');

    // 5. Verificación final
    console.log('\n🔍 VERIFICACIÓN FINAL:');
    const dispositivosFinal = await prisma.dispositivo.findMany({
      where: {
        estado: ESTADOS_EQUIPO.OPERATIVO,
        empleadoId: { not: null }
      }
    });
    
    const computadoresFinal = await prisma.computador.findMany({
      where: {
        estado: ESTADOS_EQUIPO.OPERATIVO,
        empleadoId: { not: null }
      }
    });

    console.log(`   - Dispositivos OPERATIVOS con empleadoId: ${dispositivosFinal.length}`);
    console.log(`   - Computadores OPERATIVOS con empleadoId: ${computadoresFinal.length}`);
    
    if (dispositivosFinal.length === 0 && computadoresFinal.length === 0) {
      console.log('✅ ¡Todas las inconsistencias han sido corregidas!');
    }

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
fixDispositivosOperativosAsignados();
