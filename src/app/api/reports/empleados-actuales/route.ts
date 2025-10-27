import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/role-middleware';

export async function GET(request: NextRequest) {
  const deny = await requirePermission('canView')(request as any);
  if (deny) return deny;
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const departamentoId = searchParams.get('departamentoId');
    const cargoId = searchParams.get('cargoId');

    console.log('🔍 API Empleados Actuales - Parámetros recibidos:', {
      empresaId, departamentoId, cargoId
    });

    // Construir filtros para empleados activos
    const empleadoWhere: any = {
      fechaDesincorporacion: null // Solo empleados activos
    };

    // Filtros opcionales
    if (empresaId || departamentoId || cargoId) {
      empleadoWhere.organizaciones = {
        some: {
          activo: true,
          ...(empresaId && { empresaId }),
          ...(departamentoId && { departamentoId }),
          ...(cargoId && { cargoId })
        }
      };
    }

    // Obtener empleados con toda la información organizacional
    const empleados = await prisma.empleado.findMany({
      where: empleadoWhere,
      include: {
        organizaciones: {
          where: { activo: true },
          include: {
            empresa: {
              include: {
                empresaDepartamentos: {
                  include: {
                    departamento: true
                  }
                }
              }
            },
            departamento: true,
            cargo: true
          }
        },
        asignacionesComoTarget: {
          where: { activo: true },
          include: {
            computador: {
              include: {
                computadorModelos: {
                  include: {
                    modeloEquipo: {
                      include: {
                        marcaModelos: {
                          include: {
                            marca: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            dispositivo: {
              include: {
                dispositivoModelos: {
                  include: {
                    modeloEquipo: {
                      include: {
                        marcaModelos: {
                          include: {
                            marca: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    });

    console.log(`📊 Empleados encontrados: ${empleados.length}`);

    // Procesar datos de empleados
    const processedEmpleados = empleados.map(empleado => {
      const organizacion = empleado.organizaciones?.[0];
      const empresa = organizacion?.empresa;
      const departamento = organizacion?.departamento;
      const cargo = organizacion?.cargo;

      // Contar equipos asignados
      const equiposAsignados = empleado.asignacionesComoTarget || [];
      const computadoresAsignados = equiposAsignados.filter(a => a.itemType === 'Computador').length;
      const dispositivosAsignados = equiposAsignados.filter(a => a.itemType === 'Dispositivo').length;

      // Obtener información de equipos asignados
      const equiposInfo = equiposAsignados.map(asignacion => {
        const equipo = asignacion.computador || asignacion.dispositivo;
        let modeloInfo = 'N/A';
        if (equipo && 'computadorModelos' in equipo && Array.isArray(equipo.computadorModelos) && equipo.computadorModelos[0]?.modeloEquipo) {
          const modelo = equipo.computadorModelos[0].modeloEquipo;
          const marca = modelo.marcaModelos?.[0]?.marca;
          modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
        } else if (equipo && 'dispositivoModelos' in equipo && Array.isArray(equipo.dispositivoModelos) && equipo.dispositivoModelos[0]?.modeloEquipo) {
          const modelo = equipo.dispositivoModelos[0].modeloEquipo;
          const marca = modelo.marcaModelos?.[0]?.marca;
          modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
        }

        return {
          tipo: asignacion.itemType,
          serial: equipo?.serial || 'N/A',
          modelo: modeloInfo,
          estado: equipo?.estado || 'N/A'
        };
      });

      return {
        id: empleado.id,
        nombreCompleto: `${empleado.nombre} ${empleado.apellido}`,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        cedula: empleado.ced,
        email: empleado.email || 'Sin email',
        telefono: empleado.telefono || 'Sin teléfono',
        fechaIngreso: empleado.fechaIngreso,
        fechaDesincorporacion: empleado.fechaDesincorporacion,
        organizacion: {
          empresa: empresa?.nombre || 'Sin empresa',
          departamento: departamento?.nombre || 'Sin departamento',
          cargo: cargo?.nombre || 'Sin cargo',
          empresaId: empresa?.id,
          departamentoId: departamento?.id,
          cargoId: cargo?.id
        },
        equipos: {
          totalAsignados: equiposAsignados.length,
          computadores: computadoresAsignados,
          dispositivos: dispositivosAsignados,
          detalle: equiposInfo
        },
        estado: empleado.fechaDesincorporacion ? 'Inactivo' : 'Activo'
      };
    });

    // Generar estadísticas
    const stats = {
      totalEmpleados: processedEmpleados.length,
      empleadosActivos: processedEmpleados.filter(e => e.estado === 'Activo').length,
      empleadosInactivos: processedEmpleados.filter(e => e.estado === 'Inactivo').length,
      porEmpresa: processedEmpleados.reduce((acc, emp) => {
        acc[emp.organizacion.empresa] = (acc[emp.organizacion.empresa] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porDepartamento: processedEmpleados.reduce((acc, emp) => {
        acc[emp.organizacion.departamento] = (acc[emp.organizacion.departamento] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porCargo: processedEmpleados.reduce((acc, emp) => {
        acc[emp.organizacion.cargo] = (acc[emp.organizacion.cargo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalEquiposAsignados: processedEmpleados.reduce((acc, emp) => acc + emp.equipos.totalAsignados, 0),
      equiposPorTipo: {
        computadores: processedEmpleados.reduce((acc, emp) => acc + emp.equipos.computadores, 0),
        dispositivos: processedEmpleados.reduce((acc, emp) => acc + emp.equipos.dispositivos, 0)
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        empleados: processedEmpleados,
        estadisticas: stats,
        filtros: {
          empresaId,
          departamentoId,
          cargoId
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de empleados actuales:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

