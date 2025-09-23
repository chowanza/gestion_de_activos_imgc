import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);
  const asignado = searchParams.get('asignado'); // 'true' o 'false'
  let where: Prisma.ComputadorWhereInput = {};

  if (asignado === 'false') {
    // Si queremos los NO asignados, ambos campos de ID deben ser null
    where = { empleadoId: null, departamentoId: null };
  } else if (asignado === 'true') {
    // Si queremos los SÍ asignados, al menos uno de los campos de ID NO debe ser null
    where = {
      OR: [
        { empleadoId: { not: null } },
        { departamentoId: { not: null } },
      ],
    };
  }

  try {
    const computadores = await prisma.computador.findMany({
      where, // Aplicamos el filtro
      include: {
        modelo: {
          include: {
            marca: true,
          },
        },
        empleado: {
          include: {
            departamento: {
              include: {
                empresa: true
              }
            }
          }
        }, // Incluimos esto para saber a quién está asignado y su departamento
        ubicacion: true, // Incluimos la ubicación asignada (si existe)
      },
      orderBy: {
        modelo: {
          nombre: 'asc'
        }
      }
    });
    return NextResponse.json(computadores);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener computadores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Procesar fechas para convertirlas al formato correcto
    const processedData = {
      ...body,
      fechaCompra: body.fechaCompra ? new Date(body.fechaCompra) : null,
    };
    
    const newEquipo = await prisma.computador.create({
      data: processedData,
    });
    return NextResponse.json(newEquipo, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear equipo' }, { status: 500 });
  }
}
