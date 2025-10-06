#!/usr/bin/env npx tsx

/**
 * Script para verificar la integridad de datos de ubicación de equipos
 * 
 * Funcionalidad:
 * - Verifica que COMP000002 tenga ubicación en las tablas
 * - Compara datos entre endpoints de lista y detalles
 * - Valida consistencia de ubicaciones
 * 
 * Uso: npx tsx scripts/verificar-ubicaciones-equipos.ts
 */

import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function verificarUbicacionesEquipos() {
  console.log('🔍 Verificando integridad de datos de ubicación de equipos...\n');

  try {
    // 1. Buscar COMP000002 en la base de datos
    console.log('📋 Buscando COMP000002 en la base de datos...');
    const computador = await prisma.computador.findFirst({
      where: { serial: 'COMP000002' },
      include: {
        asignaciones: {
          include: {
            ubicacion: true,
            targetEmpleado: {
              include: {
                organizaciones: {
                  where: { activo: true },
                  include: {
                    departamento: true,
                    empresa: true,
                    cargo: true
                  }
                }
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!computador) {
      console.log('❌ COMP000002 no encontrado en la base de datos');
      return;
    }

    console.log('✅ COMP000002 encontrado');
    console.log(`   - Estado: ${computador.estado}`);
    console.log(`   - Código IMGC: ${computador.codigoImgc}`);
    console.log(`   - Total asignaciones: ${computador.asignaciones.length}`);

    // 2. Analizar asignaciones y ubicaciones
    console.log('\n📊 Análisis de asignaciones:');
    const asignacionActiva = computador.asignaciones.find(a => a.activo);
    const ubicacionActiva = asignacionActiva?.ubicacion;
    const ubicacionMasReciente = computador.asignaciones.find(a => a.ubicacion)?.ubicacion;

    console.log(`   - Asignación activa: ${asignacionActiva ? 'SÍ' : 'NO'}`);
    if (asignacionActiva) {
      console.log(`   - Empleado activo: ${asignacionActiva.targetEmpleado?.nombre} ${asignacionActiva.targetEmpleado?.apellido}`);
      console.log(`   - Ubicación activa: ${ubicacionActiva?.nombre || 'Sin ubicación'}`);
    }
    console.log(`   - Ubicación más reciente: ${ubicacionMasReciente?.nombre || 'Sin ubicación'}`);

    // 3. Verificar endpoint de lista de computadores
    console.log('\n🌐 Verificando endpoint de lista de computadores...');
    const responseLista = await fetch('http://localhost:3000/api/computador');
    if (!responseLista.ok) {
      throw new Error(`Error HTTP: ${responseLista.status} ${responseLista.statusText}`);
    }
    const computadoresLista = await responseLista.json();
    const computadorEnLista = computadoresLista.find((c: any) => c.serial === 'COMP000002');

    if (!computadorEnLista) {
      console.log('❌ COMP000002 no encontrado en endpoint de lista');
      return;
    }

    console.log('✅ COMP000002 encontrado en endpoint de lista');
    console.log(`   - Estado: ${computadorEnLista.estado}`);
    console.log(`   - Ubicación: ${computadorEnLista.ubicacion?.nombre || 'Sin ubicación'}`);
    console.log(`   - Empleado: ${computadorEnLista.empleado ? `${computadorEnLista.empleado.nombre} ${computadorEnLista.empleado.apellido}` : 'Sin asignar'}`);

    // 4. Verificar endpoint de detalles
    console.log('\n🌐 Verificando endpoint de detalles...');
    const responseDetalles = await fetch(`http://localhost:3000/api/computador/${computador.id}`);
    if (!responseDetalles.ok) {
      throw new Error(`Error HTTP: ${responseDetalles.status} ${responseDetalles.statusText}`);
    }
    const computadorDetalles = await responseDetalles.json();

    console.log('✅ Detalles obtenidos');
    console.log(`   - Estado: ${computadorDetalles.estado}`);
    console.log(`   - Ubicación: ${computadorDetalles.ubicacion?.nombre || 'Sin ubicación'}`);
    console.log(`   - Empleado: ${computadorDetalles.empleado ? `${computadorDetalles.empleado.nombre} ${computadorDetalles.empleado.apellido}` : 'Sin asignar'}`);

    // 5. Comparar consistencia
    console.log('\n🔍 Comparando consistencia entre endpoints:');
    
    const ubicacionLista = computadorEnLista.ubicacion?.nombre;
    const ubicacionDetalles = computadorDetalles.ubicacion?.nombre;
    
    if (ubicacionLista === ubicacionDetalles) {
      console.log('✅ Ubicaciones consistentes entre lista y detalles');
    } else {
      console.log('❌ INCONSISTENCIA en ubicaciones:');
      console.log(`   - Lista: ${ubicacionLista || 'Sin ubicación'}`);
      console.log(`   - Detalles: ${ubicacionDetalles || 'Sin ubicación'}`);
    }

    const estadoLista = computadorEnLista.estado;
    const estadoDetalles = computadorDetalles.estado;
    
    if (estadoLista === estadoDetalles) {
      console.log('✅ Estados consistentes entre lista y detalles');
    } else {
      console.log('❌ INCONSISTENCIA en estados:');
      console.log(`   - Lista: ${estadoLista}`);
      console.log(`   - Detalles: ${estadoDetalles}`);
    }

    // 6. Verificar lógica de ubicación
    console.log('\n🧠 Verificando lógica de ubicación:');
    const ubicacionEsperada = asignacionActiva?.ubicacion || ubicacionMasReciente;
    
    if (ubicacionEsperada) {
      console.log(`✅ Ubicación esperada: ${ubicacionEsperada.nombre}`);
      if (ubicacionLista === ubicacionEsperada.nombre) {
        console.log('✅ Lógica de ubicación funciona correctamente en lista');
      } else {
        console.log('❌ Lógica de ubicación NO funciona en lista');
      }
      if (ubicacionDetalles === ubicacionEsperada.nombre) {
        console.log('✅ Lógica de ubicación funciona correctamente en detalles');
      } else {
        console.log('❌ Lógica de ubicación NO funciona en detalles');
      }
    } else {
      console.log('⚠️ No hay ubicación esperada (equipo sin ubicaciones en asignaciones)');
    }

    // 7. Verificar otros equipos con ubicaciones
    console.log('\n📊 Verificando otros equipos con ubicaciones...');
    const equiposConUbicacion = await prisma.computador.findMany({
      where: {
        asignaciones: {
          some: {
            ubicacion: {
              isNot: null
            }
          }
        }
      },
      include: {
        asignaciones: {
          include: {
            ubicacion: true
          }
        }
      },
      take: 5
    });

    console.log(`   - Equipos con ubicaciones encontrados: ${equiposConUbicacion.length}`);
    equiposConUbicacion.forEach(equipo => {
      const ubicacion = equipo.asignaciones.find(a => a.ubicacion)?.ubicacion;
      console.log(`   - ${equipo.serial}: ${ubicacion?.nombre || 'Sin ubicación'}`);
    });

    console.log('\n🎉 Verificación completada!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verificarUbicacionesEquipos();
