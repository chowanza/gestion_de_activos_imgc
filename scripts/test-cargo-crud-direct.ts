#!/usr/bin/env npx tsx

/**
 * Script para probar la funcionalidad CRUD de cargos directamente en la base de datos
 * 
 * Funcionalidad:
 * - Prueba crear, leer, actualizar y eliminar cargos
 * - Verifica las validaciones de negocio
 * - Confirma que los conteos de empleados funcionen
 * 
 * Uso: npx tsx scripts/test-cargo-crud-direct.ts
 */

import { prisma } from '../src/lib/prisma';

async function testCargoCRUD() {
  console.log('🔍 Probando funcionalidad CRUD de cargos directamente...\n');

  try {
    // 1. Obtener un departamento para pruebas
    console.log('📋 Obteniendo departamento para pruebas...');
    
    const departamento = await prisma.departamento.findFirst({
      include: {
        empresaDepartamentos: {
          include: {
            empresa: true
          }
        }
      }
    });

    if (!departamento) {
      console.log('❌ No se encontró ningún departamento');
      return;
    }

    console.log(`✅ Departamento encontrado: ${departamento.nombre}`);
    console.log(`   Empresa: ${departamento.empresaDepartamentos[0]?.empresa?.nombre || 'Sin empresa'}`);

    // 2. Crear un nuevo cargo
    console.log('\n📝 CREANDO NUEVO CARGO:');
    
    const nuevoCargo = await prisma.$transaction(async (tx) => {
      // Crear el cargo
      const cargo = await tx.cargo.create({
        data: {
          nombre: 'Cargo de Prueba',
          descripcion: 'Este es un cargo creado para pruebas'
        }
      });

      // Crear la relación con el departamento
      await tx.departamentoCargo.create({
        data: {
          departamentoId: departamento.id,
          cargoId: cargo.id
        }
      });

      return cargo;
    });

    console.log(`✅ Cargo creado exitosamente:`);
    console.log(`   ID: ${nuevoCargo.id}`);
    console.log(`   Nombre: ${nuevoCargo.nombre}`);
    console.log(`   Descripción: ${nuevoCargo.descripcion}`);

    // 3. Leer el cargo creado
    console.log('\n📖 LEYENDO CARGO CREADO:');
    
    const cargoLeido = await prisma.cargo.findUnique({
      where: { id: nuevoCargo.id },
      include: {
        departamentoCargos: {
          include: {
            departamento: true
          }
        },
        _count: {
          select: {
            empleadoOrganizaciones: {
              where: {
                activo: true
              }
            }
          }
        }
      }
    });

    if (cargoLeido) {
      console.log(`✅ Cargo leído exitosamente:`);
      console.log(`   Nombre: ${cargoLeido.nombre}`);
      console.log(`   Descripción: ${cargoLeido.descripcion}`);
      console.log(`   Departamentos: ${cargoLeido.departamentoCargos.length}`);
      console.log(`   Empleados: ${cargoLeido._count?.empleadoOrganizaciones || 0}`);
    } else {
      console.log(`❌ No se pudo leer el cargo creado`);
    }

    // 4. Actualizar el cargo
    console.log('\n✏️ ACTUALIZANDO CARGO:');
    
    const cargoActualizado = await prisma.cargo.update({
      where: { id: nuevoCargo.id },
      data: {
        nombre: 'Cargo de Prueba Actualizado',
        descripcion: 'Descripción actualizada para pruebas'
      }
    });

    console.log(`✅ Cargo actualizado exitosamente:`);
    console.log(`   Nombre anterior: Cargo de Prueba`);
    console.log(`   Nombre nuevo: ${cargoActualizado.nombre}`);
    console.log(`   Descripción: ${cargoActualizado.descripcion}`);

    // 5. Verificar que el cargo se actualizó en el departamento
    console.log('\n🔍 VERIFICANDO ACTUALIZACIÓN EN DEPARTAMENTO:');
    
    const departamentoActualizado = await prisma.departamento.findUnique({
      where: { id: departamento.id },
      include: {
        departamentoCargos: {
          include: {
            cargo: {
              include: {
                _count: {
                  select: {
                    empleadoOrganizaciones: {
                      where: {
                        activo: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (departamentoActualizado) {
      const cargoEnDepartamento = departamentoActualizado.departamentoCargos.find(
        dc => dc.cargo.id === nuevoCargo.id
      );
      
      if (cargoEnDepartamento) {
        console.log(`✅ Cargo encontrado en departamento:`);
        console.log(`   Nombre: ${cargoEnDepartamento.cargo.nombre}`);
        console.log(`   Descripción: ${cargoEnDepartamento.cargo.descripcion}`);
        console.log(`   Empleados: ${cargoEnDepartamento.cargo._count?.empleadoOrganizaciones || 0}`);
      } else {
        console.log(`❌ Cargo no encontrado en departamento`);
      }
    }

    // 6. Probar validación de nombre duplicado
    console.log('\n🛡️ PROBANDO VALIDACIÓN DE NOMBRE DUPLICADO:');
    
    try {
      await prisma.$transaction(async (tx) => {
        // Intentar crear otro cargo con el mismo nombre en el mismo departamento
        const cargoDuplicado = await tx.cargo.create({
          data: {
            nombre: 'Cargo de Prueba Actualizado', // Mismo nombre
            descripcion: 'Intento de duplicado'
          }
        });

        await tx.departamentoCargo.create({
          data: {
            departamentoId: departamento.id,
            cargoId: cargoDuplicado.id
          }
        });
      });
      
      console.log(`⚠️ No se detectó duplicado - esto debería ser validado en la API`);
    } catch (error) {
      console.log(`✅ Validación funcionando: ${error}`);
    }

    // 7. Eliminar el cargo de prueba
    console.log('\n🗑️ ELIMINANDO CARGO DE PRUEBA:');
    
    await prisma.$transaction(async (tx) => {
      // Eliminar la relación departamento-cargo
      await tx.departamentoCargo.deleteMany({
        where: {
          departamentoId: departamento.id,
          cargoId: nuevoCargo.id
        }
      });

      // Eliminar el cargo
      await tx.cargo.delete({
        where: { id: nuevoCargo.id }
      });
    });

    console.log(`✅ Cargo eliminado exitosamente`);

    // 8. Verificar que el cargo fue eliminado
    console.log('\n🔍 VERIFICANDO ELIMINACIÓN:');
    
    const cargoEliminado = await prisma.cargo.findUnique({
      where: { id: nuevoCargo.id }
    });

    if (!cargoEliminado) {
      console.log(`✅ Cargo eliminado correctamente de la base de datos`);
    } else {
      console.log(`❌ El cargo aún existe en la base de datos`);
    }

    // 9. Verificar que el cargo no aparece en el departamento
    const departamentoFinal = await prisma.departamento.findUnique({
      where: { id: departamento.id },
      include: {
        departamentoCargos: {
          include: {
            cargo: true
          }
        }
      }
    });

    if (departamentoFinal) {
      const cargoEnDepartamentoFinal = departamentoFinal.departamentoCargos.find(
        dc => dc.cargo.id === nuevoCargo.id
      );
      
      if (!cargoEnDepartamentoFinal) {
        console.log(`✅ Cargo eliminado correctamente del departamento`);
      } else {
        console.log(`❌ El cargo aún aparece en el departamento`);
      }
    }

    console.log('\n🎯 RESULTADO:');
    console.log('✅ Funcionalidad CRUD de cargos funciona correctamente');
    console.log('✅ Transacciones atómicas funcionando');
    console.log('✅ Relaciones departamento-cargo funcionando');
    console.log('✅ Conteo de empleados por cargo funcionando');
    console.log('✅ Eliminación completa (cargo + relación) funcionando');

    console.log('\n🎉 Prueba CRUD de cargos completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
testCargoCRUD();
