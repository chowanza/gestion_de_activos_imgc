/**
 * Script de prueba para verificar los seis nuevos endpoints de reportes V2
 * Ejecuta pruebas básicas de conectividad y estructura de datos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  endpoint: string;
  status: 'success' | 'error';
  dataCount?: number;
  error?: string;
  responseTime?: number;
}

async function testEndpoint(endpoint: string, params: Record<string, string> = {}): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const url = new URL(`http://localhost:3000${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    console.log(`🔍 Probando endpoint: ${endpoint}`);
    console.log(`📋 Parámetros:`, params);

    const response = await fetch(url.toString());
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        endpoint,
        status: 'error',
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime
      };
    }

    const data = await response.json();
    
    if (!data.success) {
      return {
        endpoint,
        status: 'error',
        error: data.message || 'Respuesta sin éxito',
        responseTime
      };
    }

    // Contar elementos de datos según el tipo de endpoint
    let dataCount = 0;
    if (data.data) {
      if (data.data.empleados) dataCount = data.data.empleados.length;
      else if (data.data.asignaciones) dataCount = data.data.asignaciones.length;
      else if (data.data.modificaciones) dataCount = data.data.modificaciones.length;
      else if (data.data.equipos) dataCount = data.data.equipos.length;
      else if (data.data.ubicaciones) dataCount = data.data.ubicaciones.length;
      else if (data.data.activos) dataCount = data.data.activos.length;
      else if (data.data.movimientos) dataCount = data.data.movimientos.length;
    }

    console.log(`✅ Éxito: ${dataCount} elementos encontrados en ${responseTime}ms`);
    
    return {
      endpoint,
      status: 'success',
      dataCount,
      responseTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      endpoint,
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
      responseTime
    };
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de endpoints de reportes V2...\n');

  const tests: Array<{ endpoint: string; params: Record<string, string>; description: string }> = [
    {
      endpoint: '/api/reports/empleados-actuales',
      params: {},
      description: '1. Datos Actuales de Empleados'
    },
    {
      endpoint: '/api/reports/asignaciones-modificaciones',
      params: { type: 'asignaciones', startDate: '2025-01-01', endDate: '2025-12-31' },
      description: '2A. Asignaciones (Sub-Reporte)'
    },
    {
      endpoint: '/api/reports/asignaciones-modificaciones',
      params: { type: 'modificaciones', startDate: '2025-01-01', endDate: '2025-12-31' },
      description: '2B. Modificaciones (Sub-Reporte)'
    },
    {
      endpoint: '/api/reports/equipos-por-estado',
      params: {},
      description: '3. Estado Equipos por Estado'
    },
    {
      endpoint: '/api/reports/ubicaciones-inventario',
      params: {},
      description: '4. Equipos por Ubicación'
    },
    {
      endpoint: '/api/reports/catalogo-actual',
      params: {},
      description: '5. Estado Actual del Catálogo'
    },
    {
      endpoint: '/api/reports/audit-logger',
      params: { startDate: '2025-01-01', endDate: '2025-12-31' },
      description: '6. Movimientos (Audit Logger)'
    }
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    console.log(`\n📊 ${test.description}`);
    console.log('─'.repeat(50));
    
    const result = await testEndpoint(test.endpoint, test.params);
    results.push(result);
    
    if (result.status === 'success') {
      console.log(`✅ ${test.description}: ${result.dataCount} elementos (${result.responseTime}ms)`);
    } else {
      console.log(`❌ ${test.description}: ${result.error}`);
    }
    
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📈 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'error');

  console.log(`✅ Exitosos: ${successful.length}/${results.length}`);
  console.log(`❌ Fallidos: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    const avgResponseTime = successful.reduce((acc, r) => acc + (r.responseTime || 0), 0) / successful.length;
    const totalData = successful.reduce((acc, r) => acc + (r.dataCount || 0), 0);
    
    console.log(`⏱️  Tiempo promedio de respuesta: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`📊 Total de elementos encontrados: ${totalData}`);
  }

  if (failed.length > 0) {
    console.log('\n❌ ENDPOINTS CON ERRORES:');
    failed.forEach(result => {
      console.log(`   • ${result.endpoint}: ${result.error}`);
    });
  }

  console.log('\n🎯 PRUEBAS COMPLETADAS');
  
  // Verificar datos de prueba en la base de datos
  console.log('\n🔍 VERIFICANDO DATOS DE PRUEBA EN BD...');
  
  try {
    const empleadosCount = await prisma.empleado.count();
    const computadoresCount = await prisma.computador.count();
    const dispositivosCount = await prisma.dispositivo.count();
    const asignacionesCount = await prisma.asignacionesEquipos.count();
    const modificacionesCount = await prisma.historialModificaciones.count();
    const ubicacionesCount = await prisma.ubicacion.count();

    console.log(`👥 Empleados en BD: ${empleadosCount}`);
    console.log(`💻 Computadores en BD: ${computadoresCount}`);
    console.log(`📱 Dispositivos en BD: ${dispositivosCount}`);
    console.log(`🔗 Asignaciones en BD: ${asignacionesCount}`);
    console.log(`📝 Modificaciones en BD: ${modificacionesCount}`);
    console.log(`🏢 Ubicaciones en BD: ${ubicacionesCount}`);

    if (empleadosCount === 0 || computadoresCount === 0 || dispositivosCount === 0) {
      console.log('\n⚠️  ADVERTENCIA: La base de datos parece estar vacía o con pocos datos de prueba.');
      console.log('   Considera ejecutar el script de seed para poblar la BD con datos de prueba.');
    }

  } catch (error) {
    console.error('❌ Error verificando datos de BD:', error);
  }
}

// Ejecutar las pruebas
runTests()
  .then(() => {
    console.log('\n✨ Script de prueba completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando pruebas:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

