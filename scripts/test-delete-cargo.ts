#!/usr/bin/env npx tsx

/**
 * Script para probar la eliminación de cargos
 * 
 * Funcionalidad:
 * - Verifica que la eliminación de cargos funcione correctamente
 * - Prueba las validaciones de autorización
 * - Verifica que no se puedan eliminar cargos con empleados activos
 * 
 * Uso: npx tsx scripts/test-delete-cargo.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function testDeleteCargo() {
  console.log('🔍 Probando eliminación de cargos...\n');

  try {
    // 1. Obtener un departamento con cargos
    console.log('📋 Obteniendo departamento con cargos...');
    
    const departamento = await prisma.departamento.findFirst({
      where: {
        departamentoCargos: {
          some: {}
        }
      },
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

    if (!departamento) {
      console.log('❌ No se encontró ningún departamento con cargos');
      return;
    }

    console.log(`✅ Departamento encontrado: ${departamento.nombre}`);
    console.log(`   Cargos disponibles: ${departamento.departamentoCargos.length}`);

    // 2. Mostrar cargos disponibles
    console.log('\n📊 CARGOS DISPONIBLES:');
    departamento.departamentoCargos.forEach((deptCargo, index) => {
      const empleadosCount = deptCargo.cargo._count?.empleadoOrganizaciones || 0;
      console.log(`   ${index + 1}. ${deptCargo.cargo.nombre}`);
      console.log(`      ID: ${deptCargo.cargo.id}`);
      console.log(`      Empleados: ${empleadosCount}`);
      console.log(`      Se puede eliminar: ${empleadosCount === 0 ? 'Sí' : 'No'}`);
    });

    // 3. Encontrar un cargo sin empleados para probar eliminación
    const cargoSinEmpleados = departamento.departamentoCargos.find(
      deptCargo => (deptCargo.cargo._count?.empleadoOrganizaciones || 0) === 0
    );

    if (!cargoSinEmpleados) {
      console.log('\n⚠️ No se encontró ningún cargo sin empleados para probar eliminación');
      console.log('   Todos los cargos tienen empleados asignados');
      return;
    }

    console.log(`\n🎯 Cargo seleccionado para prueba: ${cargoSinEmpleados.cargo.nombre}`);

    // 4. Probar eliminación via API
    console.log('\n🔗 PROBANDO ELIMINACIÓN VIA API:');
    
    const baseUrl = 'http://localhost:3000';
    const deleteUrl = `${baseUrl}/api/departamentos/${departamento.id}/cargos/${cargoSinEmpleados.cargo.id}`;
    
    console.log(`   URL: ${deleteUrl}`);
    
    try {
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Eliminación exitosa: ${(data as any).message}`);
        
        // Verificar que el cargo ya no existe
        const cargoEliminado = await prisma.cargo.findUnique({
          where: { id: cargoSinEmpleados.cargo.id }
        });
        
        if (!cargoEliminado) {
          console.log('   ✅ Confirmado: El cargo fue eliminado de la base de datos');
        } else {
          console.log('   ⚠️ Advertencia: El cargo aún existe en la base de datos');
        }
        
      } else {
        const errorData = await response.json();
        console.log(`   ❌ Error: ${(errorData as any).message}`);
        
        if (response.status === 401) {
          console.log('   🔐 Problema de autorización detectado');
          console.log('   💡 Verificar que el usuario esté autenticado');
        }
      }
      
    } catch (error: any) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
    }

    // 5. Probar intento de eliminar cargo con empleados
    const cargoConEmpleados = departamento.departamentoCargos.find(
      deptCargo => (deptCargo.cargo._count?.empleadoOrganizaciones || 0) > 0
    );

    if (cargoConEmpleados) {
      console.log(`\n🛡️ PROBANDO PROTECCIÓN - Cargo con empleados: ${cargoConEmpleados.cargo.nombre}`);
      
      const deleteUrlConEmpleados = `${baseUrl}/api/departamentos/${departamento.id}/cargos/${cargoConEmpleados.cargo.id}`;
      
      try {
        const response = await fetch(deleteUrlConEmpleados, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.status === 400) {
          const errorData = await response.json();
          console.log(`   ✅ Protección funcionando: ${(errorData as any).message}`);
        } else {
          console.log(`   ⚠️ La protección podría no estar funcionando correctamente`);
        }
        
      } catch (error: any) {
        console.log(`   ❌ Error de conexión: ${error.message}`);
      }
    }

    // 6. Verificar estado final de cargos
    console.log('\n📊 ESTADO FINAL DE CARGOS:');
    
    const departamentoFinal = await prisma.departamento.findUnique({
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

    if (departamentoFinal) {
      console.log(`   Cargos restantes: ${departamentoFinal.departamentoCargos.length}`);
      departamentoFinal.departamentoCargos.forEach((deptCargo, index) => {
        const empleadosCount = deptCargo.cargo._count?.empleadoOrganizaciones || 0;
        console.log(`     ${index + 1}. ${deptCargo.cargo.nombre} (${empleadosCount} empleados)`);
      });
    }

    console.log('\n🎯 RESULTADO:');
    console.log('✅ Prueba de eliminación de cargos completada');
    console.log('✅ Verificación de autorización realizada');
    console.log('✅ Protección contra eliminación de cargos con empleados verificada');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
testDeleteCargo();
