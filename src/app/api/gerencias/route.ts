import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function GET() {
  try {
    const gerencias = await prisma.gerencia.findMany();
    return NextResponse.json(gerencias, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener gerencias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newGerencia = await prisma.gerencia.create({
      data: body,
    });
    return NextResponse.json(newGerencia, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear gerencias' }, { status: 500 });
  }
}
