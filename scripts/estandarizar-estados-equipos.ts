import { PrismaClient } from '@prisma/client';
import { ESTADOS_EQUIPO } from '../src/lib/estados-equipo';

const prisma = new PrismaClient();

async function estandarizarEstadosEquipos() {
  console.log('🔍 Estandarizando estados de equipos a los nuevos valores...\n');

  try {
    // Mapeo de estados antiguos a nuevos
    const mapeoEstados = {
      'Asignado': ESTADOS_EQUIPO.ASIGNADO,
      'Operativo': ESTADOS_EQUIPO.OPERATIVO,
      'De baja': ESTADOS_EQUIPO.DE_BAJA,
      'Resguardo': ESTADOS_EQUIPO.EN_RESGUARDO,
      'Mantenimiento': ESTADOS_EQUIPO.EN_MANTENIMIENTO,
      'En reparación': ESTADOS_EQUIPO.EN_MANTENIMIENTO,
      'En mantenimiento': ESTADOS_EQUIPO.EN_MANTENIMIENTO,
      'En resguardo': ESTADOS_EQUIPO.EN_RESGUARDO
    };

    console.log('📊 Estados a estandarizar:');
    Object.entries(mapeoEstados).forEach(([viejo, nuevo]) => {
      console.log(`   "${viejo}" → "${nuevo}"`);
    });
    console.log('');

    // 1. Estandarizar computadores
    console.log('💻 ESTANDARIZANDO COMPUTADORES...');
    
    for (const [estadoViejo, estadoNuevo] of Object.entries(mapeoEstados)) {
      const computadoresActualizados = await prisma.computador.updateMany({
        where: {
          estado: estadoViejo
        },
        data: {
          estado: estadoNuevo
        }
      });
      
      if (computadoresActualizados.count > 0) {
        console.log(`   ✅ ${computadoresActualizados.count} computadores: "${estadoViejo}" → "${estadoNuevo}"`);
      }
    }

    // 2. Estandarizar dispositivos
    console.log('\n📱 ESTANDARIZANDO DISPOSITIVOS...');
    
    for (const [estadoViejo, estadoNuevo] of Object.entries(mapeoEstados)) {
      const dispositivosActualizados = await prisma.dispositivo.updateMany({
        where: {
          estado: estadoViejo
        },
        data: {
          estado: estadoNuevo
        }
      });
      
      if (dispositivosActualizados.count > 0) {
        console.log(`   ✅ ${dispositivosActualizados.count} dispositivos: "${estadoViejo}" → "${estadoNuevo}"`);
      }
    }

    // 3. Verificar resultado final
    console.log('\n🔍 VERIFICACIÓN FINAL:');
    
    const estadosComputadores = await prisma.computador.groupBy({
      by: ['estado'],
      _count: {
        estado: true
      }
    });

    const estadosDispositivos = await prisma.dispositivo.groupBy({
      by: ['estado'],
      _count: {
        estado: true
      }
    });

    console.log('💻 Estados de computadores:');
    estadosComputadores.forEach(estado => {
      console.log(`   - ${estado.estado}: ${estado._count.estado} equipos`);
    });

    console.log('\n📱 Estados de dispositivos:');
    estadosDispositivos.forEach(estado => {
      console.log(`   - ${estado.estado}: ${estado._count.estado} equipos`);
    });

    // 4. Verificar inconsistencias restantes
    console.log('\n🔍 VERIFICANDO INCONSISTENCIAS:');
    
    const computadoresInconsistentes = await prisma.computador.findMany({
      where: {
        estado: ESTADOS_EQUIPO.OPERATIVO,
        empleadoId: { not: null }
      },
      include: {
        empleado: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    const dispositivosInconsistentes = await prisma.dispositivo.findMany({
      where: {
        estado: ESTADOS_EQUIPO.OPERATIVO,
        empleadoId: { not: null }
      },
      include: {
        empleado: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    console.log(`   - Computadores OPERATIVOS con empleadoId: ${computadoresInconsistentes.length}`);
    console.log(`   - Dispositivos OPERATIVOS con empleadoId: ${dispositivosInconsistentes.length}`);

    if (computadoresInconsistentes.length > 0 || dispositivosInconsistentes.length > 0) {
      console.log('\n⚠️  INCONSISTENCIAS DETECTADAS:');
      
      if (computadoresInconsistentes.length > 0) {
        console.log('💻 Computadores OPERATIVOS asignados:');
        computadoresInconsistentes.forEach(comp => {
          console.log(`   - ${comp.serial} asignado a ${comp.empleado?.nombre} ${comp.empleado?.apellido}`);
        });
      }
      
      if (dispositivosInconsistentes.length > 0) {
        console.log('📱 Dispositivos OPERATIVOS asignados:');
        dispositivosInconsistentes.forEach(disp => {
          console.log(`   - ${disp.serial} asignado a ${disp.empleado?.nombre} ${disp.empleado?.apellido}`);
        });
      }
    } else {
      console.log('✅ No se encontraron inconsistencias!');
    }

    console.log('\n🎉 Estandarización completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la estandarización:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
estandarizarEstadosEquipos();
