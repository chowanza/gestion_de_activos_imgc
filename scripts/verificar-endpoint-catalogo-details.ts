#!/usr/bin/env npx tsx

/**
 * Script para verificar que el endpoint de detalles del catálogo funcione correctamente
 * 
 * Funcionalidad:
 * - Verifica que el endpoint /api/modelos/[id]/details devuelva datos correctos
 * - Valida que las estadísticas de uso sean consistentes con la base de datos
 * - Comprueba que las ubicaciones se muestren incluso para equipos no asignados
 * 
 * Uso: npx tsx scripts/verificar-endpoint-catalogo-details.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarEndpointCatalogoDetails() {
  console.log('🔍 Verificando endpoint de detalles del catálogo...\n');

  try {
    // 1. Obtener modelos de la base de datos
    console.log('📋 Obteniendo modelos de la base de datos...');
    const modelos = await prisma.modeloEquipo.findMany({
      include: {
        marcaModelos: {
          include: {
            marca: true
          }
        },
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

    console.log(`✅ Modelos encontrados: ${modelos.length}`);

    // 2. Verificar cada modelo
    for (const modelo of modelos) {
      console.log(`\n🔧 VERIFICANDO MODELO: ${modelo.nombre} (${modelo.tipo})`);
      
      // Verificar endpoint
      const response = await fetch(`http://localhost:3000/api/modelos/${modelo.id}/details`);
      if (!response.ok) {
        console.log(`   ❌ Error en endpoint: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      const stats = data.stats;
      
      console.log(`   ✅ Endpoint responde correctamente`);
      console.log(`   📊 Estadísticas:`);
      console.log(`     - Total equipos: ${stats.totalEquipos}`);
      console.log(`     - Computadores: ${stats.totalComputadores}`);
      console.log(`     - Dispositivos: ${stats.totalDispositivos}`);
      
      // Verificar estados
      console.log(`   📈 Estados:`);
      console.log(`     - ASIGNADO: ${stats.estados.ASIGNADO}`);
      console.log(`     - OPERATIVO: ${stats.estados.OPERATIVO}`);
      console.log(`     - EN_MANTENIMIENTO: ${stats.estados.EN_MANTENIMIENTO}`);
      console.log(`     - DE_BAJA: ${stats.estados.DE_BAJA}`);
      console.log(`     - EN_RESGUARDO: ${stats.estados.EN_RESGUARDO}`);
      
      // Verificar empresas
      if (stats.empresas.length > 0) {
        console.log(`   🏢 Empresas:`);
        stats.empresas.forEach(empresa => {
          console.log(`     - ${empresa.nombre}: ${empresa.count} equipos`);
        });
      } else {
        console.log(`   🏢 Empresas: No hay equipos asignados`);
      }
      
      // Verificar departamentos
      if (stats.departamentos.length > 0) {
        console.log(`   🏢 Departamentos:`);
        stats.departamentos.forEach(depto => {
          console.log(`     - ${depto.nombre} (${depto.empresa}): ${depto.count} equipos`);
        });
      } else {
        console.log(`   🏢 Departamentos: No hay equipos asignados`);
      }
      
      // Verificar empleados
      if (stats.empleados.length > 0) {
        console.log(`   👥 Empleados:`);
        stats.empleados.forEach(empleado => {
          console.log(`     - ${empleado.nombre} ${empleado.apellido}: ${empleado.count} equipos`);
        });
      } else {
        console.log(`   👥 Empleados: No hay empleados asignados`);
      }
      
      // Verificar ubicaciones
      if (stats.ubicaciones.length > 0) {
        console.log(`   📍 Ubicaciones:`);
        stats.ubicaciones.forEach(ubicacion => {
          console.log(`     - ${ubicacion.nombre}: ${ubicacion.count} equipos`);
        });
      } else {
        console.log(`   ❌ Ubicaciones: No hay equipos en ubicaciones específicas`);
      }
      
      // Verificar consistencia con la base de datos
      const totalEquiposBD = modelo.computadorModelos.length + modelo.dispositivoModelos.length;
      if (stats.totalEquipos !== totalEquiposBD) {
        console.log(`   ⚠️ INCONSISTENCIA: Total equipos API (${stats.totalEquipos}) != BD (${totalEquiposBD})`);
      } else {
        console.log(`   ✅ Consistencia verificada: Total equipos coincide`);
      }
      
      // Verificar que todos los equipos tengan ubicación
      const computadores = modelo.computadorModelos.map(cm => cm.computador);
      const dispositivos = modelo.dispositivoModelos.map(dm => dm.dispositivo);
      const todosLosEquipos = [...computadores, ...dispositivos];
      
      if (todosLosEquipos.length > 0 && stats.ubicaciones.length === 0) {
        console.log(`   ❌ PROBLEMA: Hay ${todosLosEquipos.length} equipos pero no se muestran ubicaciones`);
      } else if (todosLosEquipos.length > 0 && stats.ubicaciones.length > 0) {
        console.log(`   ✅ CORRECTO: Se muestran ubicaciones para los equipos`);
      }
    }

    // 3. Estadísticas generales
    console.log('\n📊 ESTADÍSTICAS GENERALES:');
    
    let modelosConEquipos = 0;
    let modelosConUbicaciones = 0;
    let modelosConAsignaciones = 0;
    
    for (const modelo of modelos) {
      const response = await fetch(`http://localhost:3000/api/modelos/${modelo.id}/details`);
      if (response.ok) {
        const data = await response.json();
        const stats = data.stats;
        
        if (stats.totalEquipos > 0) {
          modelosConEquipos++;
        }
        if (stats.ubicaciones.length > 0) {
          modelosConUbicaciones++;
        }
        if (stats.empresas.length > 0 || stats.empleados.length > 0) {
          modelosConAsignaciones++;
        }
      }
    }
    
    console.log(`   - Total modelos: ${modelos.length}`);
    console.log(`   - Modelos con equipos: ${modelosConEquipos}`);
    console.log(`   - Modelos con ubicaciones: ${modelosConUbicaciones}`);
    console.log(`   - Modelos con asignaciones: ${modelosConAsignaciones}`);
    
    if (modelosConEquipos === modelosConUbicaciones) {
      console.log('\n✅ Todos los modelos con equipos tienen ubicaciones mostradas');
    } else {
      console.log('\n⚠️ Algunos modelos con equipos no muestran ubicaciones');
    }

    console.log('\n🎉 Verificación del endpoint completada!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarEndpointCatalogoDetails();
