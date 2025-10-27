import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/role-middleware';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = await requirePermission('canView')(request as any);
  if (deny) return deny;
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tipoEdicion = searchParams.get('tipoEdicion');
    const tipoEquipo = searchParams.get('tipoEquipo');

    console.log('🔍 API Ediciones Metadatos - Parámetros recibidos:', {
      startDate, endDate, tipoEdicion, tipoEquipo
    });

    // Construir filtros para historial de modificaciones
    const modificacionesWhere: any = {
      // Solo campos de metadatos
      campo: {
        in: ['serial', 'modelo', 'marca', 'codigoImgc', 'fechaCompra', 'monto', 'observaciones']
      }
    };

    // Filtros de fecha
    if (startDate && endDate) {
      modificacionesWhere.fecha = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Filtro por tipo de edición específica
    if (tipoEdicion) {
      modificacionesWhere.campo = tipoEdicion;
    }

    // Obtener historial de modificaciones de metadatos
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

    console.log(`📊 Ediciones de metadatos encontradas: ${modificaciones.length}`);

    // Procesar datos de ediciones de metadatos
    const processedEdiciones = modificaciones.map(mod => {
      const computador = mod.computador;
      
      // Obtener información del modelo actual
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

      // Categorizar el tipo de edición
      let categoriaEdicion = 'General';
      let impactoEdicion = 'Bajo';
      
      if (['serial', 'codigoImgc'].includes(mod.campo)) {
        categoriaEdicion = 'Identificación';
        impactoEdicion = 'Alto';
      } else if (['modelo', 'marca'].includes(mod.campo)) {
        categoriaEdicion = 'Especificaciones';
        impactoEdicion = 'Medio';
      } else if (['fechaCompra', 'monto'].includes(mod.campo)) {
        categoriaEdicion = 'Financiero';
        impactoEdicion = 'Medio';
      } else if (['observaciones'].includes(mod.campo)) {
        categoriaEdicion = 'Documentación';
        impactoEdicion = 'Bajo';
      }

      return {
        id: mod.id,
        fecha: mod.fecha,
        campo: mod.campo,
        valorAnterior: mod.valorAnterior,
        valorNuevo: mod.valorNuevo,
        categoriaEdicion: categoriaEdicion,
        impactoEdicion: impactoEdicion,
        equipo: {
          id: computador?.id || 'N/A',
          tipo: 'Computador',
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
        cambio: {
          descripcion: `${mod.campo}: "${mod.valorAnterior || 'N/A'}" → "${mod.valorNuevo || 'N/A'}"`,
          tipo: categoriaEdicion,
          impacto: impactoEdicion,
          requiereAuditoria: ['serial', 'codigoImgc', 'modelo', 'marca'].includes(mod.campo)
        }
      };
    });

    // Aplicar filtros adicionales
    let filteredEdiciones = processedEdiciones;

    if (tipoEquipo) {
      filteredEdiciones = filteredEdiciones.filter(ed => 
        ed.equipo.tipo === tipoEquipo
      );
    }

    console.log(`📊 Ediciones filtradas: ${filteredEdiciones.length}`);

    // Generar estadísticas
    const stats = {
      totalEdiciones: filteredEdiciones.length,
      porCategoria: filteredEdiciones.reduce((acc, ed) => {
        acc[ed.categoriaEdicion] = (acc[ed.categoriaEdicion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porCampo: filteredEdiciones.reduce((acc, ed) => {
        acc[ed.campo] = (acc[ed.campo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porImpacto: filteredEdiciones.reduce((acc, ed) => {
        acc[ed.impactoEdicion] = (acc[ed.impactoEdicion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porEmpresa: filteredEdiciones.reduce((acc, ed) => {
        const empresa = ed.empleadoAsignado?.empresa || 'Sin asignar';
        acc[empresa] = (acc[empresa] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      edicionesAltoImpacto: filteredEdiciones.filter(ed => ed.impactoEdicion === 'Alto').length,
      edicionesMedioImpacto: filteredEdiciones.filter(ed => ed.impactoEdicion === 'Medio').length,
      edicionesBajoImpacto: filteredEdiciones.filter(ed => ed.impactoEdicion === 'Bajo').length,
      requiereAuditoria: filteredEdiciones.filter(ed => ed.cambio.requiereAuditoria).length
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
        ediciones: filteredEdiciones,
        estadisticas: stats,
        rangoFechas: dateRange,
        filtros: {
          startDate,
          endDate,
          tipoEdicion,
          tipoEquipo
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de ediciones de metadatos:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

