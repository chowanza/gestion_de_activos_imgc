import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);
  const asignado = searchParams.get('asignado'); // 'true' o 'false'
  let where: Prisma.ComputadorWhereInput = {};

  if (asignado === 'false') {
    // Si queremos los NO asignados, ambos campos de ID deben ser null
    where = { usuarioId: null, departamentoId: null };
  } else if (asignado === 'true') {
    // Si queremos los SÍ asignados, al menos uno de los campos de ID NO debe ser null
    where = {
      OR: [
        { usuarioId: { not: null } },
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
        usuario: true, // Incluimos esto para saber a quién está asignado
        departamento: true, // Y a qué depto
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
    const newEquipo = await prisma.computador.create({
      data: body,
    });
    return NextResponse.json(newEquipo, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear equipo' }, { status: 500 });
  }
}
