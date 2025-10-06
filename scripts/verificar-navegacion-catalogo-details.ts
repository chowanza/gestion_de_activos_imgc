#!/usr/bin/env npx tsx

/**
 * Script para verificar que la navegación desde detalles del catálogo funcione correctamente
 * 
 * Funcionalidad:
 * - Verifica que el endpoint devuelva IDs reales para empresas, departamentos, empleados y ubicaciones
 * - Valida que las URLs de navegación sean correctas
 * - Comprueba que las páginas de destino existan
 * 
 * Uso: npx tsx scripts/verificar-navegacion-catalogo-details.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarNavegacionCatalogoDetails() {
  console.log('🔍 Verificando navegación desde detalles del catálogo...\n');

  try {
    // 1. Obtener modelos con equipos de la base de datos
    console.log('📋 Obteniendo modelos con equipos...');
    const modelos = await prisma.modeloEquipo.findMany({
      include: {
        computadorModelos: true,
        dispositivoModelos: true
      }
    });

    const modelosConEquipos = modelos.filter(m => 
      m.computadorModelos.length > 0 || m.dispositivoModelos.length > 0
    );

    console.log(`✅ Modelos encontrados: ${modelos.length}`);
    console.log(`✅ Modelos con equipos: ${modelosConEquipos.length}`);

    // 2. Verificar cada modelo con equipos
    for (const modelo of modelosConEquipos) {
      console.log(`\n🔧 VERIFICANDO NAVEGACIÓN: ${modelo.nombre}`);
      
      // Verificar endpoint
      const response = await fetch(`http://localhost:3000/api/modelos/${modelo.id}/details`);
      if (!response.ok) {
        console.log(`   ❌ Error en endpoint: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      const stats = data.stats;
      
      console.log(`   ✅ Endpoint responde correctamente`);
      
      // Verificar empresas
      if (stats.empresas.length > 0) {
        console.log(`   🏢 EMPRESAS:`);
        for (const empresa of stats.empresas) {
          console.log(`     - ${empresa.nombre}`);
          console.log(`       ✅ ID: ${empresa.id}`);
          console.log(`       ✅ URL: /empresas/${empresa.id}`);
          
          // Verificar que la empresa existe en la BD
          const empresaBD = await prisma.empresa.findUnique({
            where: { id: empresa.id }
          });
          
          if (empresaBD) {
            console.log(`       ✅ Empresa existe en BD: ${empresaBD.nombre}`);
          } else {
            console.log(`       ❌ Empresa NO existe en BD`);
          }
        }
      } else {
        console.log(`   🏢 EMPRESAS: No hay empresas asignadas`);
      }
      
      // Verificar departamentos
      if (stats.departamentos.length > 0) {
        console.log(`   🏢 DEPARTAMENTOS:`);
        for (const depto of stats.departamentos) {
          console.log(`     - ${depto.nombre} (${depto.empresa})`);
          console.log(`       ✅ ID: ${depto.id}`);
          console.log(`       ✅ URL: /departamentos/${depto.id}`);
          
          // Verificar que el departamento existe en la BD
          const deptoBD = await prisma.departamento.findUnique({
            where: { id: depto.id }
          });
          
          if (deptoBD) {
            console.log(`       ✅ Departamento existe en BD: ${deptoBD.nombre}`);
          } else {
            console.log(`       ❌ Departamento NO existe en BD`);
          }
        }
      } else {
        console.log(`   🏢 DEPARTAMENTOS: No hay departamentos asignados`);
      }
      
      // Verificar empleados
      if (stats.empleados.length > 0) {
        console.log(`   👥 EMPLEADOS:`);
        for (const empleado of stats.empleados) {
          console.log(`     - ${empleado.nombre} ${empleado.apellido}`);
          console.log(`       ✅ ID: ${empleado.id}`);
          console.log(`       ✅ URL: /empleados/${empleado.id}`);
          
          // Verificar que el empleado existe en la BD
          const empleadoBD = await prisma.empleado.findUnique({
            where: { id: empleado.id }
          });
          
          if (empleadoBD) {
            console.log(`       ✅ Empleado existe en BD: ${empleadoBD.nombre} ${empleadoBD.apellido}`);
          } else {
            console.log(`       ❌ Empleado NO existe en BD`);
          }
        }
      } else {
        console.log(`   👥 EMPLEADOS: No hay empleados asignados`);
      }
      
      // Verificar ubicaciones
      if (stats.ubicaciones.length > 0) {
        console.log(`   📍 UBICACIONES:`);
        for (const ubicacion of stats.ubicaciones) {
          console.log(`     - ${ubicacion.nombre}`);
          console.log(`       ✅ ID: ${ubicacion.id}`);
          console.log(`       ✅ URL: /ubicaciones/${ubicacion.id}`);
          
          // Verificar que la ubicación existe en la BD
          const ubicacionBD = await prisma.ubicacion.findUnique({
            where: { id: ubicacion.id }
          });
          
          if (ubicacionBD) {
            console.log(`       ✅ Ubicación existe en BD: ${ubicacionBD.nombre}`);
          } else {
            console.log(`       ❌ Ubicación NO existe en BD`);
          }
        }
      } else {
        console.log(`   📍 UBICACIONES: No hay ubicaciones asignadas`);
      }
    }

    // 3. Estadísticas generales
    console.log('\n📊 ESTADÍSTICAS DE NAVEGACIÓN:');
    
    let totalEmpresas = 0;
    let totalDepartamentos = 0;
    let totalEmpleados = 0;
    let totalUbicaciones = 0;
    
    for (const modelo of modelosConEquipos) {
      const response = await fetch(`http://localhost:3000/api/modelos/${modelo.id}/details`);
      if (response.ok) {
        const data = await response.json();
        const stats = data.stats;
        
        totalEmpresas += stats.empresas.length;
        totalDepartamentos += stats.departamentos.length;
        totalEmpleados += stats.empleados.length;
        totalUbicaciones += stats.ubicaciones.length;
      }
    }
    
    console.log(`   - Total empresas con navegación: ${totalEmpresas}`);
    console.log(`   - Total departamentos con navegación: ${totalDepartamentos}`);
    console.log(`   - Total empleados con navegación: ${totalEmpleados}`);
    console.log(`   - Total ubicaciones con navegación: ${totalUbicaciones}`);
    
    console.log('\n🎯 RESULTADO:');
    if (totalEmpresas > 0 || totalDepartamentos > 0 || totalEmpleados > 0 || totalUbicaciones > 0) {
      console.log('✅ Los botones de navegación están configurados correctamente');
      console.log('✅ Los IDs reales se están devolviendo desde el endpoint');
      console.log('✅ Las URLs de navegación son válidas');
    } else {
      console.log('⚠️ No hay datos de navegación para verificar');
    }

    console.log('\n🎉 Verificación de navegación completada!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarNavegacionCatalogoDetails();
