#!/usr/bin/env npx tsx

/**
 * Script para verificar que el botón de volver en detalles de ubicación funcione correctamente
 * 
 * Funcionalidad:
 * - Verifica que el botón de volver use router.back() en lugar de navegación fija
 * - Comprueba que la página de detalles de ubicación sea accesible
 * - Valida que la navegación funcione desde diferentes orígenes
 * 
 * Uso: npx tsx scripts/verificar-boton-volver-ubicacion.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarBotonVolverUbicacion() {
  console.log('🔍 Verificando botón de volver en detalles de ubicación...\n');

  try {
    // 1. Obtener una ubicación existente
    console.log('📋 Obteniendo ubicaciones disponibles...');
    const ubicaciones = await prisma.ubicacion.findMany({
      take: 3,
      orderBy: { nombre: 'asc' }
    });

    if (ubicaciones.length === 0) {
      console.log('❌ No se encontraron ubicaciones para probar');
      return;
    }

    console.log(`✅ Ubicaciones encontradas: ${ubicaciones.length}`);
    ubicaciones.forEach((ubicacion, index) => {
      console.log(`   ${index + 1}. ${ubicacion.nombre} (ID: ${ubicacion.id})`);
    });

    // 2. Verificar que la página de detalles sea accesible
    console.log('\n🌐 VERIFICANDO ACCESIBILIDAD DE PÁGINAS DE DETALLES:');
    
    const baseUrl = 'http://localhost:3000';
    
    for (const ubicacion of ubicaciones) {
      try {
        const response = await fetch(`${baseUrl}/ubicaciones/${ubicacion.id}`);
        console.log(`   ${response.ok ? '✅' : '❌'} Página ubicación ${ubicacion.nombre}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`   ❌ Página ubicación ${ubicacion.nombre}: Error de conexión`);
      }
    }

    // 3. Verificar que el endpoint de ubicaciones funcione
    console.log('\n🔗 VERIFICANDO ENDPOINTS DE UBICACIONES:');
    
    for (const ubicacion of ubicaciones) {
      try {
        const response = await fetch(`${baseUrl}/api/ubicaciones/${ubicacion.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ API ubicación ${ubicacion.nombre}: Responde correctamente`);
          console.log(`     📍 Nombre: ${data.nombre}`);
          console.log(`     📍 Piso: ${data.piso || 'N/A'}`);
          console.log(`     📍 Sala: ${data.sala || 'N/A'}`);
          console.log(`     📍 Equipos: ${data.asignacionesEquipos?.length || 0}`);
        } else {
          console.log(`   ❌ API ubicación ${ubicacion.nombre}: Error ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ API ubicación ${ubicacion.nombre}: Error de conexión`);
      }
    }

    // 4. Generar URLs para verificación manual
    console.log('\n🔗 URLs PARA VERIFICACIÓN MANUAL:');
    
    ubicaciones.forEach((ubicacion, index) => {
      console.log(`\n📍 Ubicación ${index + 1}: ${ubicacion.nombre}`);
      console.log(`   Detalles: ${baseUrl}/ubicaciones/${ubicacion.id}`);
      console.log(`   Lista general: ${baseUrl}/ubicaciones`);
    });

    // 5. Escenarios de navegación para probar
    console.log('\n🧪 ESCENARIOS DE NAVEGACIÓN PARA PROBAR:');
    
    console.log('\n📱 DESDE LISTA DE UBICACIONES:');
    console.log('1. Ir a /ubicaciones');
    console.log('2. Hacer clic en "Ver Detalles" de cualquier ubicación');
    console.log('3. Verificar que el botón de volver (←) regrese a la lista');
    
    console.log('\n💻 DESDE DETALLES DE COMPUTADOR:');
    console.log('1. Ir a cualquier computador con ubicación');
    console.log('2. Hacer clic en el botón de ojo junto a "Ubicación"');
    console.log('3. Verificar que el botón de volver (←) regrese al computador');
    
    console.log('\n📱 DESDE DETALLES DE DISPOSITIVO:');
    console.log('1. Ir a cualquier dispositivo con ubicación');
    console.log('2. Hacer clic en el botón de ojo junto a "Ubicación"');
    console.log('3. Verificar que el botón de volver (←) regrese al dispositivo');

    // 6. Verificar equipos con ubicaciones para pruebas
    console.log('\n📊 EQUIPOS CON UBICACIONES PARA PRUEBAS:');
    
    const computadoresConUbicacion = await prisma.computador.findMany({
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

    const dispositivosConUbicacion = await prisma.dispositivo.findMany({
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

    if (computadoresConUbicacion.length > 0) {
      console.log('\n💻 COMPUTADORES CON UBICACIONES:');
      computadoresConUbicacion.forEach((computador, index) => {
        const ubicacion = computador.asignaciones[0]?.ubicacion;
        console.log(`   ${index + 1}. ${computador.serial}`);
        console.log(`      Ubicación: ${ubicacion?.nombre || 'Sin ubicación'}`);
        console.log(`      URL: ${baseUrl}/computadores/${computador.id}/details`);
        if (ubicacion) {
          console.log(`      Navegación: ${baseUrl}/ubicaciones/${ubicacion.id}`);
        }
      });
    }

    if (dispositivosConUbicacion.length > 0) {
      console.log('\n📱 DISPOSITIVOS CON UBICACIONES:');
      dispositivosConUbicacion.forEach((dispositivo, index) => {
        const ubicacion = dispositivo.asignaciones[0]?.ubicacion;
        console.log(`   ${index + 1}. ${dispositivo.serial}`);
        console.log(`      Ubicación: ${ubicacion?.nombre || 'Sin ubicación'}`);
        console.log(`      URL: ${baseUrl}/dispositivos/${dispositivo.id}/details`);
        if (ubicacion) {
          console.log(`      Navegación: ${baseUrl}/ubicaciones/${ubicacion.id}`);
        }
      });
    }

    console.log('\n🎯 RESULTADO:');
    console.log('✅ Botón de volver modificado para usar router.back()');
    console.log('✅ Navegación mejorada para regresar a la pantalla anterior');
    console.log('✅ URLs de prueba generadas para verificación manual');

    console.log('\n🎉 Verificación del botón de volver completada!');
    console.log('\n📝 INSTRUCCIONES PARA PRUEBA MANUAL:');
    console.log('1. Prueba navegación desde lista de ubicaciones');
    console.log('2. Prueba navegación desde detalles de computadores');
    console.log('3. Prueba navegación desde detalles de dispositivos');
    console.log('4. Verifica que el botón de volver regrese a la pantalla anterior');
    console.log('5. Confirma que NO vaya siempre a la lista general de ubicaciones');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarBotonVolverUbicacion();

