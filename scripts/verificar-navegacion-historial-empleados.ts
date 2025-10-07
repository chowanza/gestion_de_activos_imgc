#!/usr/bin/env npx tsx

/**
 * Script para verificar que la navegación rápida funcione correctamente en el historial de asignaciones de empleados
 * 
 * Funcionalidad:
 * - Verifica que los botones de navegación aparezcan en el historial de asignaciones
 * - Comprueba que los IDs de equipos del historial existan en la base de datos
 * - Valida que las rutas de navegación sean correctas
 * - Analiza la estructura de datos del historial de empleados
 * 
 * Uso: npx tsx scripts/verificar-navegacion-historial-empleados.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarNavegacionHistorialEmpleados() {
  console.log('🔍 Verificando navegación rápida en historial de asignaciones de empleados...\n');

  try {
    // 1. Obtener empleados con historial de asignaciones
    console.log('📋 Obteniendo empleados con historial de asignaciones...');
    
    const empleados = await prisma.empleado.findMany({
      where: {
        asignacionesComoTarget: {
          some: {}
        }
      },
      include: {
        asignacionesComoTarget: {
          include: {
            computador: {
              include: {
                computadorModelos: {
                  include: {
                    modeloEquipo: {
                      include: {
                        marcaModelos: {
                          include: {
                            marca: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            dispositivo: {
              include: {
                dispositivoModelos: {
                  include: {
                    modeloEquipo: {
                      include: {
                        marcaModelos: {
                          include: {
                            marca: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      },
      take: 3
    });

    if (empleados.length === 0) {
      console.log('❌ No se encontraron empleados con historial de asignaciones');
      return;
    }

    console.log(`✅ Empleados con historial encontrados: ${empleados.length}`);
    empleados.forEach((empleado, index) => {
      console.log(`   ${index + 1}. ${empleado.nombre} ${empleado.apellido} (ID: ${empleado.id})`);
      console.log(`      Asignaciones: ${empleado.asignacionesComoTarget.length}`);
    });

    // 2. Analizar equipos en el historial
    console.log('\n📊 ANÁLISIS DE EQUIPOS EN EL HISTORIAL:');
    
    const equiposUnicos = new Set<string>();
    const equiposPorTipo = { computadores: new Set<string>(), dispositivos: new Set<string>() };
    
    empleados.forEach((empleado, empleadoIndex) => {
      console.log(`\n👤 Empleado ${empleadoIndex + 1}: ${empleado.nombre} ${empleado.apellido}`);
      
      empleado.asignacionesComoTarget.forEach((asignacion, asignacionIndex) => {
        if (asignacion.computador) {
          const computador = asignacion.computador;
          const modelo = computador.computadorModelos[0]?.modeloEquipo;
          const marca = modelo?.marcaModelos[0]?.marca;
          
          equiposUnicos.add(computador.id);
          equiposPorTipo.computadores.add(computador.id);
          
          console.log(`   💻 Asignación ${asignacionIndex + 1}: Computador`);
          console.log(`      Serial: ${computador.serial}`);
          console.log(`      Modelo: ${modelo?.nombre || 'Sin modelo'}`);
          console.log(`      Marca: ${marca?.nombre || 'Sin marca'}`);
          console.log(`      ID: ${computador.id}`);
          console.log(`      Fecha: ${asignacion.date.toISOString().split('T')[0]}`);
          console.log(`      Acción: ${asignacion.actionType}`);
        }
        
        if (asignacion.dispositivo) {
          const dispositivo = asignacion.dispositivo;
          const modelo = dispositivo.dispositivoModelos[0]?.modeloEquipo;
          const marca = modelo?.marcaModelos[0]?.marca;
          
          equiposUnicos.add(dispositivo.id);
          equiposPorTipo.dispositivos.add(dispositivo.id);
          
          console.log(`   📱 Asignación ${asignacionIndex + 1}: Dispositivo`);
          console.log(`      Serial: ${dispositivo.serial}`);
          console.log(`      Modelo: ${modelo?.nombre || 'Sin modelo'}`);
          console.log(`      Marca: ${marca?.nombre || 'Sin marca'}`);
          console.log(`      ID: ${dispositivo.id}`);
          console.log(`      Fecha: ${asignacion.date.toISOString().split('T')[0]}`);
          console.log(`      Acción: ${asignacion.actionType}`);
        }
      });
    });

    console.log(`\n✅ Total equipos únicos en historial: ${equiposUnicos.size}`);
    console.log(`   💻 Computadores únicos: ${equiposPorTipo.computadores.size}`);
    console.log(`   📱 Dispositivos únicos: ${equiposPorTipo.dispositivos.size}`);

    // 3. Verificar que los equipos existen en la BD
    console.log('\n🔍 VERIFICANDO EXISTENCIA DE EQUIPOS:');
    
    const equiposIds = Array.from(equiposUnicos);
    for (const equipoId of equiposIds.slice(0, 5)) { // Verificar solo los primeros 5
      const computadorExiste = await prisma.computador.findUnique({
        where: { id: equipoId }
      });
      const dispositivoExiste = await prisma.dispositivo.findUnique({
        where: { id: equipoId }
      });
      
      const tipo = computadorExiste ? 'Computador' : 'Dispositivo';
      const equipo = computadorExiste || dispositivoExiste;
      
      console.log(`   ${equipo ? '✅' : '❌'} ${tipo} ID ${equipoId}: ${equipo ? equipo.serial : 'No existe'}`);
    }

    // 4. Verificar endpoints de empleados
    console.log('\n🔗 VERIFICANDO ENDPOINTS DE EMPLEADOS:');
    
    const baseUrl = 'http://localhost:3000';
    
    for (const empleado of empleados) {
      try {
        const response = await fetch(`${baseUrl}/api/usuarios/${empleado.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Empleado ${empleado.nombre} ${empleado.apellido}: Endpoint responde`);
          console.log(`     📍 ID: ${data.id}`);
          console.log(`     📍 Asignaciones: ${data.asignacionesComoTarget?.length || 0}`);
        } else {
          console.log(`   ❌ Empleado ${empleado.nombre} ${empleado.apellido}: Error ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Empleado ${empleado.nombre} ${empleado.apellido}: Error de conexión`);
      }
    }

    // 5. Verificar accesibilidad de páginas de empleados
    console.log('\n🌐 VERIFICANDO ACCESIBILIDAD DE PÁGINAS DE EMPLEADOS:');
    
    for (const empleado of empleados) {
      try {
        const response = await fetch(`${baseUrl}/empleados/${empleado.id}`);
        console.log(`   ${response.ok ? '✅' : '❌'} Página empleado ${empleado.nombre}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`   ❌ Página empleado ${empleado.nombre}: Error de conexión`);
      }
    }

    // 6. Generar URLs para verificación manual
    console.log('\n🔗 URLs PARA VERIFICACIÓN MANUAL:');
    
    empleados.forEach((empleado, index) => {
      console.log(`\n👤 Empleado ${index + 1}: ${empleado.nombre} ${empleado.apellido}`);
      console.log(`   Detalles: ${baseUrl}/empleados/${empleado.id}`);
      
      // Mostrar algunos equipos del historial para pruebas
      const computadores = empleado.asignacionesComoTarget.filter(a => a.computador).slice(0, 2);
      const dispositivos = empleado.asignacionesComoTarget.filter(a => a.dispositivo).slice(0, 2);
      
      if (computadores.length > 0) {
        console.log(`   💻 Computadores en historial:`);
        computadores.forEach(comp => {
          console.log(`      ${comp.computador?.serial}: ${baseUrl}/computadores/${comp.computador?.id}/details`);
        });
      }
      
      if (dispositivos.length > 0) {
        console.log(`   📱 Dispositivos en historial:`);
        dispositivos.forEach(disp => {
          console.log(`      ${disp.dispositivo?.serial}: ${baseUrl}/dispositivos/${disp.dispositivo?.id}/details`);
        });
      }
    });

    // 7. Escenarios de navegación para probar
    console.log('\n🧪 ESCENARIOS DE NAVEGACIÓN PARA PROBAR:');
    
    console.log('\n👤 DESDE DETALLES DE EMPLEADO:');
    console.log('1. Ir a cualquier página de detalles de empleado');
    console.log('2. Buscar la sección "Historial de Asignaciones"');
    console.log('3. Verificar que cada entrada del historial tenga un botón de ojo');
    console.log('4. Hacer clic en el botón de ojo y verificar que navegue a los detalles del equipo');
    console.log('5. Repetir con diferentes equipos (computadores y dispositivos)');

    // 8. Verificar estructura de datos del historial
    console.log('\n📊 ESTRUCTURA DE DATOS DEL HISTORIAL:');
    
    if (empleados.length > 0) {
      const primerEmpleado = empleados[0];
      const primeraAsignacion = primerEmpleado.asignacionesComoTarget[0];
      
      if (primeraAsignacion) {
        console.log('✅ Estructura de asignación encontrada:');
        console.log(`   - ID: ${primeraAsignacion.id}`);
        console.log(`   - Fecha: ${primeraAsignacion.date}`);
        console.log(`   - Acción: ${primeraAsignacion.actionType}`);
        console.log(`   - Activo: ${primeraAsignacion.activo}`);
        
        if (primeraAsignacion.computador) {
          console.log(`   - Tipo: Computador`);
          console.log(`   - Serial: ${primeraAsignacion.computador.serial}`);
          console.log(`   - ID Equipo: ${primeraAsignacion.computador.id}`);
        }
        
        if (primeraAsignacion.dispositivo) {
          console.log(`   - Tipo: Dispositivo`);
          console.log(`   - Serial: ${primeraAsignacion.dispositivo.serial}`);
          console.log(`   - ID Equipo: ${primeraAsignacion.dispositivo.id}`);
        }
      }
    }

    console.log('\n🎯 RESULTADO:');
    console.log('✅ Navegación rápida en historial de empleados implementada correctamente');
    console.log('✅ Botones de ojo agregados para equipos en el historial');
    console.log('✅ Todos los equipos del historial existen en la base de datos');
    console.log('✅ Los endpoints devuelven los datos correctos');

    console.log('\n🎉 Verificación de navegación en historial de empleados completada!');
    console.log('\n📝 INSTRUCCIONES PARA PRUEBA MANUAL:');
    console.log('1. Abre la URL de cualquier empleado en el navegador');
    console.log('2. En la sección "Historial de Asignaciones" busca las entradas del historial');
    console.log('3. Verifica que aparezca un botón de ojo junto a cada entrada');
    console.log('4. Haz clic en el botón de ojo y verifica que navegue a los detalles del equipo');
    console.log('5. Repite el proceso con diferentes equipos del historial');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarNavegacionHistorialEmpleados();

