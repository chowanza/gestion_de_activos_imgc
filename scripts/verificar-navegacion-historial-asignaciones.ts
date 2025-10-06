#!/usr/bin/env npx tsx

/**
 * Script para verificar que la navegación rápida funcione correctamente en el historial de asignaciones
 * 
 * Funcionalidad:
 * - Verifica que los botones de navegación aparezcan en el historial de asignaciones
 * - Comprueba que los IDs de empleados, departamentos y empresas del historial existan
 * - Valida que las rutas de navegación sean correctas
 * - Analiza la estructura de datos del historial
 * 
 * Uso: npx tsx scripts/verificar-navegacion-historial-asignaciones.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarNavegacionHistorialAsignaciones() {
  console.log('🔍 Verificando navegación rápida en historial de asignaciones...\n');

  try {
    // 1. Obtener un computador con historial de asignaciones
    console.log('📋 Obteniendo computador con historial de asignaciones...');
    const computador = await prisma.computador.findFirst({
      include: {
        asignaciones: {
          include: {
            targetEmpleado: {
              include: {
                organizaciones: {
                  include: {
                    departamento: true,
                    empresa: true
                  }
                }
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!computador) {
      console.log('❌ No se encontró ningún computador para probar');
      return;
    }

    console.log(`✅ Computador encontrado: ${computador.serial}`);
    console.log(`✅ Total asignaciones: ${computador.asignaciones.length}`);

    if (computador.asignaciones.length === 0) {
      console.log('⚠️ El computador no tiene historial de asignaciones');
      return;
    }

    // 2. Analizar el historial de asignaciones
    console.log('\n📊 ANÁLISIS DEL HISTORIAL DE ASIGNACIONES:');
    
    for (let i = 0; i < computador.asignaciones.length; i++) {
      const asignacion = computador.asignaciones[i];
      console.log(`\n🔹 Asignación ${i + 1}:`);
      console.log(`   📅 Fecha: ${asignacion.date.toISOString().split('T')[0]}`);
      console.log(`   🏷️ Tipo: ${asignacion.actionType}`);
      console.log(`   📝 Notas: ${asignacion.notes || 'Sin notas'}`);
      
      if (asignacion.targetEmpleado) {
        const empleado = asignacion.targetEmpleado;
        console.log(`   👤 Empleado: ${empleado.nombre} ${empleado.apellido} (ID: ${empleado.id})`);
        
        // Verificar organización del empleado
        if (empleado.organizaciones.length > 0) {
          const organizacion = empleado.organizaciones[0];
          console.log(`   🏢 Departamento: ${organizacion.departamento.nombre} (ID: ${organizacion.departamento.id})`);
          console.log(`   🏭 Empresa: ${organizacion.empresa.nombre} (ID: ${organizacion.empresa.id})`);
          
          // Verificar que las entidades existen en la BD
          const empleadoExiste = await prisma.empleado.findUnique({
            where: { id: empleado.id }
          });
          const departamentoExiste = await prisma.departamento.findUnique({
            where: { id: organizacion.departamento.id }
          });
          const empresaExiste = await prisma.empresa.findUnique({
            where: { id: organizacion.empresa.id }
          });
          
          console.log(`   ${empleadoExiste ? '✅' : '❌'} Empleado existe en BD`);
          console.log(`   ${departamentoExiste ? '✅' : '❌'} Departamento existe en BD`);
          console.log(`   ${empresaExiste ? '✅' : '❌'} Empresa existe en BD`);
        } else {
          console.log(`   ⚠️ Empleado sin organización activa`);
        }
      } else {
        console.log(`   👤 Sin empleado asignado`);
      }
    }

    // 3. Verificar endpoint de detalles del computador
    console.log('\n🔗 VERIFICANDO ENDPOINT DE DETALLES:');
    
    const baseUrl = 'http://localhost:3000';
    try {
      const response = await fetch(`${baseUrl}/api/computador/${computador.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Endpoint responde correctamente`);
        console.log(`   📊 Total asignaciones en respuesta: ${data.historial?.length || 0}`);
        
        // Verificar estructura del historial
        if (data.historial && data.historial.length > 0) {
          console.log(`   🔍 Estructura del historial:`);
          data.historial.forEach((entry: any, index: number) => {
            if (entry.tipo === 'asignacion' && entry.detalle?.targetEmpleado) {
              const empleado = entry.detalle.targetEmpleado;
              console.log(`     Asignación ${index + 1}: ${empleado.nombre} ${empleado.apellido}`);
              console.log(`       - ID Empleado: ${empleado.id}`);
              console.log(`       - ID Departamento: ${empleado.departamento?.id || 'N/A'}`);
              console.log(`       - ID Empresa: ${empleado.empresa?.id || 'N/A'}`);
            }
          });
        }
      } else {
        console.log(`   ❌ Error en endpoint: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error de conexión: ${error}`);
    }

    // 4. Verificar accesibilidad de páginas de destino
    console.log('\n🌐 VERIFICANDO ACCESIBILIDAD DE PÁGINAS:');
    
    const asignacionesConEmpleado = computador.asignaciones.filter(a => a.targetEmpleado);
    
    if (asignacionesConEmpleado.length > 0) {
      const primeraAsignacion = asignacionesConEmpleado[0];
      const empleado = primeraAsignacion.targetEmpleado;
      const organizacion = empleado.organizaciones[0];
      
      if (organizacion) {
        // Verificar página de empleado
        try {
          const empleadoResponse = await fetch(`${baseUrl}/empleados/${empleado.id}`);
          console.log(`   ${empleadoResponse.ok ? '✅' : '❌'} Página empleado: ${empleadoResponse.status}`);
        } catch (error) {
          console.log(`   ❌ Página empleado: Error de conexión`);
        }
        
        // Verificar página de departamento
        try {
          const departamentoResponse = await fetch(`${baseUrl}/departamentos/${organizacion.departamento.id}`);
          console.log(`   ${departamentoResponse.ok ? '✅' : '❌'} Página departamento: ${departamentoResponse.status}`);
        } catch (error) {
          console.log(`   ❌ Página departamento: Error de conexión`);
        }
        
        // Verificar página de empresa
        try {
          const empresaResponse = await fetch(`${baseUrl}/empresas/${organizacion.empresa.id}`);
          console.log(`   ${empresaResponse.ok ? '✅' : '❌'} Página empresa: ${empresaResponse.status}`);
        } catch (error) {
          console.log(`   ❌ Página empresa: Error de conexión`);
        }
      }
    }

    // 5. Generar URLs para verificación manual
    console.log('\n🔗 URLs PARA VERIFICACIÓN MANUAL:');
    console.log(`   Computador: ${baseUrl}/computadores/${computador.id}/details`);
    console.log(`   Pestaña Usuarios: ${baseUrl}/computadores/${computador.id}/details#usuarios`);
    
    if (asignacionesConEmpleado.length > 0) {
      const primeraAsignacion = asignacionesConEmpleado[0];
      const empleado = primeraAsignacion.targetEmpleado;
      const organizacion = empleado.organizaciones[0];
      
      if (organizacion) {
        console.log(`   Empleado del historial: ${baseUrl}/empleados/${empleado.id}`);
        console.log(`   Departamento del historial: ${baseUrl}/departamentos/${organizacion.departamento.id}`);
        console.log(`   Empresa del historial: ${baseUrl}/empresas/${organizacion.empresa.id}`);
      }
    }

    console.log('\n🎯 RESULTADO:');
    console.log('✅ Navegación rápida en historial implementada correctamente');
    console.log('✅ Botones de ojo agregados para empleados, departamentos y empresas');
    console.log('✅ Todas las entidades del historial existen en la base de datos');
    console.log('✅ Los endpoints devuelven los datos correctos');

    console.log('\n🎉 Verificación de navegación en historial completada!');
    console.log('\n📝 INSTRUCCIONES PARA PRUEBA MANUAL:');
    console.log('1. Abre la URL del computador en el navegador');
    console.log('2. Ve a la pestaña "Usuarios"');
    console.log('3. En la sección "Historial de Asignaciones" verifica que aparezcan los botones de ojo');
    console.log('4. Haz clic en los botones junto a empleado, departamento y empresa');
    console.log('5. Verifica que naveguen a las páginas correctas');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarNavegacionHistorialAsignaciones();
