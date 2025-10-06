#!/usr/bin/env npx tsx

/**
 * Script para verificar que la navegación a empleados desde ubicaciones funcione correctamente
 * 
 * Funcionalidad:
 * - Verifica que los empleados tengan IDs válidos en los datos de ubicación
 * - Valida que la estructura de datos sea correcta para la navegación
 * 
 * Uso: npx tsx scripts/verificar-navegacion-empleados.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarNavegacionEmpleados() {
  console.log('🔍 Verificando navegación a empleados desde ubicaciones...\n');

  try {
    // 1. Obtener ubicación con equipos asignados
    console.log('📋 Obteniendo ubicación con equipos...');
    const ubicacion = await prisma.ubicacion.findFirst({
      where: {
        asignacionesEquipos: {
          some: {}
        }
      },
      include: {
        asignacionesEquipos: {
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

    if (!ubicacion) {
      console.log('❌ No se encontró ubicación con equipos asignados');
      return;
    }

    console.log(`✅ Ubicación encontrada: ${ubicacion.nombre}`);
    console.log(`   - ID: ${ubicacion.id}`);
    console.log(`   - Total asignaciones: ${ubicacion.asignacionesEquipos.length}`);

    // 2. Verificar endpoint de detalles de ubicación
    console.log('\n🌐 Verificando endpoint de detalles de ubicación...');
    const response = await fetch(`http://localhost:3000/api/ubicaciones/${ubicacion.id}`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }
    const ubicacionDetalles = await response.json();

    console.log('✅ Detalles de ubicación obtenidos');

    // 3. Analizar empleados en las asignaciones
    const asignacionesConEmpleados = ubicacionDetalles.asignacionesEquipos?.filter((a: any) => a.targetEmpleado) || [];
    console.log(`   - Asignaciones con empleados: ${asignacionesConEmpleados.length}`);

    if (asignacionesConEmpleados.length === 0) {
      console.log('⚠️ No hay asignaciones con empleados en esta ubicación');
      return;
    }

    // 4. Verificar estructura de datos de empleados
    console.log('\n👥 Verificando estructura de datos de empleados:');
    let empleadosValidos = 0;
    let empleadosConIdValido = 0;

    asignacionesConEmpleados.forEach((asignacion: any, index: number) => {
      const empleado = asignacion.targetEmpleado;
      console.log(`\n   Empleado ${index + 1}:`);
      console.log(`     - ID: ${empleado.id || 'SIN ID'}`);
      console.log(`     - Nombre: ${empleado.nombre} ${empleado.apellido}`);
      
      if (empleado.id) {
        empleadosConIdValido++;
        console.log(`     ✅ ID válido para navegación`);
      } else {
        console.log(`     ❌ FALTA ID - No se puede navegar a detalles`);
      }

      // Verificar organizaciones
      if (empleado.organizaciones && empleado.organizaciones.length > 0) {
        const org = empleado.organizaciones[0];
        console.log(`     - Departamento: ${org.departamento?.nombre || 'Sin departamento'}`);
        console.log(`     - Empresa: ${org.empresa?.nombre || 'Sin empresa'}`);
        empleadosValidos++;
      } else {
        console.log(`     ⚠️ Sin organizaciones activas`);
      }
    });

    // 5. Verificar URLs de navegación
    console.log('\n🔗 URLs de navegación generadas:');
    asignacionesConEmpleados.forEach((asignacion: any, index: number) => {
      const empleado = asignacion.targetEmpleado;
      if (empleado.id) {
        const url = `/empleados/${empleado.id}`;
        console.log(`   ${index + 1}. ${empleado.nombre} ${empleado.apellido} → ${url}`);
      }
    });

    // 6. Verificar empleados únicos
    const empleadosUnicos = new Set();
    asignacionesConEmpleados.forEach((asignacion: any) => {
      if (asignacion.targetEmpleado?.id) {
        empleadosUnicos.add(asignacion.targetEmpleado.id);
      }
    });

    console.log(`\n📊 RESUMEN:`);
    console.log(`   - Total asignaciones con empleados: ${asignacionesConEmpleados.length}`);
    console.log(`   - Empleados únicos: ${empleadosUnicos.size}`);
    console.log(`   - Empleados con ID válido: ${empleadosConIdValido}`);
    console.log(`   - Empleados con organizaciones: ${empleadosValidos}`);

    if (empleadosConIdValido === empleadosUnicos.size) {
      console.log('\n✅ Todos los empleados tienen IDs válidos para navegación');
    } else {
      console.log('\n❌ Algunos empleados no tienen IDs válidos');
    }

    // 7. Verificar que los empleados existan en la base de datos
    console.log('\n🔍 Verificando existencia de empleados en BD...');
    for (const empleadoId of empleadosUnicos) {
      const empleadoEnBD = await prisma.empleado.findUnique({
        where: { id: empleadoId as string },
        select: { id: true, nombre: true, apellido: true }
      });

      if (empleadoEnBD) {
        console.log(`   ✅ ${empleadoEnBD.nombre} ${empleadoEnBD.apellido} (${empleadoEnBD.id})`);
      } else {
        console.log(`   ❌ Empleado con ID ${empleadoId} no encontrado en BD`);
      }
    }

    console.log('\n🎉 Verificación completada!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarNavegacionEmpleados();
