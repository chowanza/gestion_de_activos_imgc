import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'
import path from 'path';
import { stat, mkdir, writeFile } from 'fs/promises';
import { Prisma } from '@prisma/client';


export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);
  const asignado = searchParams.get('asignado');
  let where: Prisma.DispositivoWhereInput = {};
  
    if (asignado === 'false') {
      // Si queremos los NO asignados, usar estados no asignados
      where = {
        estado: {
          in: ['OPERATIVO', 'EN_RESGUARDO', 'DE_BAJA']
        }
      };
    } else if (asignado === 'true') {
      // Si queremos los SÍ asignados, usar estados asignados
      where = {
        estado: {
          in: ['ASIGNADO', 'EN_MANTENIMIENTO']
        }
      };
    }
  try {
    const equipos = await prisma.dispositivo.findMany({
      where,
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
          include: {
            ubicacion: true,
            targetEmpleado: {
              include: {
                organizaciones: {
                  include: {
                    departamento: {
                      include: {
                        empresaDepartamentos: {
                          include: {
                            empresa: true
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
            date: 'desc'
          }
        }
      },
      orderBy: {
        serial: 'asc'
      }
    });

    // Transformar los datos para que coincidan con la interfaz del frontend
    const equiposTransformados = equipos.map(dispositivo => {
      const modeloEquipo = dispositivo.dispositivoModelos[0]?.modeloEquipo;
      const marca = modeloEquipo?.marcaModelos[0]?.marca;
      
      // Obtener asignación activa (la más reciente que esté activa)
      const asignacionActiva = dispositivo.asignaciones.find(a => a.activo) || null;
      
      // Obtener ubicación de la asignación activa o de la más reciente que tenga ubicación
      const ubicacion = asignacionActiva?.ubicacion || 
        dispositivo.asignaciones.find(a => a.ubicacion)?.ubicacion || null;
      
      return {
        id: dispositivo.id,
        serial: dispositivo.serial,
        estado: dispositivo.estado,
        codigoImgc: dispositivo.codigoImgc,
        mac: dispositivo.mac,
        ip: dispositivo.ip,
        fechaCompra: dispositivo.fechaCompra,
        numeroFactura: dispositivo.numeroFactura,
        proveedor: dispositivo.proveedor,
        monto: dispositivo.monto,
        modelo: modeloEquipo ? {
          id: modeloEquipo.id,
          nombre: modeloEquipo.nombre,
          tipo: modeloEquipo.tipo,
          img: modeloEquipo.img,
          marca: marca ? { nombre: marca.nombre } : { nombre: 'Sin marca' }
        } : null,
        ubicacion: ubicacion,
        empleado: asignacionActiva?.targetEmpleado ? {
          id: asignacionActiva.targetEmpleado.id,
          nombre: asignacionActiva.targetEmpleado.nombre,
          apellido: asignacionActiva.targetEmpleado.apellido,
          departamento: asignacionActiva.targetEmpleado.organizaciones[0]?.departamento?.nombre || 'Sin departamento',
          empresa: asignacionActiva.targetEmpleado.organizaciones[0]?.departamento?.empresaDepartamentos?.[0]?.empresa?.nombre || 'Sin empresa'
        } : null
      };
    });

    return NextResponse.json(equiposTransformados, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Ya no es FormData, ahora es JSON simple
    const body = await request.json();
    const { modeloId, serial, codigoImgc, estado, ubicacionId, mac, fechaCompra, numeroFactura, proveedor, monto, evidenciaFotos, motivoCreacion, notasCreacion } = body;

    // Validación
    if (!modeloId || !serial || !codigoImgc) {
        return NextResponse.json({ message: 'Modelo, Serial y Código IMGC son requeridos' }, { status: 400 });
    }

    // Crear el dispositivo primero
    const nuevoDispositivo = await prisma.dispositivo.create({
      data: {
        serial,
        codigoImgc,  // Campo obligatorio
        estado: estado || 'OPERATIVO', // Asignar OPERATIVO por defecto si no se proporciona
        mac: mac || null,
        // Nuevos campos de compra
        fechaCompra: fechaCompra ? new Date(fechaCompra) : null,
        numeroFactura: numeroFactura || null,
        proveedor: proveedor || null,
        monto: monto && monto !== '' ? parseFloat(monto) : null,
      },
    });

    // Crear la relación con el modelo
    await prisma.dispositivoModeloEquipo.create({
      data: {
        dispositivoId: nuevoDispositivo.id,
        modeloEquipoId: modeloId,
      },
    });

    // Crear asignación de ubicación si se proporciona ubicacionId
    if (ubicacionId && ubicacionId.trim() !== '') {
      await prisma.asignacionesEquipos.create({
        data: {
          dispositivoId: nuevoDispositivo.id,
          ubicacionId: ubicacionId,
          date: new Date(),
          actionType: 'CREACION',
          targetType: 'UBICACION',
          itemType: 'DISPOSITIVO',
          activo: false, // Las asignaciones de creación no deben estar activas
          notes: notasCreacion || 'Ubicación asignada durante la creación del dispositivo',
          motivo: motivoCreacion || 'Creación de dispositivo',
            evidenciaFotos: evidenciaFotos && evidenciaFotos.length > 0 
              ? (await import('@/lib/sanitize')).sanitizeStringOrNull(evidenciaFotos) 
              : null
        },
      });
    } else if (evidenciaFotos && evidenciaFotos.length > 0) {
      // Si no hay ubicación pero sí hay evidencia fotográfica, crear un registro solo para la evidencia
      await prisma.asignacionesEquipos.create({
        data: {
          dispositivoId: nuevoDispositivo.id,
          date: new Date(),
          actionType: 'CREACION',
          targetType: 'Sistema',
          itemType: 'DISPOSITIVO',
          activo: false, // Las asignaciones de creación no deben estar activas
          notes: notasCreacion || 'Evidencia fotográfica de la creación del dispositivo',
          motivo: motivoCreacion || 'Creación de dispositivo',
            evidenciaFotos: (await import('@/lib/sanitize')).sanitizeStringOrNull(evidenciaFotos)
        },
      });
    }

    return NextResponse.json(nuevoDispositivo, { status: 201 });
  } catch (error) {
    console.error(error);
    // Manejo de errores (ej: serial o nsap duplicado - código P2002 de Prisma)
    return NextResponse.json({ message: 'Error al crear el dispositivo' }, { status: 500 });
  }
}
