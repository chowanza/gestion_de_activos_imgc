#!/usr/bin/env npx tsx

/**
 * Script para verificar que la información de uso en detalles del catálogo esté correcta
 * 
 * Funcionalidad:
 * - Verifica que equipos asignados tengan empresa, departamento, empleado y ubicación
 * - Verifica que equipos no asignados tengan al menos ubicación
 * - Valida consistencia de datos entre asignaciones activas e inactivas
 * 
 * Uso: npx tsx scripts/verificar-detalles-catalogo.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarDetallesCatalogo() {
  console.log('🔍 Verificando detalles del catálogo...\n');

  try {
    // 1. Obtener equipos de la base de datos
    console.log('📋 Obteniendo equipos de la base de datos...');
    const computadores = await prisma.computador.findMany({
      include: {
        asignaciones: {
          include: {
            targetEmpleado: {
              include: {
                organizaciones: {
                  where: { activo: true },
                  include: {
                    cargo: true,
                    departamento: true,
                    empresa: true
                  }
                }
              }
            },
            ubicacion: true
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    const dispositivos = await prisma.dispositivo.findMany({
      include: {
        asignaciones: {
          include: {
            targetEmpleado: {
              include: {
                organizaciones: {
                  where: { activo: true },
                  include: {
                    cargo: true,
                    departamento: true,
                    empresa: true
                  }
                }
              }
            },
            ubicacion: true
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    console.log(`✅ Computadores encontrados: ${computadores.length}`);
    console.log(`✅ Dispositivos encontrados: ${dispositivos.length}`);

    // 2. Verificar cada computador
    console.log('\n🖥️ VERIFICANDO COMPUTADORES:');
    for (const computador of computadores) {
      console.log(`\n📱 ${computador.serial} (${computador.estado}):`);
      
      // Obtener asignación activa
      const asignacionActiva = computador.asignaciones.find(a => a.activo);
      
      // Obtener ubicación (activa o más reciente)
      const ubicacion = asignacionActiva?.ubicacion || 
        computador.asignaciones.find(a => a.ubicacion)?.ubicacion || null;
      
      console.log(`   - Ubicación: ${ubicacion?.nombre || 'Sin ubicación'}`);
      
      if (asignacionActiva?.targetEmpleado) {
        const empleado = asignacionActiva.targetEmpleado;
        const organizacion = empleado.organizaciones[0];
        
        console.log(`   ✅ ASIGNADO:`);
        console.log(`     - Empleado: ${empleado.nombre} ${empleado.apellido}`);
        console.log(`     - Empresa: ${organizacion?.empresa?.nombre || 'Sin empresa'}`);
        console.log(`     - Departamento: ${organizacion?.departamento?.nombre || 'Sin departamento'}`);
        console.log(`     - Cargo: ${organizacion?.cargo?.nombre || 'Sin cargo'}`);
        console.log(`     - Ubicación asignación: ${asignacionActiva.ubicacion?.nombre || 'Sin ubicación'}`);
      } else {
        console.log(`   ⚠️ NO ASIGNADO:`);
        console.log(`     - Solo tiene ubicación: ${ubicacion?.nombre || 'Sin ubicación'}`);
      }
      
      // Verificar endpoint
      const response = await fetch(`http://localhost:3000/api/computador/${computador.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`   🌐 API - Ubicación: ${data.ubicacion?.nombre || 'Sin ubicación'}`);
        if (data.empleado) {
          console.log(`   🌐 API - Empleado: ${data.empleado.nombre} ${data.empleado.apellido}`);
          console.log(`   🌐 API - Empresa: ${data.empleado.empresa?.nombre || 'Sin empresa'}`);
        }
      }
    }

    // 3. Verificar cada dispositivo
    console.log('\n🖨️ VERIFICANDO DISPOSITIVOS:');
    for (const dispositivo of dispositivos) {
      console.log(`\n📱 ${dispositivo.serial} (${dispositivo.estado}):`);
      
      // Obtener asignación activa
      const asignacionActiva = dispositivo.asignaciones.find(a => a.activo);
      
      // Obtener ubicación (activa o más reciente)
      const ubicacion = asignacionActiva?.ubicacion || 
        dispositivo.asignaciones.find(a => a.ubicacion)?.ubicacion || null;
      
      console.log(`   - Ubicación: ${ubicacion?.nombre || 'Sin ubicación'}`);
      
      if (asignacionActiva?.targetEmpleado) {
        const empleado = asignacionActiva.targetEmpleado;
        const organizacion = empleado.organizaciones[0];
        
        console.log(`   ✅ ASIGNADO:`);
        console.log(`     - Empleado: ${empleado.nombre} ${empleado.apellido}`);
        console.log(`     - Empresa: ${organizacion?.empresa?.nombre || 'Sin empresa'}`);
        console.log(`     - Departamento: ${organizacion?.departamento?.nombre || 'Sin departamento'}`);
        console.log(`     - Cargo: ${organizacion?.cargo?.nombre || 'Sin cargo'}`);
        console.log(`     - Ubicación asignación: ${asignacionActiva.ubicacion?.nombre || 'Sin ubicación'}`);
      } else {
        console.log(`   ⚠️ NO ASIGNADO:`);
        console.log(`     - Solo tiene ubicación: ${ubicacion?.nombre || 'Sin ubicación'}`);
      }
      
      // Verificar endpoint
      const response = await fetch(`http://localhost:3000/api/dispositivos/${dispositivo.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`   🌐 API - Ubicación: ${data.ubicacion?.nombre || 'Sin ubicación'}`);
        if (data.empleado) {
          console.log(`   🌐 API - Empleado: ${data.empleado.nombre} ${data.empleado.apellido}`);
          console.log(`   🌐 API - Empresa: ${data.empleado.empresa?.nombre || 'Sin empresa'}`);
        }
      }
    }

    // 4. Estadísticas generales
    console.log('\n📊 ESTADÍSTICAS GENERALES:');
    
    const computadoresAsignados = computadores.filter(c => c.asignaciones.some(a => a.activo && a.targetEmpleado)).length;
    const computadoresConUbicacion = computadores.filter(c => 
      c.asignaciones.some(a => a.ubicacion)
    ).length;
    
    const dispositivosAsignados = dispositivos.filter(d => d.asignaciones.some(a => a.activo && a.targetEmpleado)).length;
    const dispositivosConUbicacion = dispositivos.filter(d => 
      d.asignaciones.some(a => a.ubicacion)
    ).length;
    
    console.log(`   Computadores:`);
    console.log(`     - Total: ${computadores.length}`);
    console.log(`     - Asignados: ${computadoresAsignados}`);
    console.log(`     - Con ubicación: ${computadoresConUbicacion}`);
    console.log(`     - Sin ubicación: ${computadores.length - computadoresConUbicacion}`);
    
    console.log(`   Dispositivos:`);
    console.log(`     - Total: ${dispositivos.length}`);
    console.log(`     - Asignados: ${dispositivosAsignados}`);
    console.log(`     - Con ubicación: ${dispositivosConUbicacion}`);
    console.log(`     - Sin ubicación: ${dispositivos.length - dispositivosConUbicacion}`);

    // 5. Verificar reglas de negocio
    console.log('\n🔍 VERIFICANDO REGLAS DE NEGOCIO:');
    
    let equiposSinUbicacion = 0;
    let equiposAsignadosSinEmpresa = 0;
    let equiposAsignadosSinDepartamento = 0;
    
    [...computadores, ...dispositivos].forEach(equipo => {
      const asignacionActiva = equipo.asignaciones.find(a => a.activo);
      const ubicacion = asignacionActiva?.ubicacion || 
        equipo.asignaciones.find(a => a.ubicacion)?.ubicacion || null;
      
      // Regla: Todos los equipos deben tener ubicación
      if (!ubicacion) {
        equiposSinUbicacion++;
      }
      
      // Regla: Equipos asignados deben tener empresa y departamento
      if (asignacionActiva?.targetEmpleado) {
        const organizacion = asignacionActiva.targetEmpleado.organizaciones[0];
        if (!organizacion?.empresa) {
          equiposAsignadosSinEmpresa++;
        }
        if (!organizacion?.departamento) {
          equiposAsignadosSinDepartamento++;
        }
      }
    });
    
    console.log(`   ${equiposSinUbicacion === 0 ? '✅' : '❌'} Equipos sin ubicación: ${equiposSinUbicacion}`);
    console.log(`   ${equiposAsignadosSinEmpresa === 0 ? '✅' : '❌'} Equipos asignados sin empresa: ${equiposAsignadosSinEmpresa}`);
    console.log(`   ${equiposAsignadosSinDepartamento === 0 ? '✅' : '❌'} Equipos asignados sin departamento: ${equiposAsignadosSinDepartamento}`);
    
    if (equiposSinUbicacion === 0 && equiposAsignadosSinEmpresa === 0 && equiposAsignadosSinDepartamento === 0) {
      console.log('\n✅ Todas las reglas de negocio se cumplen correctamente');
    } else {
      console.log('\n⚠️ Se encontraron violaciones de reglas de negocio');
    }

    console.log('\n🎉 Verificación completada!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarDetallesCatalogo();
