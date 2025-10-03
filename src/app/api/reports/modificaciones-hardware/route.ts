import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tipoModificacion = searchParams.get('tipoModificacion');
    const computadorId = searchParams.get('computadorId');

    console.log('🔍 API Modificaciones Hardware - Parámetros recibidos:', {
      startDate, endDate, tipoModificacion, computadorId
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

    // Filtro por tipo de modificación
    if (tipoModificacion) {
      modificacionesWhere.campo = tipoModificacion;
    }

    // Filtro por computador específico
    if (computadorId) {
      modificacionesWhere.computadorId = computadorId;
    }

    // Obtener historial de modificaciones con información del computador
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
        campo: mod.campo,
        valorAnterior: mod.valorAnterior,
        valorNuevo: mod.valorNuevo,
        categoriaModificacion: categoriaModificacion,
        computador: {
          id: computador?.id || 'N/A',
          serial: computador?.serial || 'N/A',
          codigoImgc: computador?.codigoImgc || 'N/A',
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
        impacto: {
          tipo: categoriaModificacion,
          descripcion: `${mod.campo}: ${mod.valorAnterior || 'N/A'} → ${mod.valorNuevo || 'N/A'}`,
          fechaAsignacion: asignacionActual?.date || null
        }
      };
    });

    // Aplicar filtros adicionales
    let filteredModificaciones = processedModificaciones;

    if (tipoModificacion && !['ram', 'disco', 'procesador', 'tarjetaGrafica', 'sisOperativo', 'versionSO', 'licenciaSO'].includes(tipoModificacion)) {
      filteredModificaciones = filteredModificaciones.filter(mod => 
        mod.campo === tipoModificacion
      );
    }

    console.log(`📊 Modificaciones filtradas: ${filteredModificaciones.length}`);

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
      }, {} as Record<string, number>),
      modificacionesHardware: filteredModificaciones.filter(mod => mod.categoriaModificacion === 'Hardware').length,
      modificacionesSoftware: filteredModificaciones.filter(mod => mod.categoriaModificacion === 'Software').length,
      modificacionesMetadatos: filteredModificaciones.filter(mod => mod.categoriaModificacion === 'Metadatos').length
    };

    // Obtener rango de fechas para contexto
    const dateRange = startDate && endDate ? {
      inicio: startDate,
      fin: endDate,
      dias: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        modificaciones: filteredModificaciones,
        estadisticas: stats,
        rangoFechas: dateRange,
        filtros: {
          startDate,
          endDate,
          tipoModificacion,
          computadorId
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de modificaciones de hardware:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

