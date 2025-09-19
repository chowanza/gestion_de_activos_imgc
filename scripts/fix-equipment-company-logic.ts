import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEquipmentCompanyLogic() {
  try {
    console.log('🔧 Aplicando lógica de empresas para equipos...\n');

    // Obtener todos los computadores
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

    console.log(`📊 Procesando ${computadores.length} computadores...\n`);

    for (const computador of computadores) {
      console.log(`\n💻 Procesando: ${computador.modelo.marca.nombre} ${computador.modelo.nombre} (${computador.serial})`);
      console.log(`   Estado actual: ${computador.estado}`);
      console.log(`   Empleado actual: ${computador.empleadoId || 'No asignado'}`);
      console.log(`   Departamento actual: ${computador.departamentoId || 'No asignado'}`);

      // Verificar si tiene empresa actualmente
      const empresaViaEmpleado = computador.empleado?.departamento?.empresa?.nombre;
      const empresaViaDepartamento = computador.departamento?.empresa?.nombre;
      const tieneEmpresaActual = empresaViaEmpleado || empresaViaDepartamento;

      if (tieneEmpresaActual) {
        console.log(`   ✅ Ya tiene empresa: ${tieneEmpresaActual}`);
        continue;
      }

      // Buscar si alguna vez fue asignado a alguien
      const asignaciones = await prisma.asignaciones.findMany({
        where: {
          computadorId: computador.id,
          actionType: 'Asignación'
        },
        include: {
          targetEmpleado: {
            include: {
              departamento: {
                include: {
                  empresa: true
                }
              }
            }
          },
          targetDepartamento: {
            include: {
              empresa: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      if (asignaciones.length === 0) {
        console.log(`   📦 Nunca fue asignado - En resguardo (ubicación ID: ${computador.ubicacionId || 'No especificada'})`);
        continue;
      }

      // Fue asignado alguna vez, obtener la última asignación
      const ultimaAsignacion = asignaciones[0];
      console.log(`   📋 Última asignación: ${ultimaAsignacion.date.toISOString().split('T')[0]}`);
      console.log(`   👤 Asignado a: ${ultimaAsignacion.targetEmpleado ? `${ultimaAsignacion.targetEmpleado.nombre} ${ultimaAsignacion.targetEmpleado.apellido}` : 'N/A'}`);
      console.log(`   🏢 Departamento: ${ultimaAsignacion.targetDepartamento?.nombre || 'N/A'}`);

      // Determinar la empresa basada en la última asignación
      let empresaId: string | null = null;
      let departamentoId: string | null = null;
      let empleadoId: string | null = null;

      if (ultimaAsignacion.targetEmpleado) {
        // Asignado a empleado - usar su departamento y empresa
        empleadoId = ultimaAsignacion.targetEmpleado.id;
        departamentoId = ultimaAsignacion.targetEmpleado.departamentoId;
        empresaId = ultimaAsignacion.targetEmpleado.departamento.empresa.id;
        console.log(`   🏢 Empresa (via empleado): ${ultimaAsignacion.targetEmpleado.departamento.empresa.nombre}`);
      } else if (ultimaAsignacion.targetDepartamento) {
        // Asignado a departamento - usar su empresa
        departamentoId = ultimaAsignacion.targetDepartamento.id;
        empresaId = ultimaAsignacion.targetDepartamento.empresa.id;
        console.log(`   🏢 Empresa (via departamento): ${ultimaAsignacion.targetDepartamento.empresa.nombre}`);
      }

      if (empresaId) {
        // Actualizar el computador con la información correcta
        console.log(`   🔄 Actualizando relaciones...`);
        await prisma.computador.update({
          where: {
            id: computador.id
          },
          data: {
            empleadoId: empleadoId,
            departamentoId: departamentoId
          }
        });
        console.log(`   ✅ Actualizado - Ahora relacionado con empresa`);
      } else {
        console.log(`   ⚠️  No se pudo determinar la empresa`);
      }
    }

    // Verificación final
    console.log(`\n🔍 VERIFICACIÓN FINAL:`);
    const computadoresFinal = await prisma.computador.findMany({
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

    const equiposSinEmpresa = computadoresFinal.filter(comp => {
      const empresaViaEmpleado = comp.empleado?.departamento?.empresa?.nombre;
      const empresaViaDepartamento = comp.departamento?.empresa?.nombre;
      return !empresaViaEmpleado && !empresaViaDepartamento;
    });

    console.log(`\n📊 RESUMEN FINAL:`);
    console.log(`   Total computadores: ${computadoresFinal.length}`);
    console.log(`   Con empresa: ${computadoresFinal.length - equiposSinEmpresa.length}`);
    console.log(`   Sin empresa (en resguardo): ${equiposSinEmpresa.length}`);

    if (equiposSinEmpresa.length > 0) {
      console.log(`\n📦 EQUIPOS EN RESGUARDO:`);
      equiposSinEmpresa.forEach((equipo, index) => {
        console.log(`${index + 1}. ${equipo.modelo.marca.nombre} ${equipo.modelo.nombre} (${equipo.serial})`);
        console.log(`   Estado: ${equipo.estado}`);
        console.log(`   Ubicación ID: ${equipo.ubicacionId || 'No especificada'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEquipmentCompanyLogic();
