import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Verificando integridad de datos...\n');

    // 1. Verificar MacBook Pro específicamente
    console.log('🍎 Verificando MacBook Pro...');
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
      console.log(`  📱 Serial: ${macbook.serial}`);
      console.log(`  🏷️ Modelo: ${macbook.modelo.marca.nombre} ${macbook.modelo.nombre}`);
      console.log(`  👤 Asignado a: ${macbook.empleado?.nombre || 'Sin asignar'} ${macbook.empleado?.apellido || ''}`);
      console.log(`  🏢 Departamento: ${macbook.departamento?.nombre || 'Sin departamento'}`);
      console.log(`  🏢 Empresa: ${macbook.departamento?.empresa?.nombre || 'Sin empresa'}`);
      console.log(`  📍 Ubicación: ${macbook.ubicacion?.nombre || 'Sin ubicación'}`);
      console.log(`  📊 Estado: ${macbook.estado}`);
    } else {
      console.log('  ❌ No se encontró MacBook Pro');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Verificar todos los computadores asignados
    console.log('💻 Verificando computadores asignados...');
    const computadoresAsignados = await prisma.computador.findMany({
      where: {
        empleadoId: {
          not: null
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

    console.log(`  📊 Total computadores asignados: ${computadoresAsignados.length}`);
    
    computadoresAsignados.forEach((comp, index) => {
      console.log(`  ${index + 1}. ${comp.modelo.marca.nombre} ${comp.modelo.nombre} (${comp.serial})`);
      console.log(`     👤 Empleado: ${comp.empleado?.nombre || 'Sin empleado'} ${comp.empleado?.apellido || ''}`);
      console.log(`     🏢 Empresa: ${comp.departamento?.empresa?.nombre || 'Sin empresa'}`);
      console.log(`     📍 Ubicación: ${comp.ubicacion?.nombre || 'Sin ubicación'}`);
      console.log(`     📊 Estado: ${comp.estado}`);
      console.log('');
    });

    console.log('\n' + '='.repeat(60) + '\n');

    // 3. Verificar dispositivos asignados
    console.log('📱 Verificando dispositivos asignados...');
    const dispositivosAsignados = await prisma.dispositivo.findMany({
      where: {
        empleadoId: {
          not: null
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

    console.log(`  📊 Total dispositivos asignados: ${dispositivosAsignados.length}`);
    
    dispositivosAsignados.forEach((disp, index) => {
      console.log(`  ${index + 1}. ${disp.modelo.marca.nombre} ${disp.modelo.nombre} (${disp.serial})`);
      console.log(`     👤 Empleado: ${disp.empleado?.nombre || 'Sin empleado'} ${disp.empleado?.apellido || ''}`);
      console.log(`     🏢 Empresa: ${disp.departamento?.empresa?.nombre || 'Sin empresa'}`);
      console.log(`     📍 Ubicación: ${disp.ubicacion?.nombre || 'Sin ubicación'}`);
      console.log(`     📊 Estado: ${disp.estado}`);
      console.log('');
    });

    console.log('\n' + '='.repeat(60) + '\n');

    // 4. Verificar modelos y sus estadísticas
    console.log('📊 Verificando estadísticas de modelos...');
    const modelos = await prisma.modeloDispositivo.findMany({
      include: {
        marca: true,
        computadores: {
          include: {
            empleado: true,
            departamento: {
              include: {
                empresa: true
              }
            },
            ubicacion: true
          }
        },
        dispositivos: {
          include: {
            empleado: true,
            departamento: {
              include: {
                empresa: true
              }
            },
            ubicacion: true
          }
        }
      }
    });

    modelos.forEach((modelo, index) => {
      const totalComputadores = modelo.computadores.length;
      const totalDispositivos = modelo.dispositivos.length;
      const totalEquipos = totalComputadores + totalDispositivos;
      
      console.log(`  ${index + 1}. ${modelo.marca.nombre} ${modelo.nombre}`);
      console.log(`     💻 Computadores: ${totalComputadores}`);
      console.log(`     📱 Dispositivos: ${totalDispositivos}`);
      console.log(`     📊 Total: ${totalEquipos}`);
      
      // Verificar asignaciones
      const computadoresAsignados = modelo.computadores.filter(c => c.empleadoId);
      const dispositivosAsignados = modelo.dispositivos.filter(d => d.empleadoId);
      
      console.log(`     👤 Computadores asignados: ${computadoresAsignados.length}`);
      console.log(`     👤 Dispositivos asignados: ${dispositivosAsignados.length}`);
      
      // Verificar ubicaciones
      const ubicacionesComputadores = [...new Set(modelo.computadores.map(c => c.ubicacion?.nombre).filter(Boolean))];
      const ubicacionesDispositivos = [...new Set(modelo.dispositivos.map(d => d.ubicacion?.nombre).filter(Boolean))];
      const todasUbicaciones = [...new Set([...ubicacionesComputadores, ...ubicacionesDispositivos])];
      
      console.log(`     📍 Ubicaciones: ${todasUbicaciones.length > 0 ? todasUbicaciones.join(', ') : 'Sin ubicación'}`);
      console.log('');
    });

    console.log('\n' + '='.repeat(60) + '\n');

    // 5. Verificar problemas de integridad
    console.log('⚠️ Verificando problemas de integridad...');
    
    // Computadores sin empleado pero con estado "Asignado"
    const computadoresSinEmpleado = await prisma.computador.findMany({
      where: {
        empleadoId: null,
        estado: 'Asignado'
      }
    });
    
    if (computadoresSinEmpleado.length > 0) {
      console.log(`  ❌ Computadores con estado "Asignado" pero sin empleado: ${computadoresSinEmpleado.length}`);
      computadoresSinEmpleado.forEach(comp => {
        console.log(`     - ${comp.serial} (${comp.estado})`);
      });
    }

    // Dispositivos sin empleado pero con estado "Asignado"
    const dispositivosSinEmpleado = await prisma.dispositivo.findMany({
      where: {
        empleadoId: null,
        estado: 'Asignado'
      }
    });
    
    if (dispositivosSinEmpleado.length > 0) {
      console.log(`  ❌ Dispositivos con estado "Asignado" pero sin empleado: ${dispositivosSinEmpleado.length}`);
      dispositivosSinEmpleado.forEach(disp => {
        console.log(`     - ${disp.serial} (${disp.estado})`);
      });
    }

    // Equipos sin ubicación
    const equiposSinUbicacion = await prisma.computador.count({
      where: {
        ubicacionId: null
      }
    }) + await prisma.dispositivo.count({
      where: {
        ubicacionId: null
      }
    });
    
    console.log(`  ⚠️ Equipos sin ubicación: ${equiposSinUbicacion}`);

    console.log('\n✅ Verificación de integridad completada');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
