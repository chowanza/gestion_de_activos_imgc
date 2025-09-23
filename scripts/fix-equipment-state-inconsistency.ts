import { PrismaClient } from '@prisma/client';
import { ESTADOS_EQUIPO } from '../src/lib/estados-equipo';

const prisma = new PrismaClient();

async function fixEquipmentStateInconsistency() {
  console.log('🔍 Verificando inconsistencias entre estado y asignación de equipos...\n');

  try {
    // 1. Encontrar computadores con estado OPERATIVO pero asignados a empleados
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

    // 2. Encontrar dispositivos con estado OPERATIVO pero asignados a empleados
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

    console.log(`📊 Resultados encontrados:`);
    console.log(`   - Computadores inconsistentes: ${computadoresInconsistentes.length}`);
    console.log(`   - Dispositivos inconsistentes: ${dispositivosInconsistentes.length}\n`);

    if (computadoresInconsistentes.length > 0) {
      console.log('💻 COMPUTADORES INCONSISTENTES:');
      computadoresInconsistentes.forEach(comp => {
        console.log(`   - Serial: ${comp.serial}`);
        console.log(`     Estado: ${comp.estado}`);
        console.log(`     Asignado a: ${comp.empleado?.nombre} ${comp.empleado?.apellido}`);
        console.log(`     Modelo: ${comp.modelo.marca.nombre} ${comp.modelo.nombre}`);
        console.log('');
      });
    }

    if (dispositivosInconsistentes.length > 0) {
      console.log('📱 DISPOSITIVOS INCONSISTENTES:');
      dispositivosInconsistentes.forEach(disp => {
        console.log(`   - Serial: ${disp.serial}`);
        console.log(`     Estado: ${disp.estado}`);
        console.log(`     Asignado a: ${disp.empleado?.nombre} ${disp.empleado?.apellido}`);
        console.log(`     Modelo: ${disp.modelo.marca.nombre} ${disp.modelo.nombre}`);
        console.log('');
      });
    }

    // 3. Buscar específicamente el computador con serial 4567879
    const computadorEspecifico = await prisma.computador.findFirst({
      where: {
        serial: '4567879'
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

    if (computadorEspecifico) {
      console.log('🎯 COMPUTADOR ESPECÍFICO (Serial: 4567879):');
      console.log(`   - ID: ${computadorEspecifico.id}`);
      console.log(`   - Estado: ${computadorEspecifico.estado}`);
      console.log(`   - EmpleadoId: ${computadorEspecifico.empleadoId}`);
      console.log(`   - Asignado a: ${computadorEspecifico.empleado?.nombre || 'N/A'} ${computadorEspecifico.empleado?.apellido || 'N/A'}`);
      console.log(`   - Modelo: ${computadorEspecifico.modelo.marca.nombre} ${computadorEspecifico.modelo.nombre}`);
      console.log('');

      // 4. Preguntar si se debe corregir
      if (computadorEspecifico.estado === ESTADOS_EQUIPO.OPERATIVO && computadorEspecifico.empleadoId) {
        console.log('⚠️  INCONSISTENCIA DETECTADA:');
        console.log('   El computador está marcado como OPERATIVO pero tiene empleadoId asignado.');
        console.log('');
        console.log('🔧 OPCIONES DE CORRECCIÓN:');
        console.log('   1. Cambiar estado a ASIGNADO (mantener asignación)');
        console.log('   2. Remover empleadoId (mantener estado OPERATIVO)');
        console.log('   3. No hacer cambios');
        console.log('');

        // Por ahora, vamos a aplicar la corrección automática más lógica
        // Si está OPERATIVO pero asignado, debería estar ASIGNADO
        console.log('🔧 APLICANDO CORRECCIÓN AUTOMÁTICA...');
        
        const equipoActualizado = await prisma.computador.update({
          where: { id: computadorEspecifico.id },
          data: {
            estado: ESTADOS_EQUIPO.ASIGNADO
          }
        });

        console.log(`✅ Computador ${computadorEspecifico.serial} actualizado:`);
        console.log(`   - Estado anterior: ${computadorEspecifico.estado}`);
        console.log(`   - Estado nuevo: ${equipoActualizado.estado}`);
        console.log(`   - Asignación mantenida: ${equipoActualizado.empleadoId ? 'Sí' : 'No'}`);
      }
    } else {
      console.log('❌ No se encontró computador con serial 4567879');
    }

    // 5. Aplicar corrección masiva a todos los equipos inconsistentes
    console.log('\n🔧 APLICANDO CORRECCIÓN MASIVA...');
    
    // Corregir computadores
    if (computadoresInconsistentes.length > 0) {
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
      console.log(`✅ ${resultadoComputadores.count} computadores corregidos`);
    }

    // Corregir dispositivos
    if (dispositivosInconsistentes.length > 0) {
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
      console.log(`✅ ${resultadoDispositivos.count} dispositivos corregidos`);
    }

    console.log('\n🎉 Corrección completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
fixEquipmentStateInconsistency();
