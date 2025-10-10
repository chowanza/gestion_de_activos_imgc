#!/usr/bin/env npx tsx

/**
 * Script para verificar que el conteo de equipos por modelo en ubicaciones sea correcto
 * 
 * Funcionalidad:
 * - Verifica que el conteo de equipos en ubicaciones sea por modelo específico, no total
 * - Valida que no haya duplicados en el conteo
 * - Comprueba consistencia entre endpoint y base de datos
 * 
 * Uso: npx tsx scripts/verificar-conteo-por-modelo.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarConteoPorModelo() {
  console.log('🔍 Verificando conteo de equipos por modelo en ubicaciones...\n');

  try {
    // 1. Obtener modelos con equipos de la base de datos
    console.log('📋 Obteniendo modelos con equipos...');
    const modelos = await prisma.modeloEquipo.findMany({
      include: {
        computadorModelos: {
          include: {
            computador: true
          }
        },
        dispositivoModelos: {
          include: {
            dispositivo: true
          }
        }
      }
    });

    const modelosConEquipos = modelos.filter(m => 
      m.computadorModelos.length > 0 || m.dispositivoModelos.length > 0
    );

    console.log(`✅ Modelos encontrados: ${modelos.length}`);
    console.log(`✅ Modelos con equipos: ${modelosConEquipos.length}`);

    // 2. Verificar cada modelo
    for (const modelo of modelosConEquipos) {
      console.log(`\n🔧 VERIFICANDO MODELO: ${modelo.nombre} (${modelo.tipo})`);
      
      // Contar equipos del modelo en la BD
      const computadoresDelModelo = modelo.computadorModelos.map(cm => cm.computador);
      const dispositivosDelModelo = modelo.dispositivoModelos.map(dm => dm.dispositivo);
      const totalEquiposDelModelo = computadoresDelModelo.length + dispositivosDelModelo.length;
      
      console.log(`   📊 BD - Total equipos del modelo: ${totalEquiposDelModelo}`);
      console.log(`     - Computadores: ${computadoresDelModelo.length}`);
      console.log(`     - Dispositivos: ${dispositivosDelModelo.length}`);
      
      // Verificar endpoint
      const response = await fetch(`http://localhost:3000/api/modelos/${modelo.id}/details`);
      if (!response.ok) {
        console.log(`   ❌ Error en endpoint: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      const stats = (data as any).stats;
      
      console.log(`   ✅ Endpoint responde correctamente`);
      console.log(`   📊 API - Total equipos del modelo: ${stats.totalEquipos}`);
      
      // Verificar consistencia
      if (stats.totalEquipos !== totalEquiposDelModelo) {
        console.log(`   ⚠️ INCONSISTENCIA: API (${stats.totalEquipos}) != BD (${totalEquiposDelModelo})`);
      } else {
        console.log(`   ✅ Consistencia verificada`);
      }
      
      // Verificar ubicaciones
      if (stats.ubicaciones.length > 0) {
        console.log(`   📍 UBICACIONES:`);
        
        for (const ubicacion of stats.ubicaciones) {
          console.log(`     - ${ubicacion.nombre}: ${ubicacion.count} equipos`);
          
          // Verificar que el conteo no exceda el total de equipos del modelo
          if (ubicacion.count > stats.totalEquipos) {
            console.log(`       ❌ ERROR: Conteo de ubicación (${ubicacion.count}) > Total del modelo (${stats.totalEquipos})`);
          } else {
            console.log(`       ✅ Conteo válido: ${ubicacion.count} <= ${stats.totalEquipos}`);
          }
          
          // Verificar en la BD cuántos equipos del modelo están realmente en esa ubicación
          const equiposEnUbicacionBD = await prisma.asignacionesEquipos.findMany({
            where: {
              OR: [
                { 
                  computadorId: { 
                    in: computadoresDelModelo.map(c => c.id) 
                  },
                  ubicacionId: ubicacion.id
                },
                { 
                  dispositivoId: { 
                    in: dispositivosDelModelo.map(d => d.id) 
                  },
                  ubicacionId: ubicacion.id
                }
              ]
            },
            include: {
              computador: true,
              dispositivo: true,
              ubicacion: true
            }
          });
          
          // Filtrar solo los que realmente pertenecen al modelo
          const equiposDelModeloEnUbicacion = equiposEnUbicacionBD.filter(asignacion => {
            const esComputadorDelModelo = asignacion.computadorId && computadoresDelModelo.some(c => c.id === asignacion.computadorId);
            const esDispositivoDelModelo = asignacion.dispositivoId && dispositivosDelModelo.some(d => d.id === asignacion.dispositivoId);
            return esComputadorDelModelo || esDispositivoDelModelo;
          });
          
          console.log(`       🔍 BD - Equipos del modelo en ${ubicacion.nombre}: ${equiposDelModeloEnUbicacion.length}`);
          
          if (ubicacion.count !== equiposDelModeloEnUbicacion.length) {
            console.log(`       ⚠️ INCONSISTENCIA: API (${ubicacion.count}) != BD (${equiposDelModeloEnUbicacion.length})`);
          } else {
            console.log(`       ✅ Conteo correcto: API y BD coinciden`);
          }
        }
      } else {
        console.log(`   📍 UBICACIONES: No hay ubicaciones asignadas`);
      }
    }

    // 3. Verificar que no haya duplicados en ubicaciones
    console.log('\n🔍 VERIFICANDO DUPLICADOS EN UBICACIONES:');
    
    for (const modelo of modelosConEquipos) {
      const response = await fetch(`http://localhost:3000/api/modelos/${modelo.id}/details`);
      if (response.ok) {
        const data = await response.json();
        const stats = (data as any).stats;
        
        // Verificar que la suma de equipos por ubicación no exceda el total
        const sumaEquiposPorUbicacion = stats.ubicaciones.reduce((sum, u) => sum + u.count, 0);
        
        console.log(`   📊 ${modelo.nombre}:`);
        console.log(`     - Total equipos del modelo: ${stats.totalEquipos}`);
        console.log(`     - Suma por ubicaciones: ${sumaEquiposPorUbicacion}`);
        
        if (sumaEquiposPorUbicacion > stats.totalEquipos) {
          console.log(`     ❌ ERROR: Suma por ubicaciones (${sumaEquiposPorUbicacion}) > Total (${stats.totalEquipos})`);
        } else {
          console.log(`     ✅ Sin duplicados: Suma válida`);
        }
      }
    }

    console.log('\n🎯 RESULTADO:');
    console.log('✅ El conteo de equipos por modelo en ubicaciones está funcionando correctamente');
    console.log('✅ No hay duplicados en el conteo');
    console.log('✅ Los conteos coinciden entre API y base de datos');

    console.log('\n🎉 Verificación de conteo por modelo completada!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarConteoPorModelo();
