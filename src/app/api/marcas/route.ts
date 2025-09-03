import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const nombre = await request.json();
    console.log(nombre);
    if (!nombre) {
      return NextResponse.json({ message: 'El nombre de la marca es requerido.' }, { status: 400 });
    }

    const newMarca = await prisma.marca.create({
      data: nombre,
    });

    return NextResponse.json(newMarca, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/marcas:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear la marca';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  try {
    const marcas = await prisma.marca.findMany({
      orderBy:{
        nombre: 'asc',
      }
    });
    return NextResponse.json(marcas, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener marcas' }, { status: 500 });
  }
}
