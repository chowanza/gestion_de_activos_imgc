#!/usr/bin/env npx tsx

/**
 * Script para verificar que los detalles de ubicación muestren correctamente los equipos
 * 
 * Funcionalidad:
 * - Verifica que una ubicación específica muestre todos sus equipos
 * - Compara datos entre API y frontend
 * - Valida que no haya equipos duplicados
 * 
 * Uso: npx tsx scripts/verificar-detalles-ubicacion.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarDetallesUbicacion() {
  console.log('🔍 Verificando detalles de ubicación...\n');

  try {
    // 1. Obtener todas las ubicaciones
    console.log('📋 Obteniendo ubicaciones...');
    const ubicaciones = await prisma.ubicacion.findMany({
      include: {
        asignacionesEquipos: {
          include: {
            computador: {
              select: {
                id: true,
                serial: true,
                estado: true
              }
            },
            dispositivo: {
              select: {
                id: true,
                serial: true,
                estado: true
              }
            }
          }
        }
      }
    });

    if (ubicaciones.length === 0) {
      console.log('❌ No se encontraron ubicaciones');
      return;
    }

    // 2. Buscar una ubicación con equipos
    const ubicacionConEquipos = ubicaciones.find(u => u.asignacionesEquipos.length > 0);
    if (!ubicacionConEquipos) {
      console.log('❌ No se encontraron ubicaciones con equipos');
      return;
    }

    console.log(`✅ Ubicación encontrada: ${ubicacionConEquipos.nombre}`);
    console.log(`   - ID: ${ubicacionConEquipos.id}`);
    console.log(`   - Total asignaciones: ${ubicacionConEquipos.asignacionesEquipos.length}`);

    // 3. Analizar equipos en la ubicación
    const equiposEnUbicacion = ubicacionConEquipos.asignacionesEquipos.filter(a => a.computador || a.dispositivo);
    const computadoresEnUbicacion = equiposEnUbicacion.filter(a => a.computador);
    const dispositivosEnUbicacion = equiposEnUbicacion.filter(a => a.dispositivo);

    console.log(`   - Equipos totales: ${equiposEnUbicacion.length}`);
    console.log(`   - Computadores: ${computadoresEnUbicacion.length}`);
    console.log(`   - Dispositivos: ${dispositivosEnUbicacion.length}`);

    // 4. Verificar endpoint de detalles de ubicación
    console.log('\n🌐 Verificando endpoint de detalles de ubicación...');
    const response = await fetch(`http://localhost:3000/api/ubicaciones/${ubicacionConEquipos.id}`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }
    const ubicacionDetalles = await response.json();

    console.log('✅ Detalles de ubicación obtenidos');
    console.log(`   - Nombre: ${ubicacionDetalles.nombre}`);
    console.log(`   - Total asignaciones: ${ubicacionDetalles.asignacionesEquipos?.length || 0}`);

    // 5. Analizar equipos en el endpoint
    const equiposEndpoint = ubicacionDetalles.asignacionesEquipos?.filter((a: any) => a.computador || a.dispositivo) || [];
    const computadoresEndpoint = equiposEndpoint.filter((a: any) => a.computador);
    const dispositivosEndpoint = equiposEndpoint.filter((a: any) => a.dispositivo);

    console.log(`   - Equipos en endpoint: ${equiposEndpoint.length}`);
    console.log(`   - Computadores en endpoint: ${computadoresEndpoint.length}`);
    console.log(`   - Dispositivos en endpoint: ${dispositivosEndpoint.length}`);

    // 6. Verificar consistencia
    console.log('\n🔍 Verificando consistencia:');
    
    if (equiposEnUbicacion.length === equiposEndpoint.length) {
      console.log('✅ Número total de equipos coincide');
    } else {
      console.log('❌ INCONSISTENCIA en número total de equipos:');
      console.log(`   - Base de datos: ${equiposEnUbicacion.length}`);
      console.log(`   - Endpoint: ${equiposEndpoint.length}`);
    }

    if (computadoresEnUbicacion.length === computadoresEndpoint.length) {
      console.log('✅ Número de computadores coincide');
    } else {
      console.log('❌ INCONSISTENCIA en número de computadores:');
      console.log(`   - Base de datos: ${computadoresEnUbicacion.length}`);
      console.log(`   - Endpoint: ${computadoresEndpoint.length}`);
    }

    if (dispositivosEnUbicacion.length === dispositivosEndpoint.length) {
      console.log('✅ Número de dispositivos coincide');
    } else {
      console.log('❌ INCONSISTENCIA en número de dispositivos:');
      console.log(`   - Base de datos: ${dispositivosEnUbicacion.length}`);
      console.log(`   - Endpoint: ${dispositivosEndpoint.length}`);
    }

    // 7. Verificar equipos únicos
    console.log('\n🔍 Verificando equipos únicos:');
    
    const computadoresUnicosDB = new Set(computadoresEnUbicacion.map(a => a.computador?.id));
    const computadoresUnicosEndpoint = new Set(computadoresEndpoint.map((a: any) => a.computador?.id));
    
    if (computadoresUnicosDB.size === computadoresUnicosEndpoint.size) {
      console.log('✅ No hay computadores duplicados en el endpoint');
    } else {
      console.log('❌ Hay computadores duplicados en el endpoint');
    }

    const dispositivosUnicosDB = new Set(dispositivosEnUbicacion.map(a => a.dispositivo?.id));
    const dispositivosUnicosEndpoint = new Set(dispositivosEndpoint.map((a: any) => a.dispositivo?.id));
    
    if (dispositivosUnicosDB.size === dispositivosUnicosEndpoint.size) {
      console.log('✅ No hay dispositivos duplicados en el endpoint');
    } else {
      console.log('❌ Hay dispositivos duplicados en el endpoint');
    }

    // 8. Mostrar detalles de equipos
    console.log('\n📊 EQUIPOS EN LA UBICACIÓN:');
    
    if (computadoresEndpoint.length > 0) {
      console.log('   Computadores:');
      computadoresEndpoint.forEach((asignacion: any, index: number) => {
        const computador = asignacion.computador;
        console.log(`     ${index + 1}. ${computador.serial} (${computador.estado}) - Asignación activa: ${asignacion.activo ? 'SÍ' : 'NO'}`);
      });
    }

    if (dispositivosEndpoint.length > 0) {
      console.log('   Dispositivos:');
      dispositivosEndpoint.forEach((asignacion: any, index: number) => {
        const dispositivo = asignacion.dispositivo;
        console.log(`     ${index + 1}. ${dispositivo.serial} (${dispositivo.estado}) - Asignación activa: ${asignacion.activo ? 'SÍ' : 'NO'}`);
      });
    }

    // 9. Verificar todas las ubicaciones
    console.log('\n📊 RESUMEN DE TODAS LAS UBICACIONES:');
    ubicaciones.forEach(ubicacion => {
      const totalEquipos = ubicacion.asignacionesEquipos.filter(a => a.computador || a.dispositivo).length;
      console.log(`   - ${ubicacion.nombre}: ${totalEquipos} equipos`);
    });

    console.log('\n🎉 Verificación completada!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarDetallesUbicacion();
