import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const actionType = searchParams.get('actionType');
    const itemType = searchParams.get('itemType');
    const usuarioId = searchParams.get('usuarioId');
    const empresaId = searchParams.get('empresaId');
    const departamentoId = searchParams.get('departamentoId');

    console.log('🔍 API Audit Logger - Parámetros recibidos:', {
      startDate, endDate, actionType, itemType, usuarioId, empresaId, departamentoId
    });

    // Construir filtros para historial de modificaciones
    const modificacionesWhere: any = {};

    // Filtros de fecha
    if (startDate && endDate) {
      modificacionesWhere.fecha = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Filtros por tipo de acción
    if (actionType) {
      modificacionesWhere.accion = actionType;
    }

    // Filtros por tipo de item
    if (itemType) {
      if (itemType === 'Computador') {
        modificacionesWhere.computadorId = { not: null };
      } else if (itemType === 'Dispositivo') {
        modificacionesWhere.dispositivoId = { not: null };
      }
    }

    // Obtener historial de modificaciones
    const modificaciones = await prisma.historialModificaciones.findMany({
      where: modificacionesWhere,
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
                }
              }
            }
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    // Obtener asignaciones de equipos para audit logger
    const asignacionesWhere: any = {};

    if (startDate && endDate) {
      asignacionesWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (actionType) {
      asignacionesWhere.actionType = actionType;
    }

    if (itemType) {
      asignacionesWhere.itemType = itemType;
    }

    const asignaciones = await prisma.asignacionesEquipos.findMany({
      where: asignacionesWhere,
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
        },
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
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    console.log(`📊 Modificaciones encontradas: ${modificaciones.length}`);
    console.log(`📊 Asignaciones encontradas: ${asignaciones.length}`);

    // Procesar modificaciones
    const processedModificaciones = modificaciones.map(mod => {
      const equipo = mod.computador;
      const tipoEquipo = 'Computador';
      
      // Obtener información del modelo
      let modeloInfo = 'N/A';
      if (equipo?.computadorModelos?.[0]?.modeloEquipo) {
        const modelo = equipo.computadorModelos[0].modeloEquipo;
        const marca = modelo.marcaModelos?.[0]?.marca;
        modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
      }

      // Obtener información del empleado asignado actualmente
      let empleadoAsignado = null;
      let organizacionAsignada = null;
      
      if (tipoEquipo === 'Computador' && equipo?.asignaciones?.[0]) {
        const asignacionActual = equipo.asignaciones[0];
        empleadoAsignado = asignacionActual.targetEmpleado;
        organizacionAsignada = empleadoAsignado?.organizaciones?.[0];
      }

      // Categorizar el tipo de modificación
      let categoriaModificacion = 'General';
      if (['ram', 'disco', 'procesador', 'tarjetaGrafica'].includes(mod.campo)) {
        categoriaModificacion = 'Hardware';
      } else if (['sisOperativo', 'versionSO', 'licenciaSO'].includes(mod.campo)) {
        categoriaModificacion = 'Software';
      } else if (['estado', 'serial', 'modelo', 'marca'].includes(mod.campo)) {
        categoriaModificacion = 'Metadatos';
      }

      return {
        id: mod.id,
        fecha: mod.fecha,
        accion: mod.accion || 'Modificación',
        tipoMovimiento: 'Modificación',
        campo: mod.campo,
        categoriaModificacion: categoriaModificacion,
        valorAnterior: mod.valorAnterior,
        valorNuevo: mod.valorNuevo,
        equipo: {
          tipo: tipoEquipo,
          serial: equipo?.serial || 'N/A',
          codigoImgc: equipo?.codigoImgc || 'N/A',
          modelo: modeloInfo,
          estado: equipo?.estado || 'N/A'
        },
        usuario: {
          // En el historial de modificaciones no tenemos información del usuario
          nombre: 'Sistema',
          id: 'sistema'
        },
        empleadoAsignado: empleadoAsignado ? {
          nombre: `${empleadoAsignado.nombre} ${empleadoAsignado.apellido}`,
          cedula: empleadoAsignado.ced,
          cargo: organizacionAsignada?.cargo?.nombre || 'Sin cargo',
          departamento: organizacionAsignada?.departamento?.nombre || 'Sin departamento',
          empresa: organizacionAsignada?.empresa?.nombre || 'Sin empresa'
        } : null,
        descripcion: `${mod.campo}: "${mod.valorAnterior || 'N/A'}" → "${mod.valorNuevo || 'N/A'}"`,
        metadata: {
          computadorId: mod.computadorId,
          dispositivoId: mod.dispositivoId,
          timestamp: mod.fecha
        }
      };
    });

    // Procesar asignaciones
    const processedAsignaciones = asignaciones.map(asignacion => {
      const equipo = asignacion.computador || asignacion.dispositivo;
      const tipoEquipo = asignacion.itemType;
      
      // Obtener información del modelo
      let modeloInfo = 'N/A';
      if (equipo?.computadorModelos?.[0]?.modeloEquipo) {
        const modelo = equipo.computadorModelos[0].modeloEquipo;
        const marca = modelo.marcaModelos?.[0]?.marca;
        modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
      }

      // Obtener información del empleado
      const organizacion = asignacion.targetEmpleado?.organizaciones?.[0];
      const departamento = organizacion?.departamento;
      const empresa = organizacion?.empresa;
      const cargo = organizacion?.cargo;

      return {
        id: asignacion.id,
        fecha: asignacion.date,
        accion: asignacion.actionType || 'Asignación',
        tipoMovimiento: 'Asignación',
        campo: 'Asignación de Equipo',
        categoriaModificacion: 'Asignación',
        valorAnterior: 'Sin asignar',
        valorNuevo: 'Asignado',
        equipo: {
          tipo: tipoEquipo,
          serial: equipo?.serial || 'N/A',
          codigoImgc: equipo?.codigoImgc || 'N/A',
          modelo: modeloInfo,
          estado: equipo?.estado || 'N/A'
        },
        usuario: {
          // En las asignaciones no tenemos información del usuario que realizó la acción
          nombre: 'Sistema',
          id: 'sistema'
        },
        empleadoAsignado: {
          nombre: asignacion.targetEmpleado ? 
            `${asignacion.targetEmpleado.nombre} ${asignacion.targetEmpleado.apellido}` : 'Sin asignar',
          cedula: asignacion.targetEmpleado?.ced || 'N/A',
          cargo: cargo?.nombre || 'Sin cargo',
          departamento: departamento?.nombre || 'Sin departamento',
          empresa: empresa?.nombre || 'Sin empresa'
        },
        descripcion: `${asignacion.actionType || 'Asignación'} de ${tipoEquipo} a ${asignacion.targetEmpleado ? `${asignacion.targetEmpleado.nombre} ${asignacion.targetEmpleado.apellido}` : 'empleado'}`,
        metadata: {
          motivo: asignacion.motivo || 'Sin motivo',
          gerenteId: asignacion.gerenteId,
          timestamp: asignacion.date
        }
      };
    });

    // Combinar todos los movimientos
    let allMovimientos = [...processedModificaciones, ...processedAsignaciones];

    // Aplicar filtros adicionales
    if (usuarioId) {
      allMovimientos = allMovimientos.filter(mov => 
        mov.usuario.id === usuarioId
      );
    }

    if (empresaId) {
      allMovimientos = allMovimientos.filter(mov => 
        mov.empleadoAsignado?.empresa === empresaId
      );
    }

    if (departamentoId) {
      allMovimientos = allMovimientos.filter(mov => 
        mov.empleadoAsignado?.departamento === departamentoId
      );
    }

    // Ordenar por fecha descendente
    allMovimientos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    console.log(`📊 Movimientos totales procesados: ${allMovimientos.length}`);

    // Generar estadísticas
    const stats = {
      totalMovimientos: allMovimientos.length,
      modificaciones: processedModificaciones.length,
      asignaciones: processedAsignaciones.length,
      porTipoMovimiento: allMovimientos.reduce((acc, mov) => {
        acc[mov.tipoMovimiento] = (acc[mov.tipoMovimiento] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porAccion: allMovimientos.reduce((acc, mov) => {
        acc[mov.accion] = (acc[mov.accion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porTipoEquipo: allMovimientos.reduce((acc, mov) => {
        acc[mov.equipo.tipo] = (acc[mov.equipo.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porCategoria: allMovimientos.reduce((acc, mov) => {
        acc[mov.categoriaModificacion] = (acc[mov.categoriaModificacion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porEmpresa: allMovimientos.reduce((acc, mov) => {
        const empresa = mov.empleadoAsignado?.empresa || 'Sin asignar';
        acc[empresa] = (acc[empresa] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porDepartamento: allMovimientos.reduce((acc, mov) => {
        const departamento = mov.empleadoAsignado?.departamento || 'Sin asignar';
        acc[departamento] = (acc[departamento] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porUsuario: allMovimientos.reduce((acc, mov) => {
        acc[mov.usuario.nombre] = (acc[mov.usuario.nombre] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      data: {
        movimientos: allMovimientos,
        estadisticas: stats,
        filtros: {
          startDate,
          endDate,
          actionType,
          itemType,
          usuarioId,
          empresaId,
          departamentoId
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de audit logger:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
