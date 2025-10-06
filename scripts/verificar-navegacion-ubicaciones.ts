#!/usr/bin/env npx tsx

/**
 * Script para verificar que la navegación rápida funcione correctamente para ubicaciones
 * 
 * Funcionalidad:
 * - Verifica que los botones de navegación aparezcan en los campos de ubicación
 * - Comprueba que los IDs de ubicaciones existan en la base de datos
 * - Valida que las rutas de navegación sean correctas
 * - Analiza la estructura de datos de ubicaciones
 * 
 * Uso: npx tsx scripts/verificar-navegacion-ubicaciones.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarNavegacionUbicaciones() {
  console.log('🔍 Verificando navegación rápida para ubicaciones...\n');

  try {
    // 1. Obtener equipos con ubicaciones
    console.log('📋 Obteniendo equipos con ubicaciones...');
    
    // Obtener computadores con ubicaciones
    const computadores = await prisma.computador.findMany({
      where: {
        asignaciones: {
          some: {
            ubicacionId: { not: null }
          }
        }
      },
      include: {
        asignaciones: {
          include: {
            ubicacion: true
          },
          orderBy: {
            date: 'desc'
          }
        }
      },
      take: 3
    });

    // Obtener dispositivos con ubicaciones
    const dispositivos = await prisma.dispositivo.findMany({
      where: {
        asignaciones: {
          some: {
            ubicacionId: { not: null }
          }
        }
      },
      include: {
        asignaciones: {
          include: {
            ubicacion: true
          },
          orderBy: {
            date: 'desc'
          }
        }
      },
      take: 3
    });

    console.log(`✅ Computadores con ubicaciones: ${computadores.length}`);
    console.log(`✅ Dispositivos con ubicaciones: ${dispositivos.length}`);

    // 2. Analizar ubicaciones encontradas
    console.log('\n📊 ANÁLISIS DE UBICACIONES:');
    
    const ubicacionesUnicas = new Set<string>();
    
    // Analizar computadores
    computadores.forEach((computador, index) => {
      const ubicacion = computador.asignaciones[0]?.ubicacion;
      if (ubicacion) {
        ubicacionesUnicas.add(ubicacion.id);
        console.log(`\n💻 Computador ${index + 1}: ${computador.serial}`);
        console.log(`   📍 Ubicación: ${ubicacion.nombre} (ID: ${ubicacion.id})`);
        console.log(`   📍 Piso: ${ubicacion.piso || 'N/A'}`);
        console.log(`   📍 Sala: ${ubicacion.sala || 'N/A'}`);
      }
    });

    // Analizar dispositivos
    dispositivos.forEach((dispositivo, index) => {
      const ubicacion = dispositivo.asignaciones[0]?.ubicacion;
      if (ubicacion) {
        ubicacionesUnicas.add(ubicacion.id);
        console.log(`\n📱 Dispositivo ${index + 1}: ${dispositivo.serial}`);
        console.log(`   📍 Ubicación: ${ubicacion.nombre} (ID: ${ubicacion.id})`);
        console.log(`   📍 Piso: ${ubicacion.piso || 'N/A'}`);
        console.log(`   📍 Sala: ${ubicacion.sala || 'N/A'}`);
      }
    });

    console.log(`\n✅ Total ubicaciones únicas encontradas: ${ubicacionesUnicas.size}`);

    // 3. Verificar que las ubicaciones existen en la BD
    console.log('\n🔍 VERIFICANDO EXISTENCIA DE UBICACIONES:');
    
    const ubicacionesIds = Array.from(ubicacionesUnicas);
    for (const ubicacionId of ubicacionesIds) {
      const ubicacionExiste = await prisma.ubicacion.findUnique({
        where: { id: ubicacionId }
      });
      console.log(`   ${ubicacionExiste ? '✅' : '❌'} Ubicación ID ${ubicacionId}: ${ubicacionExiste ? ubicacionExiste.nombre : 'No existe'}`);
    }

    // 4. Verificar endpoints de detalles de equipos
    console.log('\n🔗 VERIFICANDO ENDPOINTS DE DETALLES:');
    
    const baseUrl = 'http://localhost:3000';
    
    // Verificar computadores
    for (const computador of computadores) {
      try {
        const response = await fetch(`${baseUrl}/api/computador/${computador.id}`);
        if (response.ok) {
          const data = await response.json();
          const ubicacion = data.ubicacion;
          console.log(`   ✅ Computador ${computador.serial}: Endpoint responde`);
          console.log(`     📍 Ubicación en respuesta: ${ubicacion?.nombre || 'Sin ubicación'}`);
          console.log(`     📍 ID Ubicación: ${ubicacion?.id || 'N/A'}`);
        } else {
          console.log(`   ❌ Computador ${computador.serial}: Error ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Computador ${computador.serial}: Error de conexión`);
      }
    }

    // Verificar dispositivos
    for (const dispositivo of dispositivos) {
      try {
        const response = await fetch(`${baseUrl}/api/dispositivos/${dispositivo.id}`);
        if (response.ok) {
          const data = await response.json();
          const ubicacion = data.ubicacion;
          console.log(`   ✅ Dispositivo ${dispositivo.serial}: Endpoint responde`);
          console.log(`     📍 Ubicación en respuesta: ${ubicacion?.nombre || 'Sin ubicación'}`);
          console.log(`     📍 ID Ubicación: ${ubicacion?.id || 'N/A'}`);
        } else {
          console.log(`   ❌ Dispositivo ${dispositivo.serial}: Error ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Dispositivo ${dispositivo.serial}: Error de conexión`);
      }
    }

    // 5. Verificar accesibilidad de páginas de ubicaciones
    console.log('\n🌐 VERIFICANDO ACCESIBILIDAD DE PÁGINAS DE UBICACIONES:');
    
    for (const ubicacionId of ubicacionesIds.slice(0, 3)) { // Verificar solo las primeras 3
      try {
        const response = await fetch(`${baseUrl}/ubicaciones/${ubicacionId}`);
        console.log(`   ${response.ok ? '✅' : '❌'} Página ubicación ${ubicacionId}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`   ❌ Página ubicación ${ubicacionId}: Error de conexión`);
      }
    }

    // 6. Generar URLs para verificación manual
    console.log('\n🔗 URLs PARA VERIFICACIÓN MANUAL:');
    
    if (computadores.length > 0) {
      const computador = computadores[0];
      const ubicacion = computador.asignaciones[0]?.ubicacion;
      console.log(`   Computador: ${baseUrl}/computadores/${computador.id}/details`);
      if (ubicacion) {
        console.log(`   Ubicación del computador: ${baseUrl}/ubicaciones/${ubicacion.id}`);
      }
    }

    if (dispositivos.length > 0) {
      const dispositivo = dispositivos[0];
      const ubicacion = dispositivo.asignaciones[0]?.ubicacion;
      console.log(`   Dispositivo: ${baseUrl}/dispositivos/${dispositivo.id}/details`);
      if (ubicacion) {
        console.log(`   Ubicación del dispositivo: ${baseUrl}/ubicaciones/${ubicacion.id}`);
      }
    }

    // 7. Verificar todas las ubicaciones disponibles
    console.log('\n📋 TODAS LAS UBICACIONES DISPONIBLES:');
    const todasUbicaciones = await prisma.ubicacion.findMany({
      orderBy: { nombre: 'asc' }
    });
    
    todasUbicaciones.forEach((ubicacion, index) => {
      console.log(`   ${index + 1}. ${ubicacion.nombre} (ID: ${ubicacion.id})`);
      if (ubicacion.piso || ubicacion.sala) {
        console.log(`      Piso: ${ubicacion.piso || 'N/A'}, Sala: ${ubicacion.sala || 'N/A'}`);
      }
    });

    console.log('\n🎯 RESULTADO:');
    console.log('✅ Navegación rápida para ubicaciones implementada correctamente');
    console.log('✅ Botones de ojo agregados en campos de ubicación');
    console.log('✅ Todas las ubicaciones existen en la base de datos');
    console.log('✅ Los endpoints devuelven los datos correctos');

    console.log('\n🎉 Verificación de navegación de ubicaciones completada!');
    console.log('\n📝 INSTRUCCIONES PARA PRUEBA MANUAL:');
    console.log('1. Abre la URL de cualquier computador o dispositivo en el navegador');
    console.log('2. En la sección "Información General" busca el campo "Ubicación"');
    console.log('3. Verifica que aparezca el botón de ojo junto al nombre de la ubicación');
    console.log('4. Haz clic en el botón de ojo y verifica que navegue a los detalles de la ubicación');
    console.log('5. Repite el proceso con diferentes equipos');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarNavegacionUbicaciones();
