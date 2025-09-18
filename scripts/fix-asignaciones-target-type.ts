import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAsignacionesTargetType() {
  try {
    console.log('🔧 Corrigiendo targetType en asignaciones...\n');

    // Obtener todas las asignaciones con targetType incorrecto
    const asignacionesIncorrectas = await prisma.asignaciones.findMany({
      where: {
        targetType: 'Computador'
      },
      include: {
        computador: {
          include: {
            empleado: {
              include: {
                departamento: {
                  include: { empresa: true }
                }
              }
            },
            departamento: {
              include: { empresa: true }
            }
          }
        },
        dispositivo: {
          include: {
            empleado: {
              include: {
                departamento: {
                  include: { empresa: true }
                }
              }
            },
            departamento: {
              include: { empresa: true }
            }
          }
        }
      }
    });

    console.log(`📊 Asignaciones con targetType incorrecto: ${asignacionesIncorrectas.length}\n`);

    for (const asignacion of asignacionesIncorrectas) {
      const equipo = asignacion.computador || asignacion.dispositivo;
      
      if (!equipo) {
        console.log(`❌ Asignación ${asignacion.id}: No se encontró el equipo`);
        continue;
      }

      console.log(`\n🔍 Procesando asignación ${asignacion.id}:`);
      console.log(`   Equipo: ${equipo.serial}`);
      console.log(`   Estado: ${equipo.estado}`);
      console.log(`   Empleado ID: ${equipo.empleadoId || 'No asignado'}`);
      console.log(`   Departamento ID: ${equipo.departamentoId || 'No asignado'}`);

      // Determinar el targetType correcto basado en el equipo actual
      let nuevoTargetType = 'Sistema';
      let nuevoTargetEmpleadoId = null;
      let nuevoTargetDepartamentoId = null;

      if (equipo.empleadoId) {
        nuevoTargetType = 'Usuario';
        nuevoTargetEmpleadoId = equipo.empleadoId;
        console.log(`   ✅ Corrigiendo a Usuario: ${equipo.empleado?.nombre} ${equipo.empleado?.apellido}`);
      } else if (equipo.departamentoId) {
        nuevoTargetType = 'Departamento';
        nuevoTargetDepartamentoId = equipo.departamentoId;
        console.log(`   ✅ Corrigiendo a Departamento: ${equipo.departamento?.nombre}`);
      } else {
        console.log(`   ⚠️  Equipo sin asignación directa, manteniendo como Sistema`);
      }

      // Actualizar la asignación
      await prisma.asignaciones.update({
        where: { id: asignacion.id },
        data: {
          targetType: nuevoTargetType,
          targetEmpleadoId: nuevoTargetEmpleadoId,
          targetDepartamentoId: nuevoTargetDepartamentoId
        }
      });

      console.log(`   ✅ Asignación ${asignacion.id} actualizada`);
    }

    // Verificar el resultado
    const asignacionesCorregidas = await prisma.asignaciones.findMany({
      include: {
        targetEmpleado: true,
        targetDepartamento: true,
        computador: {
          include: {
            modelo: { include: { marca: true } }
          }
        },
        dispositivo: {
          include: {
            modelo: { include: { marca: true } }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    console.log(`\n📋 Verificación final:`);
    asignacionesCorregidas.forEach((a, index) => {
      const equipo = a.computador || a.dispositivo;
      const asignadoA = a.targetEmpleado ? 
        `${a.targetEmpleado.nombre} ${a.targetEmpleado.apellido}` :
        a.targetDepartamento?.nombre || 'Sistema';
      
      console.log(`${index + 1}. ${equipo?.serial} → ${asignadoA} (${a.targetType})`);
    });

    console.log(`\n✅ Corrección completada`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAsignacionesTargetType();


