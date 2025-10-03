import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function buscarJorgeRodriguez() {
  console.log('🔍 Buscando empleados con nombres similares a Jorge Rodríguez...\n');

  try {
    // Buscar todos los empleados que contengan "Jorge" en el nombre
    const empleadosJorge = await prisma.empleado.findMany({
      where: {
        nombre: { contains: 'Jorge' }
      },
      include: {
        computadores: {
          select: {
            serial: true,
            estado: true,
            codigoImgc: true,
            modelo: {
              include: {
                marca: true
              }
            }
          }
        },
        dispositivos: {
          select: {
            serial: true,
            estado: true,
            codigoImgc: true,
            modelo: {
              include: {
                marca: true
              }
            }
          }
        }
      }
    });

    // Buscar todos los empleados que contengan "Rodriguez" en el apellido
    const empleadosRodriguez = await prisma.empleado.findMany({
      where: {
        apellido: { contains: 'Rodriguez' }
      },
      include: {
        computadores: {
          select: {
            serial: true,
            estado: true,
            codigoImgc: true,
            modelo: {
              include: {
                marca: true
              }
            }
          }
        },
        dispositivos: {
          select: {
            serial: true,
            estado: true,
            codigoImgc: true,
            modelo: {
              include: {
                marca: true
              }
            }
          }
        }
      }
    });

    console.log(`👥 Empleados encontrados:`);
    console.log(`   - Con nombre "Jorge": ${empleadosJorge.length}`);
    console.log(`   - Con apellido "Rodriguez": ${empleadosRodriguez.length}\n`);

    if (empleadosJorge.length > 0) {
      console.log('👤 EMPLEADOS CON NOMBRE "JORGE":');
      empleadosJorge.forEach((emp, index) => {
        console.log(`   ${index + 1}. ${emp.nombre} ${emp.apellido} (ID: ${emp.id})`);
        console.log(`      Computadores: ${emp.computadores.length}`);
        console.log(`      Dispositivos: ${emp.dispositivos.length}`);
        
        if (emp.computadores.length > 0) {
          console.log(`      💻 Computadores:`);
          emp.computadores.forEach(comp => {
            console.log(`         - ${comp.serial} (${comp.estado}) - ${comp.modelo.marca.nombre} ${comp.modelo.nombre}`);
          });
        }
        
        if (emp.dispositivos.length > 0) {
          console.log(`      📱 Dispositivos:`);
          emp.dispositivos.forEach(disp => {
            console.log(`         - ${disp.serial} (${disp.estado}) - ${disp.modelo.marca.nombre} ${disp.modelo.nombre}`);
          });
        }
        console.log('');
      });
    }

    if (empleadosRodriguez.length > 0) {
      console.log('👤 EMPLEADOS CON APELLIDO "RODRIGUEZ":');
      empleadosRodriguez.forEach((emp, index) => {
        console.log(`   ${index + 1}. ${emp.nombre} ${emp.apellido} (ID: ${emp.id})`);
        console.log(`      Computadores: ${emp.computadores.length}`);
        console.log(`      Dispositivos: ${emp.dispositivos.length}`);
        
        if (emp.computadores.length > 0) {
          console.log(`      💻 Computadores:`);
          emp.computadores.forEach(comp => {
            console.log(`         - ${comp.serial} (${comp.estado}) - ${comp.modelo.marca.nombre} ${comp.modelo.nombre}`);
          });
        }
        
        if (emp.dispositivos.length > 0) {
          console.log(`      📱 Dispositivos:`);
          emp.dispositivos.forEach(disp => {
            console.log(`         - ${disp.serial} (${disp.estado}) - ${disp.modelo.marca.nombre} ${disp.modelo.nombre}`);
          });
        }
        console.log('');
      });
    }

    // Buscar todos los equipos con estado OPERATIVO que tengan empleadoId asignado
    console.log('🔍 VERIFICACIÓN GENERAL - EQUIPOS OPERATIVOS ASIGNADOS:');
    
    const dispositivosOperativos = await prisma.dispositivo.findMany({
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

    const computadoresOperativos = await prisma.computador.findMany({
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

    console.log(`   - Dispositivos OPERATIVOS con empleadoId: ${dispositivosOperativos.length}`);
    console.log(`   - Computadores OPERATIVOS con empleadoId: ${computadoresOperativos.length}`);

    if (dispositivosOperativos.length > 0) {
      console.log('\n📱 DISPOSITIVOS OPERATIVOS ASIGNADOS (INCONSISTENTES):');
      dispositivosOperativos.forEach(disp => {
        console.log(`   - Serial: ${disp.serial}`);
        console.log(`     Estado: ${disp.estado}`);
        console.log(`     Asignado a: ${disp.empleado?.nombre} ${disp.empleado?.apellido}`);
        console.log(`     Modelo: ${disp.modelo.marca.nombre} ${disp.modelo.nombre}`);
        console.log('');
      });
    }

    if (computadoresOperativos.length > 0) {
      console.log('\n💻 COMPUTADORES OPERATIVOS ASIGNADOS (INCONSISTENTES):');
      computadoresOperativos.forEach(comp => {
        console.log(`   - Serial: ${comp.serial}`);
        console.log(`     Estado: ${comp.estado}`);
        console.log(`     Asignado a: ${comp.empleado?.nombre} ${comp.empleado?.apellido}`);
        console.log(`     Modelo: ${comp.modelo.marca.nombre} ${comp.modelo.nombre}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error durante la búsqueda:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
buscarJorgeRodriguez();
