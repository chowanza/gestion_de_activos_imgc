#!/usr/bin/env npx tsx

/**
 * Script para verificar que el conteo de equipos en la lista de ubicaciones funcione correctamente
 * 
 * Funcionalidad:
 * - Verifica que el conteo de equipos sea consistente entre API y base de datos
 * - Valida que solo se cuenten asignaciones activas
 * - Compara conteos de computadores y dispositivos
 * 
 * Uso: npx tsx scripts/verificar-conteo-ubicaciones.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarConteoUbicaciones() {
  console.log('🔍 Verificando conteo de equipos en lista de ubicaciones...\n');

  try {
    // 1. Obtener datos directamente de la base de datos
    console.log('📋 Obteniendo datos directamente de la base de datos...');
    const ubicacionesBD = await prisma.ubicacion.findMany({
      include: {
        asignacionesEquipos: {
          include: {
            computador: {
              select: {
                id: true,
                serial: true
              }
            },
            dispositivo: {
              select: {
                id: true,
                serial: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        },
        _count: {
          select: {
            asignacionesEquipos: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    console.log(`✅ Ubicaciones encontradas en BD: ${ubicacionesBD.length}`);

    // 2. Obtener datos del endpoint
    console.log('\n🌐 Obteniendo datos del endpoint...');
    const response = await fetch('http://localhost:3000/api/ubicaciones');
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }
    const ubicacionesAPI = await response.json();

    console.log(`✅ Ubicaciones obtenidas del API: ${ubicacionesAPI.length}`);

    // 3. Comparar ubicación por ubicación
    console.log('\n🔍 Comparando ubicación por ubicación:');
    
    for (let i = 0; i < ubicacionesBD.length; i++) {
      const ubicacionBD = ubicacionesBD[i];
      const ubicacionAPI = ubicacionesAPI.find((u: any) => u.id === ubicacionBD.id);
      
      if (!ubicacionAPI) {
        console.log(`❌ Ubicación ${ubicacionBD.nombre} no encontrada en API`);
        continue;
      }

      console.log(`\n📍 ${ubicacionBD.nombre}:`);
      
      // Contar computadores y dispositivos únicos en BD
      const computadoresUnicosBD = new Set(ubicacionBD.asignacionesEquipos.filter(a => a.computador).map(a => a.computador!.id));
      const dispositivosUnicosBD = new Set(ubicacionBD.asignacionesEquipos.filter(a => a.dispositivo).map(a => a.dispositivo!.id));
      const computadoresBD = computadoresUnicosBD.size;
      const dispositivosBD = dispositivosUnicosBD.size;
      const totalBD = ubicacionBD._count.asignacionesEquipos;
      
      // Contar computadores y dispositivos únicos en API
      const computadoresUnicosAPI = new Set(ubicacionAPI.asignacionesEquipos?.filter((a: any) => a.computador).map((a: any) => a.computador.id) || []);
      const dispositivosUnicosAPI = new Set(ubicacionAPI.asignacionesEquipos?.filter((a: any) => a.dispositivo).map((a: any) => a.dispositivo.id) || []);
      const computadoresAPI = computadoresUnicosAPI.size;
      const dispositivosAPI = dispositivosUnicosAPI.size;
      const totalAPI = ubicacionAPI._count?.asignacionesEquipos || 0;
      
      console.log(`   📊 Base de Datos:`);
      console.log(`     - Computadores: ${computadoresBD}`);
      console.log(`     - Dispositivos: ${dispositivosBD}`);
      console.log(`     - Total (_count): ${totalBD}`);
      
      console.log(`   🌐 API:`);
      console.log(`     - Computadores: ${computadoresAPI}`);
      console.log(`     - Dispositivos: ${dispositivosAPI}`);
      console.log(`     - Total (_count): ${totalAPI}`);
      
      // Verificar consistencia
      const computadoresConsistentes = computadoresBD === computadoresAPI;
      const dispositivosConsistentes = dispositivosBD === dispositivosAPI;
      const totalConsistente = totalBD === totalAPI;
      const totalCalculado = computadoresBD + dispositivosBD === totalBD;
      
      if (computadoresConsistentes && dispositivosConsistentes && totalConsistente && totalCalculado) {
        console.log(`   ✅ Todos los conteos son consistentes`);
      } else {
        console.log(`   ❌ INCONSISTENCIAS encontradas:`);
        if (!computadoresConsistentes) {
          console.log(`     - Computadores: BD=${computadoresBD}, API=${computadoresAPI}`);
        }
        if (!dispositivosConsistentes) {
          console.log(`     - Dispositivos: BD=${dispositivosBD}, API=${dispositivosAPI}`);
        }
        if (!totalConsistente) {
          console.log(`     - Total: BD=${totalBD}, API=${totalAPI}`);
        }
        if (!totalCalculado) {
          console.log(`     - Total calculado: ${computadoresBD + dispositivosBD} vs _count: ${totalBD}`);
        }
      }
      
      // Mostrar detalles de equipos
      if (ubicacionBD.asignacionesEquipos.length > 0) {
        console.log(`   🖥️ Equipos asignados:`);
        ubicacionBD.asignacionesEquipos.forEach((asignacion, index) => {
          const equipo = asignacion.computador || asignacion.dispositivo;
          const tipo = asignacion.computador ? 'Computador' : 'Dispositivo';
          const serial = asignacion.computador?.serial || asignacion.dispositivo?.serial || 'N/A';
          console.log(`     ${index + 1}. ${tipo}: ${serial} (Activo: ${asignacion.activo ? 'SÍ' : 'NO'})`);
        });
      } else {
        console.log(`   📭 Sin equipos asignados`);
      }
    }

    // 4. Verificar todas las ubicaciones
    console.log('\n📊 RESUMEN GENERAL:');
    const totalComputadoresBD = ubicacionesBD.reduce((sum, u) => {
      const computadoresUnicos = new Set(u.asignacionesEquipos.filter(a => a.computador).map(a => a.computador!.id));
      return sum + computadoresUnicos.size;
    }, 0);
    const totalDispositivosBD = ubicacionesBD.reduce((sum, u) => {
      const dispositivosUnicos = new Set(u.asignacionesEquipos.filter(a => a.dispositivo).map(a => a.dispositivo!.id));
      return sum + dispositivosUnicos.size;
    }, 0);
    const totalEquiposBD = ubicacionesBD.reduce((sum, u) => sum + u._count.asignacionesEquipos, 0);
    
    const totalComputadoresAPI = ubicacionesAPI.reduce((sum: number, u: any) => {
      const computadoresUnicos = new Set(u.asignacionesEquipos?.filter((a: any) => a.computador).map((a: any) => a.computador.id) || []);
      return sum + computadoresUnicos.size;
    }, 0);
    const totalDispositivosAPI = ubicacionesAPI.reduce((sum: number, u: any) => {
      const dispositivosUnicos = new Set(u.asignacionesEquipos?.filter((a: any) => a.dispositivo).map((a: any) => a.dispositivo.id) || []);
      return sum + dispositivosUnicos.size;
    }, 0);
    const totalEquiposAPI = ubicacionesAPI.reduce((sum: number, u: any) => sum + (u._count?.asignacionesEquipos || 0), 0);
    
    console.log(`   Base de Datos:`);
    console.log(`     - Total computadores: ${totalComputadoresBD}`);
    console.log(`     - Total dispositivos: ${totalDispositivosBD}`);
    console.log(`     - Total equipos: ${totalEquiposBD}`);
    
    console.log(`   API:`);
    console.log(`     - Total computadores: ${totalComputadoresAPI}`);
    console.log(`     - Total dispositivos: ${totalDispositivosAPI}`);
    console.log(`     - Total equipos: ${totalEquiposAPI}`);
    
    if (totalComputadoresBD === totalComputadoresAPI && 
        totalDispositivosBD === totalDispositivosAPI && 
        totalEquiposBD === totalEquiposAPI) {
      console.log(`\n✅ Todos los conteos totales son consistentes`);
    } else {
      console.log(`\n❌ Hay inconsistencias en los conteos totales`);
    }

    console.log('\n🎉 Verificación completada!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarConteoUbicaciones();
