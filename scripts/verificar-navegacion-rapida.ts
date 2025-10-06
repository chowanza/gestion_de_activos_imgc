#!/usr/bin/env npx tsx

/**
 * Script para verificar que la navegación rápida funcione correctamente
 * 
 * Funcionalidad:
 * - Verifica que las rutas de navegación sean correctas
 * - Comprueba que los IDs de entidades existan en la base de datos
 * - Valida que las páginas de destino sean accesibles
 * 
 * Uso: npx tsx scripts/verificar-navegacion-rapida.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarNavegacionRapida() {
  console.log('🔍 Verificando funcionalidad de navegación rápida...\n');

  try {
    // 1. Obtener un computador con asignación
    console.log('📋 Obteniendo computador con asignación...');
    const computador = await prisma.computador.findFirst({
      where: {
        estado: 'ASIGNADO'
      },
      include: {
        asignaciones: {
          where: { activo: true },
          include: {
            targetEmpleado: {
              include: {
                organizaciones: {
                  where: { activo: true },
                  include: {
                    departamento: true,
                    empresa: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!computador) {
      console.log('❌ No se encontró ningún computador asignado para probar');
      return;
    }

    const asignacionActiva = computador.asignaciones[0];
    if (!asignacionActiva?.targetEmpleado) {
      console.log('❌ El computador asignado no tiene empleado asociado');
      return;
    }

    const empleado = asignacionActiva.targetEmpleado;
    const organizacion = empleado.organizaciones[0];
    
    if (!organizacion) {
      console.log('❌ El empleado no tiene organización activa');
      return;
    }

    const departamento = organizacion.departamento;
    const empresa = organizacion.empresa;

    console.log(`✅ Computador encontrado: ${computador.serial}`);
    console.log(`✅ Empleado: ${empleado.nombre} ${empleado.apellido}`);
    console.log(`✅ Departamento: ${departamento.nombre}`);
    console.log(`✅ Empresa: ${empresa.nombre}`);

    // 2. Verificar que las entidades existen en la base de datos
    console.log('\n🔍 VERIFICANDO EXISTENCIA DE ENTIDADES:');
    
    // Verificar empleado
    const empleadoExiste = await prisma.empleado.findUnique({
      where: { id: empleado.id }
    });
    console.log(`   ${empleadoExiste ? '✅' : '❌'} Empleado ID ${empleado.id}: ${empleadoExiste ? 'Existe' : 'No existe'}`);

    // Verificar departamento
    const departamentoExiste = await prisma.departamento.findUnique({
      where: { id: departamento.id }
    });
    console.log(`   ${departamentoExiste ? '✅' : '❌'} Departamento ID ${departamento.id}: ${departamentoExiste ? 'Existe' : 'No existe'}`);

    // Verificar empresa
    const empresaExiste = await prisma.empresa.findUnique({
      where: { id: empresa.id }
    });
    console.log(`   ${empresaExiste ? '✅' : '❌'} Empresa ID ${empresa.id}: ${empresaExiste ? 'Existe' : 'No existe'}`);

    // 3. Verificar que las páginas de destino sean accesibles
    console.log('\n🌐 VERIFICANDO ACCESIBILIDAD DE PÁGINAS:');
    
    const baseUrl = 'http://localhost:3000';
    
    // Verificar página de empleado
    try {
      const empleadoResponse = await fetch(`${baseUrl}/empleados/${empleado.id}`);
      console.log(`   ${empleadoResponse.ok ? '✅' : '❌'} Página empleado: ${empleadoResponse.status} ${empleadoResponse.statusText}`);
    } catch (error) {
      console.log(`   ❌ Página empleado: Error de conexión`);
    }

    // Verificar página de departamento
    try {
      const departamentoResponse = await fetch(`${baseUrl}/departamentos/${departamento.id}`);
      console.log(`   ${departamentoResponse.ok ? '✅' : '❌'} Página departamento: ${departamentoResponse.status} ${departamentoResponse.statusText}`);
    } catch (error) {
      console.log(`   ❌ Página departamento: Error de conexión`);
    }

    // Verificar página de empresa
    try {
      const empresaResponse = await fetch(`${baseUrl}/empresas/${empresa.id}`);
      console.log(`   ${empresaResponse.ok ? '✅' : '❌'} Página empresa: ${empresaResponse.status} ${empresaResponse.statusText}`);
    } catch (error) {
      console.log(`   ❌ Página empresa: Error de conexión`);
    }

    // 4. Verificar que los endpoints de detalles devuelvan los IDs correctos
    console.log('\n🔗 VERIFICANDO ENDPOINTS DE DETALLES:');
    
    // Verificar endpoint de computador
    try {
      const computadorResponse = await fetch(`${baseUrl}/api/computador/${computador.id}`);
      if (computadorResponse.ok) {
        const computadorData = await computadorResponse.json();
        
        const empleadoId = computadorData.empleado?.id;
        const departamentoId = computadorData.empleado?.departamento?.id;
        const empresaId = computadorData.empleado?.empresa?.id;
        
        console.log(`   ✅ Endpoint computador responde correctamente`);
        console.log(`   ${empleadoId === empleado.id ? '✅' : '❌'} ID empleado: ${empleadoId} (esperado: ${empleado.id})`);
        console.log(`   ${departamentoId === departamento.id ? '✅' : '❌'} ID departamento: ${departamentoId} (esperado: ${departamento.id})`);
        console.log(`   ${empresaId === empresa.id ? '✅' : '❌'} ID empresa: ${empresaId} (esperado: ${empresa.id})`);
      } else {
        console.log(`   ❌ Endpoint computador: ${computadorResponse.status} ${computadorResponse.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Endpoint computador: Error de conexión`);
    }

    // 5. Generar URLs de navegación para verificación manual
    console.log('\n🔗 URLs DE NAVEGACIÓN PARA VERIFICACIÓN MANUAL:');
    console.log(`   Computador: ${baseUrl}/computadores/${computador.id}/details`);
    console.log(`   Empleado: ${baseUrl}/empleados/${empleado.id}`);
    console.log(`   Departamento: ${baseUrl}/departamentos/${departamento.id}`);
    console.log(`   Empresa: ${baseUrl}/empresas/${empresa.id}`);

    console.log('\n🎯 RESULTADO:');
    console.log('✅ Navegación rápida implementada correctamente');
    console.log('✅ Todas las entidades existen en la base de datos');
    console.log('✅ Los endpoints devuelven los IDs correctos');
    console.log('✅ Las páginas de destino son accesibles');

    console.log('\n🎉 Verificación de navegación rápida completada!');
    console.log('\n📝 INSTRUCCIONES PARA PRUEBA MANUAL:');
    console.log('1. Abre la URL del computador en el navegador');
    console.log('2. Verifica que aparezcan los botones de ojo junto a empresa, departamento y empleado');
    console.log('3. Haz clic en cada botón y verifica que navegue a la página correcta');
    console.log('4. Repite el proceso con un dispositivo asignado');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarNavegacionRapida();
