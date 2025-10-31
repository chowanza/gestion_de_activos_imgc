import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/role-middleware';

export async function GET(request: NextRequest) {
  const deny = await requirePermission('canView')(request as any);
  if (deny) return deny;
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

    // --- 3. DATOS BÁSICOS + RELACIONES NORMALIZADAS ---
    const [
      departamentos,
      empresas,
      ubicaciones,
      empleados,
      organizaciones,
      asignacionesActivas
    ] = await Promise.all([
      prisma.departamento.findMany(),
      prisma.empresa.findMany(),
      prisma.ubicacion.findMany(),
      prisma.empleado.findMany({ select: { id: true, nombre: true, apellido: true } }),
      prisma.empleadoEmpresaDepartamentoCargo.findMany({
        where: { activo: true },
        select: { empleadoId: true, departamentoId: true, empresaId: true }
      }),
      prisma.asignacionesEquipos.findMany({
        where: { activo: true },
        select: { targetEmpleadoId: true, computadorId: true, dispositivoId: true }
      })
    ]);

    // Índices rápidos
    const empNombre = new Map<string, string>(
      empleados.map(e => [e.id, `${e.nombre} ${e.apellido}`])
    );

    // Map deptId -> Set empleadoIds
    const deptToEmployees = new Map<string, Set<string>>();
    // Map empresaId -> Set empleadoIds
    const empresaToEmployees = new Map<string, Set<string>>();
    // Map empresaId -> Set departamentoIds
    const empresaToDepartamentos = new Map<string, Set<string>>();

    for (const org of organizaciones) {
      if (org.departamentoId) {
        if (!deptToEmployees.has(org.departamentoId)) deptToEmployees.set(org.departamentoId, new Set());
        deptToEmployees.get(org.departamentoId)!.add(org.empleadoId);
      }
      if (org.empresaId) {
        if (!empresaToEmployees.has(org.empresaId)) empresaToEmployees.set(org.empresaId, new Set());
        empresaToEmployees.get(org.empresaId)!.add(org.empleadoId);
      }
      if (org.empresaId && org.departamentoId) {
        if (!empresaToDepartamentos.has(org.empresaId)) empresaToDepartamentos.set(org.empresaId, new Set());
        empresaToDepartamentos.get(org.empresaId)!.add(org.departamentoId);
      }
    }

    // Map empleadoId -> {computers, devices}
    const empleadoEquipos = new Map<string, { computers: number; devices: number }>();
    for (const a of asignacionesActivas) {
      const empId = a.targetEmpleadoId || '';
      if (!empId) continue;
      if (!empleadoEquipos.has(empId)) empleadoEquipos.set(empId, { computers: 0, devices: 0 });
      const agg = empleadoEquipos.get(empId)!;
      if (a.computadorId) agg.computers += 1;
      if (a.dispositivoId) agg.devices += 1;
    }

    // Helper: compute counts for a set of employees
    const computeCountsForEmployees = (empIds: Set<string>) => {
      let computers = 0;
      let devices = 0;
      let withAny = 0;
      for (const id of empIds) {
        const stats = empleadoEquipos.get(id) || { computers: 0, devices: 0 };
        computers += stats.computers;
        devices += stats.devices;
        if ((stats.computers + stats.devices) > 0) withAny += 1;
      }
      const totalUsers = empIds.size;
      const percentage = totalUsers > 0 ? Math.round((withAny / totalUsers) * 100) : 0;
      return { computers, devices, total: computers + devices, users: totalUsers, withAny, percentage };
    };

    // Construir departmentStats
    const departmentStats = departamentos.map(dept => {
      const empIds = deptToEmployees.get(dept.id) || new Set<string>();
      const counts = computeCountsForEmployees(empIds);
      return {
        name: dept.nombre,
        computers: counts.computers,
        users: counts.users,
        percentage: counts.percentage,
      };
    });

    // Construir empresaStats con breakdown por departamento
    const empresaStats = empresas.map(empresa => {
      const empIds = empresaToEmployees.get(empresa.id) || new Set<string>();
      const counts = computeCountsForEmployees(empIds);
      const deptIds = empresaToDepartamentos.get(empresa.id) || new Set<string>();
      const departamentosDetalle = Array.from(deptIds).map(deptId => {
        const dept = departamentos.find(d => d.id === deptId);
        const ids = deptToEmployees.get(deptId) || new Set<string>();
        const c = computeCountsForEmployees(ids);
        return {
          name: dept?.nombre || 'Departamento',
          computers: c.computers,
          devices: c.devices,
          total: c.total,
          users: c.users,
          percentage: c.percentage,
        };
      });
      return {
        name: empresa.nombre,
        computers: counts.computers,
        devices: counts.devices,
        total: counts.total,
        users: counts.users,
        // Cobertura de empleados con al menos un equipo asignado en la empresa
        coveragePercentage: counts.percentage,
        departamentos: departamentosDetalle,
      };
    });

    const ubicacionStats = ubicaciones.map(ubicacion => ({
      name: ubicacion.nombre,
      computers: 0,
      devices: 0,
      total: 0,
    }));

    const empleadoStats = empleados.map(empleado => {
      const stats = empleadoEquipos.get(empleado.id) || { computers: 0, devices: 0 };
      return {
        name: `${empleado.nombre} ${empleado.apellido}`,
        computers: stats.computers,
        devices: stats.devices,
        total: stats.computers + stats.devices,
        departamento: 'Sin departamento',
        empresa: 'Sin empresa',
      };
    });

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


