import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { sanitizeStringOrNull } from '@/lib/sanitize';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);
  const asignado = searchParams.get('asignado'); // 'true' o 'false'
  let where: Prisma.ComputadorWhereInput = {};

  if (asignado === 'false') {
    // Si queremos los NO asignados, estado debe ser OPERATIVO
    where = { estado: 'OPERATIVO' };
  } else if (asignado === 'true') {
    // Si queremos los SÍ asignados, estado debe ser ASIGNADO
    where = { estado: 'ASIGNADO' };
  }

  try {
    const computadores = await prisma.computador.findMany({
      where, // Aplicamos el filtro
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
    const computadoresTransformados = computadores.map(computador => {
      const modeloEquipo = computador.computadorModelos[0]?.modeloEquipo;
      const marca = modeloEquipo?.marcaModelos[0]?.marca;
      
      // Obtener asignación activa (la más reciente que esté activa)
      const asignacionActiva = computador.asignaciones.find(a => a.activo) || null;
      
      // Obtener ubicación de la asignación activa o de la más reciente que tenga ubicación
      const ubicacion = asignacionActiva?.ubicacion || 
        computador.asignaciones.find(a => a.ubicacion)?.ubicacion || null;
      
      return {
        id: computador.id,
        serial: computador.serial,
        estado: computador.estado,
        codigoImgc: computador.codigoImgc,
        host: computador.host,
        fechaCompra: computador.fechaCompra,
        numeroFactura: computador.numeroFactura,
        proveedor: computador.proveedor,
        monto: computador.monto,
        sisOperativo: computador.sisOperativo,
        arquitectura: computador.arquitectura,
        procesador: computador.procesador,
        ram: computador.ram,
        almacenamiento: computador.almacenamiento,
        macWifi: computador.macWifi,
        macEthernet: computador.macEthernet,
        officeVersion: computador.officeVersion,
        anydesk: computador.anydesk,
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
          empresa: asignacionActiva.targetEmpleado.organizaciones[0]?.departamento?.empresaDepartamentos[0]?.empresa?.nombre || 'Sin empresa'
        } : null
      };
    });

    return NextResponse.json(computadoresTransformados);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener computadores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modeloId, motivoCreacion, notasCreacion, ...computadorData } = body;
    
    // Validación más específica
    const errors = [];
    if (!modeloId || modeloId.trim() === '') {
      errors.push('Modelo es requerido');
    }
    if (!computadorData.serial || computadorData.serial.trim() === '') {
      errors.push('Serial es requerido');
    }
    if (!computadorData.estado || computadorData.estado.trim() === '') {
      errors.push('Estado es requerido');
    }
    if (!computadorData.codigoImgc || computadorData.codigoImgc.trim() === '') {
      errors.push('Código IMGC es requerido');
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        { message: errors.join(', ') },
        { status: 400 }
      );
    }
    
    // Procesar datos - solo incluir campos que tienen valores
    const processedData: any = {
      serial: computadorData.serial,
      estado: computadorData.estado,
      codigoImgc: computadorData.codigoImgc,
    };

    // Agregar campos opcionales solo si tienen valores
    if (computadorData.host && computadorData.host.trim() !== '') {
      processedData.host = computadorData.host;
    }
    if (computadorData.sisOperativo && computadorData.sisOperativo.trim() !== '') {
      processedData.sisOperativo = computadorData.sisOperativo;
    }
    if (computadorData.arquitectura && computadorData.arquitectura.trim() !== '') {
      processedData.arquitectura = computadorData.arquitectura;
    }
    if (computadorData.procesador && computadorData.procesador.trim() !== '') {
      processedData.procesador = computadorData.procesador;
    }
    if (computadorData.ram && computadorData.ram.trim() !== '') {
      processedData.ram = computadorData.ram;
    }
    if (computadorData.almacenamiento && computadorData.almacenamiento.trim() !== '') {
      processedData.almacenamiento = computadorData.almacenamiento;
    }
    if (computadorData.macWifi && computadorData.macWifi.trim() !== '') {
      processedData.macWifi = computadorData.macWifi;
    }
    if (computadorData.macEthernet && computadorData.macEthernet.trim() !== '') {
      processedData.macEthernet = computadorData.macEthernet;
    }
    if (computadorData.officeVersion && computadorData.officeVersion.trim() !== '') {
      processedData.officeVersion = computadorData.officeVersion;
    }
    if (computadorData.anydesk && computadorData.anydesk.trim() !== '') {
      processedData.anydesk = computadorData.anydesk;
    }
    if (computadorData.numeroFactura && computadorData.numeroFactura.trim() !== '') {
      processedData.numeroFactura = computadorData.numeroFactura;
    }
    if (computadorData.proveedor && computadorData.proveedor.trim() !== '') {
      processedData.proveedor = computadorData.proveedor;
    }
    if (computadorData.monto && computadorData.monto !== '' && computadorData.monto !== null) {
      processedData.monto = parseFloat(computadorData.monto);
    }
    if (computadorData.fechaCompra && computadorData.fechaCompra.trim() !== '') {
      processedData.fechaCompra = new Date(computadorData.fechaCompra);
    }
    
    // Crear el computador primero
    const newEquipo = await prisma.computador.create({
      data: processedData,
    });

    // Crear la relación con el modelo
    await prisma.computadorModeloEquipo.create({
      data: {
        computadorId: newEquipo.id,
        modeloEquipoId: modeloId,
      },
    });

    // Crear asignación de ubicación si se proporciona ubicacionId
    if (computadorData.ubicacionId && computadorData.ubicacionId.trim() !== '') {
      await prisma.asignacionesEquipos.create({
        data: {
          computadorId: newEquipo.id,
          ubicacionId: computadorData.ubicacionId,
          date: new Date(),
          actionType: 'CREACION',
          targetType: 'UBICACION',
          itemType: 'COMPUTADOR',
          activo: false, // Las asignaciones de creación no deben estar activas
          notes: notasCreacion || 'Ubicación asignada durante la creación del computador',
          motivo: motivoCreacion || 'Creación de computador',
          evidenciaFotos: sanitizeStringOrNull(computadorData.evidenciaFotos),
        },
      });
    } else if (computadorData.evidenciaFotos && computadorData.evidenciaFotos.length > 0) {
      // Si no hay ubicación pero sí hay evidencia fotográfica, crear un registro solo para la evidencia
      await prisma.asignacionesEquipos.create({
        data: {
          computadorId: newEquipo.id,
          date: new Date(),
          actionType: 'CREACION',
          targetType: 'Sistema',
          itemType: 'COMPUTADOR',
          activo: false, // Las asignaciones de creación no deben estar activas
          notes: notasCreacion || 'Evidencia fotográfica de la creación del computador',
          motivo: motivoCreacion || 'Creación de computador',
          evidenciaFotos: sanitizeStringOrNull(computadorData.evidenciaFotos)
        },
      });
    }
    
    return NextResponse.json(newEquipo, { status: 201 });
  } catch (error) {
    console.error('Error al crear computador:', error);
    return NextResponse.json({ message: 'Error al crear equipo' }, { status: 500 });
  }
}
