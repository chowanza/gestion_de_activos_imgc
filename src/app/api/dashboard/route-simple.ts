import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Obteniendo estadísticas del dashboard...');

    // --- 1. ESTADÍSTICAS BÁSICAS ---
    const [
      totalComputadores,
      totalDispositivos,
      totalEmpleados,
      totalEmpresas,
      totalDepartamentos,
      totalUbicaciones
    ] = await Promise.all([
      prisma.computador.count(),
      prisma.dispositivo.count(),
      prisma.empleado.count(),
      prisma.empresa.count(),
      prisma.departamento.count(),
      prisma.ubicacion.count()
    ]);

    // --- 2. ESTADÍSTICAS POR ESTADO ---
    const [computadorEstados, dispositivoEstados] = await Promise.all([
      prisma.computador.groupBy({
        by: ['estado'],
        _count: { estado: true },
      }),
      prisma.dispositivo.groupBy({
        by: ['estado'],
        _count: { estado: true },
      }),
    ]);

    // --- 3. DATOS BÁSICOS ---
    const departamentos = await prisma.departamento.findMany();
    const empresas = await prisma.empresa.findMany();
    const ubicaciones = await prisma.ubicacion.findMany();
    const empleados = await prisma.empleado.findMany();

    // Mapear datos básicos
    const departmentStats = departamentos.map(dept => ({
      name: dept.nombre,
      computers: 0,
      users: 0,
      percentage: 0,
    }));

    const empresaStats = empresas.map(empresa => ({
      name: empresa.nombre,
      computers: 0,
      devices: 0,
      total: 0,
      users: 0,
      departamentos: [],
    }));

    const ubicacionStats = ubicaciones.map(ubicacion => ({
      name: ubicacion.nombre,
      computers: 0,
      devices: 0,
      total: 0,
    }));

    const empleadoStats = empleados.map(empleado => ({
      name: `${empleado.nombre} ${empleado.apellido}`,
      computers: 0,
      devices: 0,
      total: 0,
      departamento: 'Sin departamento',
      empresa: 'Sin empresa',
    }));

    // --- 4. CONSTRUIR RESPUESTA ---
    const dashboardData = {
      // Estadísticas básicas
      totalComputadores,
      totalDispositivos,
      totalEmpleados,
      totalEmpresas,
      totalDepartamentos,
      totalUbicaciones,
      
      // Estadísticas por estado
      computadorEstados: computadorEstados.map(estado => ({
        estado: estado.estado,
        count: estado._count.estado,
      })),
      dispositivoEstados: dispositivoEstados.map(estado => ({
        estado: estado.estado,
        count: estado._count.estado,
      })),
      
      // Estadísticas detalladas
      departmentStats,
      empresaStats,
      ubicacionStats,
      empleadoStats,
      
      // Estadísticas adicionales (simplificadas)
      equiposOperativos: totalComputadores + totalDispositivos,
      equiposDeBaja: 0,
      equiposEnMantenimiento: 0,
      equiposEnResguardo: 0,
      
      // Trends (simplificados)
      computadoresTrend: 0,
      dispositivosTrend: 0,
      empleadosTrend: 0,
      bajaTrend: 0,
      mantenimientoTrend: 0,
    };

    console.log('✅ Dashboard data generado exitosamente');
    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas del dashboard:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


