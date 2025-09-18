import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEquipmentCompanyRelations() {
  try {
    console.log('🔍 Verificando relaciones entre equipos, empleados y empresas...\n');

    // Obtener todos los computadores con sus relaciones
    const computadores = await prisma.computador.findMany({
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

    // Obtener todos los dispositivos con sus relaciones
    const dispositivos = await prisma.dispositivo.findMany({
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

    console.log(`📊 RESUMEN DE EQUIPOS:`);
    console.log(`   Computadores: ${computadores.length}`);
    console.log(`   Dispositivos: ${dispositivos.length}`);
    console.log(`   Total: ${computadores.length + dispositivos.length}\n`);

    // Analizar computadores
    console.log('💻 COMPUTADORES:');
    computadores.forEach((comp, index) => {
      const empresaViaEmpleado = comp.empleado?.departamento?.empresa?.nombre;
      const empresaViaDepartamento = comp.departamento?.empresa?.nombre;
      const tieneEmpresa = empresaViaEmpleado || empresaViaDepartamento;
      
      console.log(`${index + 1}. ${comp.modelo.marca.nombre} ${comp.modelo.nombre} (${comp.serial})`);
      console.log(`   Estado: ${comp.estado}`);
      console.log(`   Empleado: ${comp.empleado ? `${comp.empleado.nombre} ${comp.empleado.apellido}` : 'No asignado'}`);
      console.log(`   Departamento: ${comp.departamento?.nombre || 'No asignado'}`);
      console.log(`   Empresa (via empleado): ${empresaViaEmpleado || 'N/A'}`);
      console.log(`   Empresa (via depto): ${empresaViaDepartamento || 'N/A'}`);
      console.log(`   ✅ Tiene empresa: ${tieneEmpresa ? 'SÍ' : 'NO'}`);
      console.log('');
    });

    // Analizar dispositivos
    console.log('📱 DISPOSITIVOS:');
    dispositivos.forEach((disp, index) => {
      const empresaViaEmpleado = disp.empleado?.departamento?.empresa?.nombre;
      const empresaViaDepartamento = disp.departamento?.empresa?.nombre;
      const tieneEmpresa = empresaViaEmpleado || empresaViaDepartamento;
      
      console.log(`${index + 1}. ${disp.modelo.marca.nombre} ${disp.modelo.nombre} (${disp.serial})`);
      console.log(`   Estado: ${disp.estado}`);
      console.log(`   Empleado: ${disp.empleado ? `${disp.empleado.nombre} ${disp.empleado.apellido}` : 'No asignado'}`);
      console.log(`   Departamento: ${disp.departamento?.nombre || 'No asignado'}`);
      console.log(`   Empresa (via empleado): ${empresaViaEmpleado || 'N/A'}`);
      console.log(`   Empresa (via depto): ${empresaViaDepartamento || 'N/A'}`);
      console.log(`   ✅ Tiene empresa: ${tieneEmpresa ? 'SÍ' : 'NO'}`);
      console.log('');
    });

    // Resumen de equipos sin empresa
    const equiposSinEmpresa = [
      ...computadores.filter(comp => {
        const empresaViaEmpleado = comp.empleado?.departamento?.empresa?.nombre;
        const empresaViaDepartamento = comp.departamento?.empresa?.nombre;
        return !empresaViaEmpleado && !empresaViaDepartamento;
      }),
      ...dispositivos.filter(disp => {
        const empresaViaEmpleado = disp.empleado?.departamento?.empresa?.nombre;
        const empresaViaDepartamento = disp.departamento?.empresa?.nombre;
        return !empresaViaEmpleado && !empresaViaDepartamento;
      })
    ];

    console.log('⚠️  EQUIPOS SIN EMPRESA:');
    if (equiposSinEmpresa.length === 0) {
      console.log('   ✅ Todos los equipos están relacionados con una empresa');
    } else {
      equiposSinEmpresa.forEach((equipo, index) => {
        const tipo = 'serial' in equipo ? 'Computador' : 'Dispositivo';
        const modelo = equipo.modelo;
        console.log(`${index + 1}. ${tipo}: ${modelo.marca.nombre} ${modelo.nombre} (${equipo.serial})`);
        console.log(`   Estado: ${equipo.estado}`);
        console.log(`   Empleado: ${equipo.empleado ? `${equipo.empleado.nombre} ${equipo.empleado.apellido}` : 'No asignado'}`);
        console.log(`   Departamento: ${equipo.departamento?.nombre || 'No asignado'}`);
        console.log('');
      });
    }

    // Obtener lista de empresas disponibles
    const empresas = await prisma.empresa.findMany({
      include: {
        departamentos: true
      }
    });

    console.log('🏢 EMPRESAS DISPONIBLES:');
    empresas.forEach((empresa, index) => {
      console.log(`${index + 1}. ${empresa.nombre} (${empresa.departamentos.length} departamentos)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEquipmentCompanyRelations();



