import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
import { requirePermission, requireAnyPermission } from '@/lib/role-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requirePermission('canView')(request as any);
  if (deny) return deny;
  try {
    const { id } = await params;
    const tipo = await prisma.tipoEquipo.findUnique({ where: { id } });
    if (!tipo) {
      return NextResponse.json({ message: 'Tipo no encontrado' }, { status: 404 });
    }
    const user = await getServerUser(request);
    if (user) {
      await AuditLogger.logView('tipoEquipo', id, `Accedió a tipo ${tipo.categoria}/${tipo.nombre}`, (user as any).id);
    }
    return NextResponse.json(tipo, { status: 200 });
  } catch (error) {
    console.error('Error al obtener tipo de equipo:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireAnyPermission(['canUpdate','canManageComputadores','canManageDispositivos','canManageEmpresas'])(request as any);
  if (deny) return deny;
  try {
    const { id } = await params;
    const body = await request.json();
    const nombre = (body.nombre || '').trim();
    const categoria = (body.categoria || '').trim();

    const existing = await prisma.tipoEquipo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: 'Tipo no encontrado' }, { status: 404 });
    }

    const newNombre = nombre || existing.nombre;
    const newCategoria = categoria || existing.categoria;

    // Unicidad compuesta
    const conflict = await prisma.tipoEquipo.findFirst({
      where: {
        id: { not: id },
        nombre: newNombre,
        categoria: newCategoria,
      }
    });
    if (conflict) {
      return NextResponse.json({ message: 'Ya existe un tipo con ese nombre en la categoría' }, { status: 400 });
    }

    const updated = await prisma.tipoEquipo.update({
      where: { id },
      data: { nombre: newNombre, categoria: newCategoria }
    });

    const user = await getServerUser(request);
    if (user) {
      await AuditLogger.logUpdate(
        'tipoEquipo',
        id,
        `Actualizó tipo ${existing.categoria}/${existing.nombre} → ${updated.categoria}/${updated.nombre}`,
        (user as any).id,
        { antes: existing, despues: updated }
      );
    }
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar tipo de equipo:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requirePermission('canDelete')(request as any);
  if (deny) return deny;
  try {
    const { id } = await params;
    const tipo = await prisma.tipoEquipo.findUnique({ where: { id } });
    if (!tipo) {
      return NextResponse.json({ message: 'Tipo no encontrado' }, { status: 404 });
    }

    // Bloquear eliminación si hay modelos con ese tipo
  const modelosUsando = await prisma.modeloEquipo.count({ where: { tipo: tipo.nombre } });
    if (modelosUsando > 0) {
      return NextResponse.json({ message: 'No se puede eliminar el tipo porque hay modelos que lo utilizan' }, { status: 400 });
    }

    await prisma.tipoEquipo.delete({ where: { id } });
    const user = await getServerUser(request);
    if (user) {
      await AuditLogger.logDelete(
        'tipoEquipo',
        id,
        `Eliminó tipo ${tipo.categoria}/${tipo.nombre}`,
        (user as any).id,
        { nombre: tipo.nombre, categoria: tipo.categoria }
      );
    }
    return NextResponse.json({ message: 'Tipo eliminado correctamente' }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar tipo de equipo:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
