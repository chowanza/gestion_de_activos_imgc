import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
import { requireAnyPermission } from '@/lib/role-middleware';

export const dynamic = 'force-dynamic';

// Endpoint único PUT para renombrar tipo (y actualizar modelos) preservando auditoría.
export async function PUT(request: NextRequest) {
  const deny = await requireAnyPermission(['canUpdate','canManageComputadores','canManageDispositivos','canManageEmpresas'])(request as any);
  if (deny) return deny;
  try {
    const { tipoAnterior, tipoNuevo, categoria } = await request.json();
    if (!tipoAnterior || !tipoNuevo) {
      return NextResponse.json({ message: 'tipoAnterior y tipoNuevo son requeridos' }, { status: 400 });
    }
    if (tipoAnterior === tipoNuevo) {
      return NextResponse.json({ message: 'El tipo nuevo debe ser diferente' }, { status: 400 });
    }

    // Identificar tipo existente
    const whereTipo: any = { nombre: tipoAnterior };
    if (categoria) whereTipo.categoria = categoria;
    const existing = await prisma.tipoEquipo.findFirst({ where: whereTipo });
    if (!existing) {
      return NextResponse.json({ message: 'Tipo anterior no encontrado' }, { status: 404 });
    }

    // Conflicto
    const conflict = await prisma.tipoEquipo.findFirst({
      where: { nombre: tipoNuevo, categoria: existing.categoria, id: { not: existing.id } }
    });
    if (conflict) {
      return NextResponse.json({ message: 'Ya existe otro tipo con ese nombre en la categoría' }, { status: 400 });
    }

    // Actualizar registro tipo
    const updatedTipo = await prisma.tipoEquipo.update({
      where: { id: existing.id },
      data: { nombre: tipoNuevo }
    });

    // Actualizar modelos que usaban el nombre previo
    const updatedModelos = await prisma.modeloEquipo.updateMany({
      where: { tipo: tipoAnterior },
      data: { tipo: tipoNuevo }
    });

    const user = await getServerUser(request);
    if (user) {
      await AuditLogger.logUpdate(
        'tipoEquipo',
        updatedTipo.id,
        `Renombró tipo ${existing.categoria}/${tipoAnterior} → ${updatedTipo.categoria}/${tipoNuevo}`,
        (user as any).id,
        { modelosActualizados: updatedModelos.count }
      );
    }

    return NextResponse.json({
      message: 'Tipo actualizado correctamente',
      modelosActualizados: updatedModelos.count,
      tipo: updatedTipo
    }, { status: 200 });
  } catch (error) {
    console.error('Error al renombrar tipo:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
