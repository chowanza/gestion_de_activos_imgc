import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';



export async function GET(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    const linea = await prisma.lineaTelefonica.findUnique({
      where: {
        id: id,
      },
    });
    if (!linea) {
      return NextResponse.json({ message: 'Linea no encontrado' }, { status: 404 });
    }
    return NextResponse.json(linea, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener Linea' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    const body = await request.json();
    const updatedLinea = await prisma.lineaTelefonica.update({
      where: {
        id: id,
      },
      data: body,
    });
    return NextResponse.json(updatedLinea, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar linea' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    await prisma.lineaTelefonica.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'linea eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar linea' }, { status: 500 });
  }
}
