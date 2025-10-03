import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estadoEquipo = searchParams.get('estadoEquipo');
    const tipoEquipo = searchParams.get('tipoEquipo');
    const empresaId = searchParams.get('empresaId');
    const departamentoId = searchParams.get('departamentoId');
    const ubicacionId = searchParams.get('ubicacionId');

    console.log('🔍 API Catálogo Actual - Parámetros recibidos:', {
      estadoEquipo, tipoEquipo, empresaId, departamentoId, ubicacionId
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

    // Obtener todos los computadores y dispositivos con información completa
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
          codigoImgc: 'asc'
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
          codigoImgc: 'asc'
        }
      })
    ]);

    console.log(`📊 Computadores encontrados: ${computadores.length}`);
    console.log(`📊 Dispositivos encontrados: ${dispositivos.length}`);

    // Procesar computadores
    const processedComputadores = computadores.map(comp => {
      // Obtener información del modelo y marca
      let modeloInfo = 'N/A';
      let marcaInfo = 'N/A';
      let tipoEquipo = 'N/A';
      
      if (comp.computadorModelos?.[0]?.modeloEquipo) {
        const modelo = comp.computadorModelos[0].modeloEquipo;
        marcaInfo = modelo.marcaModelos?.[0]?.marca?.nombre || 'N/A';
        modeloInfo = modelo.nombre;
        tipoEquipo = modelo.tipo;
      }

      // Obtener información de asignación actual
      const asignacionActual = comp.asignaciones?.[0];
      const empleadoAsignado = asignacionActual?.targetEmpleado;
      const organizacionAsignada = empleadoAsignado?.organizaciones?.[0];
      
      return {
        id: comp.id,
        tipo: 'Computador',
        serial: comp.serial,
        codigoImgc: comp.codigoImgc,
        marca: marcaInfo,
        modelo: modeloInfo,
        tipoEquipo: tipoEquipo,
        estado: comp.estado,
        fechaCompra: comp.fechaCompra,
        monto: comp.monto,
        observaciones: comp.observaciones,
        activo: comp.activo,
        ubicacion: {
          nombre: asignacionActual?.ubicacion?.nombre || 'Sin ubicación',
          direccion: asignacionActual?.ubicacion?.direccion || 'Sin dirección'
        },
        asignacion: {
          asignado: !!asignacionActual,
          fechaAsignacion: asignacionActual?.date || null,
          empleado: empleadoAsignado ? 
            `${empleadoAsignado.nombre} ${empleadoAsignado.apellido}` : 'Sin asignar',
          cedula: empleadoAsignado?.ced || 'N/A',
          cargo: organizacionAsignada?.cargo?.nombre || 'Sin cargo',
          departamento: organizacionAsignada?.departamento?.nombre || 'Sin departamento',
          empresa: organizacionAsignada?.empresa?.nombre || 'Sin empresa',
          motivo: asignacionActual?.motivo || 'Sin motivo'
        }
      };
    });

    // Procesar dispositivos
    const processedDispositivos = dispositivos.map(disp => {
      // Obtener información del modelo y marca
      let modeloInfo = 'N/A';
      let marcaInfo = 'N/A';
      let tipoEquipo = 'N/A';
      
      if (disp.dispositivoModelos?.[0]?.modeloEquipo) {
        const modelo = disp.dispositivoModelos[0].modeloEquipo;
        marcaInfo = modelo.marcaModelos?.[0]?.marca?.nombre || 'N/A';
        modeloInfo = modelo.nombre;
        tipoEquipo = modelo.tipo;
      }

      // Obtener información de asignación actual
      const asignacionActual = disp.asignaciones?.[0];
      const empleadoAsignado = asignacionActual?.targetEmpleado;
      const organizacionAsignada = empleadoAsignado?.organizaciones?.[0];
      
      return {
        id: disp.id,
        tipo: 'Dispositivo',
        serial: disp.serial,
        codigoImgc: disp.codigoImgc,
        marca: marcaInfo,
        modelo: modeloInfo,
        tipoEquipo: tipoEquipo,
        estado: disp.estado,
        fechaCompra: disp.fechaCompra,
        monto: disp.monto,
        observaciones: disp.observaciones,
        activo: disp.activo,
        ubicacion: {
          nombre: asignacionActual?.ubicacion?.nombre || 'Sin ubicación',
          direccion: asignacionActual?.ubicacion?.direccion || 'Sin dirección'
        },
        asignacion: {
          asignado: !!asignacionActual,
          fechaAsignacion: asignacionActual?.date || null,
          empleado: empleadoAsignado ? 
            `${empleadoAsignado.nombre} ${empleadoAsignado.apellido}` : 'Sin asignar',
          cedula: empleadoAsignado?.ced || 'N/A',
          cargo: organizacionAsignada?.cargo?.nombre || 'Sin cargo',
          departamento: organizacionAsignada?.departamento?.nombre || 'Sin departamento',
          empresa: organizacionAsignada?.empresa?.nombre || 'Sin empresa',
          motivo: asignacionActual?.motivo || 'Sin motivo'
        }
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
        activo.asignacion.empresa === empresaId
      );
    }

    if (departamentoId) {
      allActivos = allActivos.filter(activo => 
        activo.asignacion.departamento === departamentoId
      );
    }

    if (ubicacionId) {
      allActivos = allActivos.filter(activo => 
        activo.ubicacion.nombre === ubicacionId
      );
    }

    console.log(`📊 Activos filtrados: ${allActivos.length}`);

    // Generar estadísticas
    const stats = {
      totalActivos: allActivos.length,
      totalActivosActivos: allActivos.filter(a => a.activo).length,
      totalActivosInactivos: allActivos.filter(a => !a.activo).length,
      porTipo: allActivos.reduce((acc, activo) => {
        acc[activo.tipo] = (acc[activo.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porEstado: allActivos.reduce((acc, activo) => {
        acc[activo.estado] = (acc[activo.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porMarca: allActivos.reduce((acc, activo) => {
        acc[activo.marca] = (acc[activo.marca] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porTipoEquipo: allActivos.reduce((acc, activo) => {
        acc[activo.tipoEquipo] = (acc[activo.tipoEquipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      asignados: allActivos.filter(a => a.asignacion.asignado).length,
      noAsignados: allActivos.filter(a => !a.asignacion.asignado).length,
      porEmpresa: allActivos.reduce((acc, activo) => {
        const empresa = activo.asignacion.empresa;
        acc[empresa] = (acc[empresa] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porDepartamento: allActivos.reduce((acc, activo) => {
        const departamento = activo.asignacion.departamento;
        acc[departamento] = (acc[departamento] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porUbicacion: allActivos.reduce((acc, activo) => {
        const ubicacion = activo.ubicacion.nombre;
        acc[ubicacion] = (acc[ubicacion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      valorTotal: allActivos.reduce((acc, activo) => acc + (activo.monto || 0), 0),
      porAño: allActivos.reduce((acc, activo) => {
        if (activo.fechaCompra) {
          const año = new Date(activo.fechaCompra).getFullYear();
          acc[año] = (acc[año] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
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
          departamentoId,
          ubicacionId
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de catálogo actual:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

