import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'asignaciones' o 'modificaciones'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const empresaId = searchParams.get('empresaId');
    const departamentoId = searchParams.get('departamentoId');
    const empleadoId = searchParams.get('empleadoId');

    console.log('🔍 API Asignaciones & Modificaciones - Parámetros recibidos:', {
      type, startDate, endDate, empresaId, departamentoId, empleadoId
    });

    if (!type || !['asignaciones', 'modificaciones'].includes(type)) {
      return NextResponse.json(
        { message: 'Parámetro type requerido: asignaciones o modificaciones' },
        { status: 400 }
      );
    }

    if (type === 'asignaciones') {
      return await getAsignaciones(startDate, endDate, empresaId, departamentoId, empleadoId);
    } else {
      return await getModificaciones(startDate, endDate, empresaId, departamentoId, empleadoId);
    }

  } catch (error) {
    console.error('Error generando reporte de asignaciones/modificaciones:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function getAsignaciones(startDate: string | null, endDate: string | null, empresaId: string | null, departamentoId: string | null, empleadoId: string | null) {
  // Construir filtros para asignaciones
  const asignacionesWhere: any = {
    activo: true
  };

  // Filtros de fecha
  if (startDate && endDate) {
    asignacionesWhere.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  // Filtros por empleado
  if (empleadoId) {
    asignacionesWhere.targetEmpleadoId = empleadoId;
  }

  // Obtener asignaciones con toda la información relacionada
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
      },
      ubicacion: true
    },
    orderBy: {
      date: 'desc'
    }
  });

  console.log(`📊 Asignaciones encontradas: ${asignaciones.length}`);

  // Procesar datos de asignaciones
  const processedAsignaciones = asignaciones.map(asignacion => {
    const equipo = asignacion.computador || asignacion.dispositivo;
    const tipoEquipo = asignacion.itemType;

    // Obtener información del modelo del equipo (type guard)
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

    // Obtener información del empleado y organización
    const organizacion = asignacion.targetEmpleado?.organizaciones?.[0];
    const departamento = organizacion?.departamento;
    const empresa = organizacion?.empresa;
    const cargo = organizacion?.cargo;

    return {
      id: asignacion.id,
      fecha: asignacion.date,
      accion: 'Asignación',
      tipoEquipo: tipoEquipo,
      equipo: {
        serial: equipo?.serial || 'N/A',
        modelo: modeloInfo,
        estado: equipo?.estado || 'N/A',
        codigoImgc: equipo?.codigoImgc || 'N/A'
      },
      empleado: {
        nombre: asignacion.targetEmpleado ? 
          `${asignacion.targetEmpleado.nombre} ${asignacion.targetEmpleado.apellido}` : 'N/A',
        cedula: asignacion.targetEmpleado?.ced || 'N/A',
        cargo: cargo?.nombre || 'Sin cargo',
        departamento: departamento?.nombre || 'Sin departamento',
        empresa: empresa?.nombre || 'Sin empresa'
      },
      ubicacion: {
        nombre: asignacion.ubicacion?.nombre || 'Sin ubicación',
        direccion: asignacion.ubicacion?.direccion || 'Sin dirección'
      },
      motivo: asignacion.motivo || 'Sin motivo especificado',
      gerente: asignacion.gerenteId ? 'Asignado por gerente' : 'Asignación directa'
    };
  });

  // Aplicar filtros adicionales que no se pueden aplicar en la consulta SQL
  let filteredAsignaciones = processedAsignaciones;
  
  if (empresaId) {
    filteredAsignaciones = filteredAsignaciones.filter(asig => 
      asig.empleado.empresa === empresaId
    );
  }

  if (departamentoId) {
    filteredAsignaciones = filteredAsignaciones.filter(asig => 
      asig.empleado.departamento === departamentoId
    );
  }

  // Generar estadísticas
  const stats = {
    totalAsignaciones: filteredAsignaciones.length,
    porTipoEquipo: filteredAsignaciones.reduce((acc, asig) => {
      acc[asig.tipoEquipo] = (acc[asig.tipoEquipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    porEmpresa: filteredAsignaciones.reduce((acc, asig) => {
      acc[asig.empleado.empresa] = (acc[asig.empleado.empresa] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    porDepartamento: filteredAsignaciones.reduce((acc, asig) => {
      acc[asig.empleado.departamento] = (acc[asig.empleado.departamento] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return NextResponse.json({
    success: true,
    data: {
      asignaciones: filteredAsignaciones,
      estadisticas: stats,
      tipo: 'asignaciones',
      filtros: {
        startDate,
        endDate,
        empresaId,
        departamentoId,
        empleadoId
      }
    }
  });
}

async function getModificaciones(startDate: string | null, endDate: string | null, empresaId: string | null, departamentoId: string | null, empleadoId: string | null) {
  // Construir filtros para modificaciones
  const modificacionesWhere: any = {};

  // Filtros de fecha
  if (startDate && endDate) {
    modificacionesWhere.fecha = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
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

  console.log(`📊 Modificaciones encontradas: ${modificaciones.length}`);

  // Procesar datos de modificaciones
  const processedModificaciones = modificaciones.map(mod => {
    const computador = mod.computador;
    
    // Obtener información del modelo
    let modeloInfo = 'N/A';
    if (computador?.computadorModelos?.[0]?.modeloEquipo) {
      const modelo = computador.computadorModelos[0].modeloEquipo;
      const marca = modelo.marcaModelos?.[0]?.marca;
      modeloInfo = marca ? `${marca.nombre} ${modelo.nombre}` : modelo.nombre;
    }

    // Obtener información del empleado actual
    const asignacionActual = computador?.asignaciones?.[0];
    const empleadoActual = asignacionActual?.targetEmpleado;
    const organizacionActual = empleadoActual?.organizaciones?.[0];

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
      accion: 'Modificación',
      campo: mod.campo,
      categoriaModificacion: categoriaModificacion,
      valorAnterior: mod.valorAnterior,
      valorNuevo: mod.valorNuevo,
      equipo: {
        serial: computador?.serial || 'N/A',
        modelo: modeloInfo,
        estado: computador?.estado || 'N/A'
      },
      empleadoAsignado: empleadoActual ? {
        nombre: `${empleadoActual.nombre} ${empleadoActual.apellido}`,
        cedula: empleadoActual.ced,
        cargo: organizacionActual?.cargo?.nombre || 'Sin cargo',
        departamento: organizacionActual?.departamento?.nombre || 'Sin departamento',
        empresa: organizacionActual?.empresa?.nombre || 'Sin empresa'
      } : null,
      descripcion: `${mod.campo}: "${mod.valorAnterior || 'N/A'}" → "${mod.valorNuevo || 'N/A'}"`
    };
  });

  // Aplicar filtros adicionales
  let filteredModificaciones = processedModificaciones;

  if (empresaId) {
    filteredModificaciones = filteredModificaciones.filter(mod => 
      mod.empleadoAsignado?.empresa === empresaId
    );
  }

  if (departamentoId) {
    filteredModificaciones = filteredModificaciones.filter(mod => 
      mod.empleadoAsignado?.departamento === departamentoId
    );
  }

  if (empleadoId) {
    filteredModificaciones = filteredModificaciones.filter(mod => 
      mod.empleadoAsignado?.cedula === empleadoId
    );
  }

  // Generar estadísticas
  const stats = {
    totalModificaciones: filteredModificaciones.length,
    porCategoria: filteredModificaciones.reduce((acc, mod) => {
      acc[mod.categoriaModificacion] = (acc[mod.categoriaModificacion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    porCampo: filteredModificaciones.reduce((acc, mod) => {
      acc[mod.campo] = (acc[mod.campo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    porEmpresa: filteredModificaciones.reduce((acc, mod) => {
      const empresa = mod.empleadoAsignado?.empresa || 'Sin asignar';
      acc[empresa] = (acc[empresa] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return NextResponse.json({
    success: true,
    data: {
      modificaciones: filteredModificaciones,
      estadisticas: stats,
      tipo: 'modificaciones',
      filtros: {
        startDate,
        endDate,
        empresaId,
        departamentoId,
        empleadoId
      }
    }
  });
}

