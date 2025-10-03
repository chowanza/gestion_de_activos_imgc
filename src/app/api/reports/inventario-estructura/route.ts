import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const departamentoId = searchParams.get('departamentoId');
    const includeDetails = searchParams.get('includeDetails') === 'true';

    console.log('🔍 API Inventario Estructural - Parámetros recibidos:', {
      empresaId, departamentoId, includeDetails
    });

    // Construir filtros para empresas
    const empresaWhere: any = {};
    if (empresaId) {
      empresaWhere.id = empresaId;
    }

    // Obtener empresas con sus departamentos y equipos asignados
    const empresas = await prisma.empresa.findMany({
      where: empresaWhere,
      include: {
        empresaDepartamentos: {
          where: departamentoId ? { id: departamentoId } : {},
          include: {
            departamento: true,
            ...(includeDetails ? {
              empleados: {
                where: { fechaDesincorporacion: null }, // Solo empleados activos
                include: {
                  organizaciones: {
                    where: { activo: true },
                    include: {
                      empresa: true,
                      departamento: true,
                      cargo: true
                    }
                  }
                }
              }
            } : {})
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    console.log(`📊 Empresas encontradas: ${empresas.length}`);

    // Procesar datos estructurales
    const estructuraInventario = empresas.map(empresa => {
      const departamentos = empresa.empresaDepartamentos.map(empDep => {
        const departamento = empDep.departamento;
        
        // Obtener empleados activos del departamento
        const empleadosActivos = includeDetails ? empDep.empleados : [];
        
        // Calcular estadísticas por departamento
        const statsDepartamento = {
          totalEmpleados: empleadosActivos.length,
          totalAsignaciones: 0,
          computadoresAsignados: 0,
          dispositivosAsignados: 0
        };

        // Si se incluyen detalles, calcular asignaciones
        if (includeDetails && empleadosActivos.length > 0) {
          empleadosActivos.forEach(empleado => {
            // Aquí se podría agregar lógica para contar asignaciones por empleado
            // Por ahora, asumimos que cada empleado activo puede tener asignaciones
            statsDepartamento.totalAsignaciones += 1; // Placeholder
          });
        }

        return {
          id: departamento.id,
          nombre: departamento.nombre,
          descripcion: departamento.descripcion,
          estadisticas: statsDepartamento,
          empleados: includeDetails ? empleadosActivos.map(emp => ({
            id: emp.id,
            nombre: `${emp.nombre} ${emp.apellido}`,
            cedula: emp.ced,
            cargo: emp.organizaciones[0]?.cargo?.nombre || 'Sin cargo',
            activo: emp.fechaDesincorporacion === null
          })) : []
        };
      });

      // Calcular estadísticas por empresa
      const statsEmpresa = {
        totalDepartamentos: departamentos.length,
        totalEmpleados: departamentos.reduce((acc, dep) => acc + dep.estadisticas.totalEmpleados, 0),
        totalAsignaciones: departamentos.reduce((acc, dep) => acc + dep.estadisticas.totalAsignaciones, 0),
        computadoresAsignados: departamentos.reduce((acc, dep) => acc + dep.estadisticas.computadoresAsignados, 0),
        dispositivosAsignados: departamentos.reduce((acc, dep) => acc + dep.estadisticas.dispositivosAsignados, 0)
      };

      return {
        id: empresa.id,
        nombre: empresa.nombre,
        descripcion: empresa.descripcion,
        ruc: empresa.ruc,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        email: empresa.email,
        estadisticas: statsEmpresa,
        departamentos: departamentos
      };
    });

    // Generar estadísticas generales
    const statsGenerales = {
      totalEmpresas: estructuraInventario.length,
      totalDepartamentos: estructuraInventario.reduce((acc, emp) => acc + emp.estadisticas.totalDepartamentos, 0),
      totalEmpleados: estructuraInventario.reduce((acc, emp) => acc + emp.estadisticas.totalEmpleados, 0),
      totalAsignaciones: estructuraInventario.reduce((acc, emp) => acc + emp.estadisticas.totalAsignaciones, 0),
      distribucionPorEmpresa: estructuraInventario.map(emp => ({
        empresa: emp.nombre,
        departamentos: emp.estadisticas.totalDepartamentos,
        empleados: emp.estadisticas.totalEmpleados,
        asignaciones: emp.estadisticas.totalAsignaciones
      }))
    };

    return NextResponse.json({
      success: true,
      data: {
        estructura: estructuraInventario,
        estadisticas: statsGenerales,
        filtros: {
          empresaId,
          departamentoId,
          includeDetails
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de inventario estructural:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

