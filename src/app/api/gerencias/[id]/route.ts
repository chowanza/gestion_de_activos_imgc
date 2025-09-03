import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

interface Params {
  id: string;
}

export async function GET(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    const gerencia = await prisma.gerencia.findUnique({
      where: {
        id: id,
      },
    });
    if (!gerencia) {
      return NextResponse.json({ message: 'Gerencia no encontrada' }, { status: 404 });
    }
    return NextResponse.json(gerencia, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipo' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    const body = await request.json();
    const updatedGerencia = await prisma.gerencia.update({
      where: {
        id: id,
      },
      data: body,
    });
    return NextResponse.json(updatedGerencia, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar equipo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    await prisma.gerencia.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'Equipo eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar equipo' }, { status: 500 });
  }
}
