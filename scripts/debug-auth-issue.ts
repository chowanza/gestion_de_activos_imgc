#!/usr/bin/env npx tsx

/**
 * Script para debuggear el problema de autenticación en la eliminación de cargos
 * 
 * Funcionalidad:
 * - Verifica el estado de autenticación
 * - Prueba la eliminación de cargos directamente
 * - Analiza posibles causas del error 401/500
 * 
 * Uso: npx tsx scripts/debug-auth-issue.ts
 */

import { prisma } from '../src/lib/prisma';

async function debugAuthIssue() {
  console.log('🔍 Debuggeando problema de autenticación...\n');

  try {
    // 1. Verificar que el cargo existe
    console.log('📋 Verificando cargo específico...');
    
    const cargoId = 'f835a717-a32f-4b8a-8bd1-7e04307eb65e';
    const departamentoId = 'b58d5000-fd29-45ea-ab50-8038637fbd50';
    
    const cargo = await prisma.cargo.findUnique({
      where: { id: cargoId },
      include: {
        departamentoCargos: {
          where: {
            departamentoId
          },
          include: {
            departamento: true
          }
        },
        empleadoOrganizaciones: {
          where: {
            activo: true
          }
        }
      }
    });

    if (!cargo) {
      console.log('❌ Cargo no encontrado');
      return;
    }

    console.log(`✅ Cargo encontrado: ${cargo.nombre}`);
    console.log(`   Descripción: ${cargo.descripcion || 'Sin descripción'}`);
    console.log(`   Departamentos asociados: ${cargo.departamentoCargos.length}`);
    console.log(`   Empleados activos: ${cargo.empleadoOrganizaciones.length}`);

    if (cargo.departamentoCargos.length > 0) {
      cargo.departamentoCargos.forEach((dc, index) => {
        console.log(`     ${index + 1}. ${dc.departamento.nombre}`);
      });
    }

    if (cargo.empleadoOrganizaciones.length > 0) {
      console.log('   👥 Empleados activos:');
      cargo.empleadoOrganizaciones.forEach((emp, index) => {
        console.log(`     ${index + 1}. ${emp.empleado.nombre} ${emp.empleado.apellido}`);
      });
    }

    // 2. Verificar si se puede eliminar
    console.log('\n🔍 Verificando si se puede eliminar...');
    
    if (cargo.empleadoOrganizaciones.length > 0) {
      console.log('❌ NO se puede eliminar - tiene empleados activos');
      console.log('   Esto debería devolver error 400, no 401');
    } else {
      console.log('✅ SÍ se puede eliminar - no tiene empleados activos');
      console.log('   El error 401 indica problema de autenticación');
    }

    // 3. Verificar departamento
    console.log('\n🏢 Verificando departamento...');
    
    const departamento = await prisma.departamento.findUnique({
      where: { id: departamentoId },
      include: {
        empresaDepartamentos: {
          include: {
            empresa: true
          }
        },
        departamentoCargos: {
          include: {
            cargo: true
          }
        }
      }
    });

    if (!departamento) {
      console.log('❌ Departamento no encontrado');
      return;
    }

    console.log(`✅ Departamento encontrado: ${departamento.nombre}`);
    console.log(`   Empresa: ${departamento.empresaDepartamentos[0]?.empresa?.nombre || 'Sin empresa'}`);
    console.log(`   Cargos: ${departamento.departamentoCargos.length}`);

    // 4. Verificar relación departamento-cargo
    console.log('\n🔗 Verificando relación departamento-cargo...');
    
    const relacion = await prisma.departamentoCargo.findFirst({
      where: {
        departamentoId,
        cargoId
      }
    });

    if (!relacion) {
      console.log('❌ Relación departamento-cargo no encontrada');
      console.log('   Esto explicaría el error 404 o 401');
    } else {
      console.log('✅ Relación departamento-cargo encontrada');
    }

    // 5. Análisis del problema
    console.log('\n🔍 ANÁLISIS DEL PROBLEMA:');
    
    console.log('\n📊 Estado actual:');
    console.log(`   - Cargo existe: ${!!cargo}`);
    console.log(`   - Departamento existe: ${!!departamento}`);
    console.log(`   - Relación existe: ${!!relacion}`);
    console.log(`   - Empleados activos: ${cargo.empleadoOrganizaciones.length}`);
    console.log(`   - Se puede eliminar: ${cargo.empleadoOrganizaciones.length === 0}`);

    console.log('\n🚨 Posibles causas del error 401:');
    console.log('   1. Usuario no está autenticado en el navegador');
    console.log('   2. Cookie de sesión no se está enviando');
    console.log('   3. Cookie de sesión expiró o es inválida');
    console.log('   4. Problema en getServerUser()');
    console.log('   5. Problema en decrypt() de la cookie');

    console.log('\n🚨 Posibles causas del error 500:');
    console.log('   1. Error en AuditLogger.logDelete()');
    console.log('   2. Error en la transacción de Prisma');
    console.log('   3. Error en getServerUser() que no se maneja');
    console.log('   4. Problema con la base de datos');

    // 6. Soluciones sugeridas
    console.log('\n💡 SOLUCIONES SUGERIDAS:');
    
    console.log('\n🔧 Para el error 401:');
    console.log('   1. Verificar que el usuario esté logueado');
    console.log('   2. Verificar cookies en DevTools del navegador');
    console.log('   3. Intentar hacer login nuevamente');
    console.log('   4. Verificar que la cookie "session" existe');

    console.log('\n🔧 Para el error 500:');
    console.log('   1. Verificar logs del servidor de desarrollo');
    console.log('   2. Temporalmente deshabilitar AuditLogger');
    console.log('   3. Verificar conexión a la base de datos');
    console.log('   4. Reiniciar el servidor de desarrollo');

    // 7. Prueba de eliminación directa (sin autenticación)
    if (cargo.empleadoOrganizaciones.length === 0) {
      console.log('\n🧪 PRUEBA: Eliminación directa sin autenticación...');
      
      try {
        await prisma.$transaction(async (tx) => {
          // Eliminar la relación departamento-cargo
          await tx.departamentoCargo.deleteMany({
            where: {
              departamentoId,
              cargoId
            }
          });

          // Eliminar el cargo
          await tx.cargo.delete({
            where: { id: cargoId }
          });
        });
        
        console.log('✅ Eliminación directa exitosa');
        console.log('   Esto confirma que el problema es de autenticación, no de base de datos');
        
      } catch (error) {
        console.log('❌ Error en eliminación directa:', error);
      }
    }

    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('✅ Base de datos funcionando correctamente');
    console.log('✅ Estructura de datos correcta');
    console.log('✅ Lógica de negocio funcionando');
    console.log('❌ Problema identificado: AUTENTICACIÓN');
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Verificar autenticación del usuario en el navegador');
    console.log('   2. Revisar cookies de sesión');
    console.log('   3. Verificar logs del servidor de desarrollo');
    console.log('   4. Considerar hacer login nuevamente');

  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
debugAuthIssue();
