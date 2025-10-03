const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateEmployeesToUniqueDepartments() {
  console.log('=== MIGRANDO EMPLEADOS A DEPARTAMENTOS ÚNICOS ===\n');

  try {
    // Obtener todos los empleados con sus organizaciones actuales
    const empleados = await prisma.usuario.findMany({
      include: {
        organizaciones: {
          include: {
            departamento: true,
            empresa: true,
            cargo: true
          }
        }
      },
      where: {
        organizaciones: {
          some: {}
        }
      }
    });

    console.log(`Encontrados ${empleados.length} empleados con organizaciones...\n`);

    let empleadosMigrados = 0;
    let empleadosSinMigrar = 0;

    for (const empleado of empleados) {
      console.log(`Procesando empleado: ${empleado.nombre} ${empleado.apellido}`);
      
      for (const organizacion of empleado.organizaciones) {
        const departamentoActual = organizacion.departamento;
        const empresa = organizacion.empresa;
        
        // Buscar el nuevo departamento único para esta empresa
        const nuevoDepartamento = await prisma.departamento.findFirst({
          where: {
            nombre: {
              contains: departamentoActual.nombre.split(' - ')[0] // Obtener el nombre base del departamento
            },
            empresaDepartamentos: {
              some: {
                empresaId: empresa.id
              }
            }
          },
          include: {
            empresaDepartamentos: {
              include: {
                empresa: true
              }
            }
          }
        });

        if (nuevoDepartamento) {
          // Actualizar la organización del empleado para apuntar al nuevo departamento
          await prisma.empleadoEmpresaDepartamentoCargo.update({
            where: {
              id: organizacion.id
            },
            data: {
              departamentoId: nuevoDepartamento.id
            }
          });

          console.log(`  ✓ Migrado de "${departamentoActual.nombre}" a "${nuevoDepartamento.nombre}"`);
          empleadosMigrados++;
        } else {
          console.log(`  ⚠️  No se encontró departamento único para "${departamentoActual.nombre}" en "${empresa.nombre}"`);
          empleadosSinMigrar++;
        }
      }
    }

    console.log('\n=== VERIFICACIÓN FINAL ===');
    
    // Verificar el resultado
    const empleadosFinales = await prisma.usuario.findMany({
      include: {
        organizaciones: {
          include: {
            departamento: {
              include: {
                empresaDepartamentos: {
                  include: {
                    empresa: true
                  }
                }
              }
            },
            empresa: true,
            cargo: true
          }
        }
      },
      where: {
        organizaciones: {
          some: {}
        }
      }
    });

    console.log(`Total empleados con organizaciones: ${empleadosFinales.length}`);
    console.log(`Empleados migrados: ${empleadosMigrados}`);
    console.log(`Empleados sin migrar: ${empleadosSinMigrar}`);

    // Mostrar estadísticas por departamento
    console.log('\n=== ESTADÍSTICAS POR DEPARTAMENTO ===');
    const departamentosConEmpleados = await prisma.departamento.findMany({
      include: {
        empleadoOrganizaciones: {
          include: {
            empleado: true
          }
        },
        empresaDepartamentos: {
          include: {
            empresa: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    departamentosConEmpleados.forEach(depto => {
      const empresa = depto.empresaDepartamentos[0]?.empresa?.nombre || 'Sin empresa';
      const empleadosCount = depto.empleadoOrganizaciones.length;
      if (empleadosCount > 0) {
        console.log(`${depto.nombre} (${empresa}): ${empleadosCount} empleados`);
      }
    });

    console.log('\n✅ ¡Migración completada!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateEmployeesToUniqueDepartments();




