import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getServerUser(request);
    const { id } = await params;

    const marca = await prisma.marca.findUnique({
      where: { id }
    });

    if (!marca) {
      return NextResponse.json(
        { message: 'Marca no encontrada' },
        { status: 404 }
      );
    }

    // Registrar acceso
    if (user) {
      await AuditLogger.logView(
        'marca',
        id,
        `Usuario ${user.username} accedió a la marca: ${marca.nombre}`,
        user.id as string
      );
    }

    return NextResponse.json(marca, { status: 200 });
  } catch (error) {
    console.error('Error al obtener marca:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getServerUser(request);
    const { id } = await params;
    const body = await request.json();
    const { nombre } = body;

    if (!nombre) {
      return NextResponse.json(
        { message: 'El nombre de la marca es requerido' },
        { status: 400 }
      );
    }

    // Verificar si la marca existe
    const existingMarca = await prisma.marca.findUnique({
      where: { id }
    });

    if (!existingMarca) {
      return NextResponse.json(
        { message: 'Marca no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si ya existe otra marca con el mismo nombre (case-insensitive)
    const allMarcas = await prisma.marca.findMany({
      where: { id: { not: id } }
    });
    
    const duplicateMarca = allMarcas.find(m => 
      m.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (duplicateMarca) {
      return NextResponse.json(
        { message: 'Ya existe otra marca con ese nombre' },
        { status: 400 }
      );
    }

    // Actualizar la marca
    const marca = await prisma.marca.update({
      where: { id },
      data: { nombre }
    });

    // En el esquema normalizado, no necesitamos actualizar modelos
    // porque la relación se mantiene a través de MarcaModeloEquipo

    // Registrar actualización
    if (user) {
      await AuditLogger.logUpdate(
        'marca',
        id,
        `Usuario ${user.username} actualizó la marca: ${marca.nombre}`,
        user.id as string,
        { 
          nombre: { anterior: existingMarca.nombre, nuevo: marca.nombre }
        }
      );
    }

    return NextResponse.json(marca, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar marca:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getServerUser(request);
    const { id } = await params;

    // Verificar si la marca existe
    const existingMarca = await prisma.marca.findUnique({
      where: { id }
    });

    if (!existingMarca) {
      return NextResponse.json(
        { message: 'Marca no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay modelos usando esta marca (esquema normalizado)
    const modelosConMarca = await prisma.marcaModeloEquipo.findFirst({
      where: { marcaId: id }
    });

    if (modelosConMarca) {
      return NextResponse.json(
        { message: 'No se puede eliminar la marca porque hay modelos que la utilizan' },
        { status: 400 }
      );
    }

    await prisma.marca.delete({
      where: { id }
    });

    // Registrar eliminación
    if (user) {
      await AuditLogger.logDelete(
        'marca',
        id,
        `Usuario ${user.username} eliminó la marca: ${existingMarca.nombre}`,
        user.id as string,
        { nombre: existingMarca.nombre }
      );
    }

    return NextResponse.json(
      { message: 'Marca eliminada correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar marca:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
