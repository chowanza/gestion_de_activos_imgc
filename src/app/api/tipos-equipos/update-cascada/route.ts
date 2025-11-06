export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

export async function PUT(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    const body = await request.json();
    const { tipoAnterior, tipoNuevo, categoria } = body as { tipoAnterior?: string; tipoNuevo?: string; categoria?: string };

    if (!tipoAnterior || !tipoNuevo) {
      return NextResponse.json(
        { message: 'Tipo anterior y tipo nuevo son requeridos' },
        { status: 400 }
      );
    }

    if (tipoAnterior === tipoNuevo) {
      return NextResponse.json(
        { message: 'El tipo nuevo debe ser diferente al anterior' },
        { status: 400 }
      );
    }

    // Verificar si hay modelos usando el tipo anterior
    const modelosConTipo = await prisma.modeloEquipo.findMany({
      where: { tipo: tipoAnterior },
      include: {
        marcaModelos: {
          include: {
            marca: true
          }
        }
      }
    });

    if (modelosConTipo.length === 0) {
      return NextResponse.json(
        { message: 'No hay modelos usando este tipo' },
        { status: 404 }
      );
    }

    // Actualizar todos los modelos que usan el tipo anterior
    const updatedModelos = await prisma.modeloEquipo.updateMany({
      where: { tipo: tipoAnterior },
      data: { tipo: tipoNuevo }
    });

    // Registrar actualización en cascada
    if (user) {
      await AuditLogger.logUpdate(
        'tipo-equipo-cascada',
        'multiple',
        `Usuario ${user.username} actualizó el tipo "${tipoAnterior}" a "${tipoNuevo}" en ${updatedModelos.count} modelo(s)`,
        user.id as string,
        { 
          tipoAnterior,
          tipoNuevo,
          modelosActualizados: updatedModelos.count,
          modelos: modelosConTipo.map(m => ({
            id: m.id,
            nombre: m.nombre,
            marca: m.marcaModelos[0]?.marca?.nombre || null
          }))
        }
      );
    }

    // Actualizar registro en tabla de tipos si existe
    try {
      const cat = (categoria || '').toUpperCase();
      const where: any = { nombre: tipoAnterior };
      if (cat === 'COMPUTADORA' || cat === 'DISPOSITIVO') where.categoria = cat;
      const found = await (prisma as any).tipoEquipo.findFirst({ where });
      if (found) {
        await (prisma as any).tipoEquipo.update({ where: { id: found.id }, data: { nombre: tipoNuevo } });
      }
    } catch (e) {
      console.warn('Advertencia: no se pudo actualizar TipoEquipo (continuando):', e);
    }

    return NextResponse.json({
      message: `Tipo actualizado en ${updatedModelos.count} modelo(s)`,
      modelosActualizados: updatedModelos.count,
      tipoAnterior,
      tipoNuevo
    }, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar tipo en cascada:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
