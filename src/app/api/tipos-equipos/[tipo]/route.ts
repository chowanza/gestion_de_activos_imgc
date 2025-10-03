import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

// Obtener información sobre un tipo específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tipo: string }> }
) {
  try {
    const user = await getServerUser(request);
    const { tipo } = await params;
    const tipoDecoded = decodeURIComponent(tipo);

    // Obtener modelos con este tipo
    const modelos = await prisma.modeloEquipo.findMany({
      where: { tipo: tipoDecoded },
      include: {
        marcaModelos: {
          include: {
            marca: true
          }
        }
      }
    });

    if (modelos.length === 0) {
      return NextResponse.json(
        { message: 'Tipo de equipo no encontrado' },
        { status: 404 }
      );
    }

    // Registrar acceso
    if (user) {
      await AuditLogger.logView(
        'tipo-equipo',
        tipoDecoded,
        `Usuario ${user.username} accedió al tipo de equipo: ${tipoDecoded}`,
        user.id as string
      );
    }

    return NextResponse.json({
      tipo: tipoDecoded,
      modelos: modelos,
      count: modelos.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener tipo de equipo:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Actualizar un tipo de equipo (renombrar)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tipo: string }> }
) {
  try {
    const user = await getServerUser(request);
    const { tipo } = await params;
    const tipoDecoded = decodeURIComponent(tipo);
    const body = await request.json();
    const { nuevoTipo } = body;

    if (!nuevoTipo || !nuevoTipo.trim()) {
      return NextResponse.json(
        { message: 'El nuevo tipo de equipo es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe otro tipo con el nuevo nombre
    const existingTipo = await prisma.modeloEquipo.findFirst({
      where: { 
        tipo: nuevoTipo.trim(),
        NOT: {
          tipo: tipoDecoded
        }
      }
    });

    if (existingTipo) {
      return NextResponse.json(
        { message: 'Ya existe un tipo de equipo con ese nombre' },
        { status: 400 }
      );
    }

    // Actualizar todos los modelos con este tipo
    const result = await prisma.modeloEquipo.updateMany({
      where: { tipo: tipoDecoded },
      data: { tipo: nuevoTipo.trim() }
    });

    // Registrar actualización
    if (user) {
      await AuditLogger.logUpdate(
        'tipo-equipo',
        tipoDecoded,
        `Usuario ${user.username} actualizó el tipo de equipo de "${tipoDecoded}" a "${nuevoTipo.trim()}"`,
        user.id as string,
        { 
          tipo: { anterior: tipoDecoded, nuevo: nuevoTipo.trim() },
          modelosActualizados: result.count
        }
      );
    }

    return NextResponse.json({
      message: `Tipo actualizado correctamente en ${result.count} modelo(s)`,
      modelosActualizados: result.count
    }, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar tipo de equipo:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Eliminar un tipo de equipo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tipo: string }> }
) {
  try {
    const user = await getServerUser(request);
    const { tipo } = await params;
    const tipoDecoded = decodeURIComponent(tipo);

    // Verificar si hay modelos usando este tipo
    const modelosConTipo = await prisma.modeloEquipo.findMany({
      where: { tipo: tipoDecoded }
    });

    if (modelosConTipo.length > 0) {
      return NextResponse.json(
        { 
          message: `No se puede eliminar el tipo porque hay ${modelosConTipo.length} modelo(s) que lo utilizan`,
          modelosEnUso: modelosConTipo.length
        },
        { status: 400 }
      );
    }

    // Registrar eliminación
    if (user) {
      await AuditLogger.logDelete(
        'tipo-equipo',
        tipoDecoded,
        `Usuario ${user.username} eliminó el tipo de equipo: ${tipoDecoded}`,
        user.id as string,
        { tipo: tipoDecoded }
      );
    }

    return NextResponse.json(
      { message: 'Tipo de equipo eliminado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar tipo de equipo:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
