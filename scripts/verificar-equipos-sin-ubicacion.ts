#!/usr/bin/env npx tsx

/**
 * Script para verificar equipos sin ubicación
 * 
 * Funcionalidad:
 * - Identifica todos los equipos que no tienen ubicación asignada
 * - Genera reporte de equipos que necesitan ubicación
 * 
 * Uso: npx tsx scripts/verificar-equipos-sin-ubicacion.ts
 */

import { prisma } from '../src/lib/prisma';

async function verificarEquiposSinUbicacion() {
  console.log('🔍 Verificando equipos sin ubicación...\n');

  try {
    // 1. Obtener todos los computadores
    console.log('📋 Analizando computadores...');
    const computadores = await prisma.computador.findMany({
      include: {
        asignaciones: {
          include: {
            ubicacion: true
          }
        }
      }
    });

    // 2. Obtener todos los dispositivos
    console.log('📋 Analizando dispositivos...');
    const dispositivos = await prisma.dispositivo.findMany({
      include: {
        asignaciones: {
          include: {
            ubicacion: true
          }
        }
      }
    });

    // 3. Identificar computadores sin ubicación
    const computadoresSinUbicacion = computadores.filter(computador => {
      const tieneUbicacion = computador.asignaciones.some(asignacion => asignacion.ubicacion);
      return !tieneUbicacion;
    });

    // 4. Identificar dispositivos sin ubicación
    const dispositivosSinUbicacion = dispositivos.filter(dispositivo => {
      const tieneUbicacion = dispositivo.asignaciones.some(asignacion => asignacion.ubicacion);
      return !tieneUbicacion;
    });

    // 5. Mostrar resultados
    console.log('\n📊 RESULTADOS:');
    console.log(`   - Total computadores: ${computadores.length}`);
    console.log(`   - Computadores sin ubicación: ${computadoresSinUbicacion.length}`);
    console.log(`   - Total dispositivos: ${dispositivos.length}`);
    console.log(`   - Dispositivos sin ubicación: ${dispositivosSinUbicacion.length}`);

    if (computadoresSinUbicacion.length > 0) {
      console.log('\n❌ COMPUTADORES SIN UBICACIÓN:');
      computadoresSinUbicacion.forEach(computador => {
        console.log(`   - ${computador.serial} (${computador.codigoImgc}) - Estado: ${computador.estado}`);
      });
    } else {
      console.log('\n✅ Todos los computadores tienen ubicación asignada');
    }

    if (dispositivosSinUbicacion.length > 0) {
      console.log('\n❌ DISPOSITIVOS SIN UBICACIÓN:');
      dispositivosSinUbicacion.forEach(dispositivo => {
        console.log(`   - ${dispositivo.serial} (${dispositivo.codigoImgc}) - Estado: ${dispositivo.estado}`);
      });
    } else {
      console.log('\n✅ Todos los dispositivos tienen ubicación asignada');
    }

    // 6. Estadísticas por estado
    console.log('\n📈 ESTADÍSTICAS POR ESTADO:');
    
    const estadosComputadores = computadoresSinUbicacion.reduce((acc, comp) => {
      acc[comp.estado] = (acc[comp.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const estadosDispositivos = dispositivosSinUbicacion.reduce((acc, disp) => {
      acc[disp.estado] = (acc[disp.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('   Computadores sin ubicación por estado:');
    Object.entries(estadosComputadores).forEach(([estado, count]) => {
      console.log(`     - ${estado}: ${count}`);
    });

    console.log('   Dispositivos sin ubicación por estado:');
    Object.entries(estadosDispositivos).forEach(([estado, count]) => {
      console.log(`     - ${estado}: ${count}`);
    });

    // 7. Verificar ubicaciones disponibles
    console.log('\n🏢 UBICACIONES DISPONIBLES:');
    const ubicaciones = await prisma.ubicacion.findMany({
      include: {
        _count: {
          select: {
            asignacionesEquipos: true
          }
        }
      }
    });

    console.log(`   - Total ubicaciones: ${ubicaciones.length}`);
    ubicaciones.forEach(ubicacion => {
      console.log(`     - ${ubicacion.nombre}: ${ubicacion._count.asignacionesEquipos} equipos asignados`);
    });

    const totalSinUbicacion = computadoresSinUbicacion.length + dispositivosSinUbicacion.length;
    if (totalSinUbicacion > 0) {
      console.log(`\n⚠️ ATENCIÓN: ${totalSinUbicacion} equipos necesitan ubicación asignada`);
    } else {
      console.log('\n🎉 ¡Todos los equipos tienen ubicación asignada!');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarEquiposSinUbicacion();
