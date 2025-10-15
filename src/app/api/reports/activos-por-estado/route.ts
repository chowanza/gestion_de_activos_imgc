import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estadoEquipo = searchParams.get('estadoEquipo');
    const tipoEquipo = searchParams.get('tipoEquipo');
    const empresaId = searchParams.get('empresaId');
    const departamentoId = searchParams.get('departamentoId');

    console.log('🔍 API Activos por Estado - Parámetros recibidos:', {
      estadoEquipo, tipoEquipo, empresaId, departamentoId
    });

    // Construir filtros para computadores
    const computadorWhere: any = {};
    if (estadoEquipo) {
      computadorWhere.estado = estadoEquipo;
    }

    // Construir filtros para dispositivos
    const dispositivoWhere: any = {};
    if (estadoEquipo) {
      dispositivoWhere.estado = estadoEquipo;
    }

    // Obtener computadores y dispositivos con sus relaciones
    const [computadores, dispositivos] = await Promise.all([
      // Computadores
      prisma.computador.findMany({
        where: computadorWhere,
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
          },
          asignaciones: {
            where: { activo: true },
            include: {
              targetEmpleado: {
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
              },
              ubicacion: true
            }
          }
        },
        orderBy: {
          serial: 'asc'
        }
      }),
      
      // Dispositivos
      prisma.dispositivo.findMany({
        where: dispositivoWhere,
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
          },
          asignaciones: {
            where: { activo: true },
            include: {
              targetEmpleado: {
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
              },
              ubicacion: true
            }
          }
        },
        orderBy: {
          serial: 'asc'
        }
      })
    ]);

    console.log(`📊 Computadores encontrados: ${computadores.length}`);
    console.log(`📊 Dispositivos encontrados: ${dispositivos.length}`);

    // Procesar computadores
    const processedComputadores = computadores.map(comp => {
      // Obtener información del modelo
      let modeloInfo = 'N/A';
      if (comp.computadorModelos?.[0]?.modeloEquipo) {
        const modelo = comp.computadorModelos[0].modeloEquipo;
        const marca = modelo.marcaModelos?.[0]?.marca;
        modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
      }

      // Obtener información de asignación actual
      const asignacionActual = comp.asignaciones?.[0];
      const empleadoAsignado = asignacionActual?.targetEmpleado;
      const organizacion = empleadoAsignado?.organizaciones?.[0];
      
      return {
        id: comp.id,
        tipo: 'Computador',
        serial: comp.serial,
        codigoImgc: comp.codigoImgc,
        modelo: modeloInfo,
        estado: comp.estado,
        fechaCompra: comp.fechaCompra,
        monto: comp.monto,
  // observaciones: comp.observaciones, // Eliminado: no existe en el modelo
        asignacion: asignacionActual ? {
          fechaAsignacion: asignacionActual.date,
          empleado: empleadoAsignado ? 
            `${empleadoAsignado.nombre} ${empleadoAsignado.apellido}` : 'Sin asignar',
          cedula: empleadoAsignado?.ced || 'N/A',
          cargo: organizacion?.cargo?.nombre || 'Sin cargo',
          departamento: organizacion?.departamento?.nombre || 'Sin departamento',
          empresa: organizacion?.empresa?.nombre || 'Sin empresa',
          ubicacion: asignacionActual.ubicacion?.nombre || 'Sin ubicación',
          motivo: asignacionActual.motivo || 'Sin motivo'
        } : null
      };
    });

    // Procesar dispositivos
    const processedDispositivos = dispositivos.map(disp => {
      // Obtener información del modelo
      let modeloInfo = 'N/A';
      if (disp.dispositivoModelos?.[0]?.modeloEquipo) {
        const modelo = disp.dispositivoModelos[0].modeloEquipo;
        const marca = modelo.marcaModelos?.[0]?.marca;
        modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
      }

      // Obtener información de asignación actual
      const asignacionActual = disp.asignaciones?.[0];
      const empleadoAsignado = asignacionActual?.targetEmpleado;
      const organizacion = empleadoAsignado?.organizaciones?.[0];
      
      return {
        id: disp.id,
        tipo: 'Dispositivo',
        serial: disp.serial,
        codigoImgc: disp.codigoImgc,
        modelo: modeloInfo,
        estado: disp.estado,
        fechaCompra: disp.fechaCompra,
        monto: disp.monto,
  // observaciones: disp.observaciones, // Eliminado: no existe en el modelo
        asignacion: asignacionActual ? {
          fechaAsignacion: asignacionActual.date,
          empleado: empleadoAsignado ? 
            `${empleadoAsignado.nombre} ${empleadoAsignado.apellido}` : 'Sin asignar',
          cedula: empleadoAsignado?.ced || 'N/A',
          cargo: organizacion?.cargo?.nombre || 'Sin cargo',
          departamento: organizacion?.departamento?.nombre || 'Sin departamento',
          empresa: organizacion?.empresa?.nombre || 'Sin empresa',
          ubicacion: asignacionActual.ubicacion?.nombre || 'Sin ubicación',
          motivo: asignacionActual.motivo || 'Sin motivo'
        } : null
      };
    });

    // Combinar todos los activos
    let allActivos = [...processedComputadores, ...processedDispositivos];

    // Aplicar filtros adicionales
    if (tipoEquipo) {
      allActivos = allActivos.filter(activo => activo.tipo === tipoEquipo);
    }

    if (empresaId) {
      allActivos = allActivos.filter(activo => 
        activo.asignacion?.empresa === empresaId
      );
    }

    if (departamentoId) {
      allActivos = allActivos.filter(activo => 
        activo.asignacion?.departamento === departamentoId
      );
    }

    console.log(`📊 Activos filtrados: ${allActivos.length}`);

    // Generar estadísticas
    const stats = {
      totalActivos: allActivos.length,
      porTipo: allActivos.reduce((acc, activo) => {
        acc[activo.tipo] = (acc[activo.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porEstado: allActivos.reduce((acc, activo) => {
        acc[activo.estado] = (acc[activo.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porEmpresa: allActivos.reduce((acc, activo) => {
        const empresa = activo.asignacion?.empresa || 'Sin asignar';
        acc[empresa] = (acc[empresa] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porDepartamento: allActivos.reduce((acc, activo) => {
        const departamento = activo.asignacion?.departamento || 'Sin asignar';
        acc[departamento] = (acc[departamento] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      asignados: allActivos.filter(a => a.asignacion !== null).length,
      noAsignados: allActivos.filter(a => a.asignacion === null).length
    };

    return NextResponse.json({
      success: true,
      data: {
        activos: allActivos,
        estadisticas: stats,
        filtros: {
          estadoEquipo,
          tipoEquipo,
          empresaId,
          departamentoId
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de activos por estado:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

