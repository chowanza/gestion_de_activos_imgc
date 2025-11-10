import { NextRequest, NextResponse } from "next/server";
import { requirePermission, requireAnyPermission } from '@/lib/role-middleware';
import { writeFile, mkdir, stat, unlink } from 'fs/promises'; // Añadimos unlink
import path from 'path';


import prisma  from "@/lib/prisma";
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

async function ensureDirExists(dirPath: string) {
    try {
        await stat(dirPath);
    } catch (e: any) {
        if (e.code === 'ENOENT') {
            await mkdir(dirPath, { recursive: true });
        } else {
            throw e;
    }
  }
}

// --- Helper para eliminar un archivo (si existe) ---
async function deletePreviousImage(imagePath: string | null | undefined) {
  if (!imagePath) return;

  // imagePath puede venir como '/api/uploads/...' o '/uploads/...' -> normalizar
  const toFsPath = (s: string) => {
    let rel = s;
    if (rel.startsWith('/api/uploads/')) rel = rel.replace(/^\/api\/uploads\//, '');
    else if (rel.startsWith('/uploads/')) rel = rel.replace(/^\/uploads\//, '');
    return path.join(process.cwd(), 'public', 'uploads', ...rel.split('/'));
  };

  const fullPath = toFsPath(imagePath);
  try {
    await stat(fullPath); // Verifica si existe
    await unlink(fullPath); // Elimina el archivo
    console.log(`Imagen anterior eliminada: ${fullPath}`);
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      console.log(`Imagen anterior no encontrada, no se eliminó nada: ${fullPath}`);
    } else {
      console.error(`Error al eliminar imagen anterior ${fullPath}:`, e);
      // No detener la operación; solo registrar
    }
  }
}

export async function GET(request: NextRequest) {
  await Promise.resolve();
  const deny = await requirePermission('canView')(request as any);
  if (deny) return deny;
  const id = request.nextUrl.pathname.split('/')[3];

  try {
    const modelo = await prisma.modeloEquipo.findUnique({
      where: {
        id: id,
      },
    });

    if (!modelo) {
      return NextResponse.json({ message: "Modelo not found" }, { status: 404 });
    }

    // Auditoría: vista de detalle de modelo
    try {
      const user = await getServerUser(request as any);
      if (user) {
        await AuditLogger.logView(
          'modeloEquipo',
          id,
          `Vista de detalles del modelo: ${modelo.nombre}`,
          (user as any).id
        );
      }
    } catch (e) {
      console.warn('No se pudo registrar auditoría de vista de modelo:', e);
    }

    return NextResponse.json(modelo);
  } catch (error) {
    console.error("Error fetching modelo:", error);
    return NextResponse.json(
      { message: "Error fetching modelo" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  await Promise.resolve();
  const id = request.nextUrl.pathname.split('/')[3];
  const deny = await requireAnyPermission(['canUpdate','canManageComputadores','canManageDispositivos','canManageEmpresas'])(request as any);
  if (deny) return deny;
  try {
    // 1. Buscar el modelo existente
    const existingModelo = await prisma.modeloEquipo.findUnique({
      where: { id },
    });

    if (!existingModelo) {
      return NextResponse.json({ message: "Modelo not found" }, { status: 404 });
    }

    // 2. Leer los datos del FormData
    const formData = await request.formData();
  const nombre = formData.get('nombre') as string;
  const marcaId = formData.get('marcaId') as string;
  const tipo = formData.get('tipo') as string;
  const tipoEquipoIdRaw = formData.get('tipoEquipoId') as string | null;
    const imgFile = formData.get('img') as File;

    // Validar que 'nombre' exista
    if (!nombre || typeof nombre !== 'string') {
      return NextResponse.json({ message: "El campo 'nombre' es obligatorio" }, { status: 400 });
    }

    // 3. Validar marca
    if (!marcaId || typeof marcaId !== 'string') {
      return NextResponse.json({ message: "La marca es requerida." }, { status: 400 });
    }

    // 4. Manejo de la imagen
    let finalImageUrl: string | null = existingModelo.img;
    
    if (imgFile && imgFile.size > 0) {
      // Eliminar imagen anterior si existe
      if (existingModelo.img) {
        await deletePreviousImage(existingModelo.img);
      }

      // Crear directorio si no existe
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'modelos');
      await ensureDirExists(uploadDir);

      // Generar nombre único para el archivo
      const fileExtension = path.extname(imgFile.name);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // Guardar archivo
      const bytes = await imgFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

  // Store API URL so the file is served via streaming endpoint
  finalImageUrl = `/api/uploads/modelos/${fileName}`;
    }

    // Resolver tipoEquipoId (opcional) a partir de tipo o id provisto
    let resolvedTipoEquipoId: string | undefined = undefined;
    if (tipoEquipoIdRaw && typeof tipoEquipoIdRaw === 'string' && tipoEquipoIdRaw.length > 0) {
      const exists = await prisma.tipoEquipo.findUnique({ where: { id: tipoEquipoIdRaw } });
      if (exists) {
        resolvedTipoEquipoId = tipoEquipoIdRaw;
      }
    } else {
      const categoriaInferida = await inferCategoria(tipo);
      if (categoriaInferida) {
        const matching = await prisma.tipoEquipo.findFirst({ where: { nombre: tipo, categoria: categoriaInferida } });
        if (matching) {
          resolvedTipoEquipoId = matching.id;
        }
      } else {
        const anyMatch = await prisma.tipoEquipo.findFirst({ where: { nombre: tipo } });
        if (anyMatch) resolvedTipoEquipoId = anyMatch.id;
      }
    }

    // 5. Actualizar el modelo en la base de datos
    const updatedModelo = await prisma.modeloEquipo.update({
      where: { id },
      data: {
        nombre,
        tipo, // mantener string legacy sincronizado con selección
        tipoEquipoId: resolvedTipoEquipoId,
        img: finalImageUrl,
      },
    });

    // 6. Manejar la relación con la marca
    if (marcaId) {
      // Eliminar relaciones existentes con marcas
      await prisma.marcaModeloEquipo.deleteMany({
        where: { modeloEquipoId: id }
      });

      // Crear nueva relación con la marca
      await prisma.marcaModeloEquipo.create({
        data: {
          modeloEquipoId: id,
          marcaId: marcaId,
        }
      });
    }

    // 7. Auditoría de actualización
    try {
      const user = await getServerUser(request as any);
      const cambios: any = {
        antes: { nombre: existingModelo.nombre, tipo: existingModelo.tipo, img: existingModelo.img },
        despues: { nombre: updatedModelo.nombre, tipo: updatedModelo.tipo, img: updatedModelo.img },
      };
      if (marcaId) cambios.marcaActualizada = true;
      if (user) {
        await AuditLogger.logUpdate(
          'modeloEquipo',
          id,
          `Actualizó modelo: ${existingModelo.nombre} → ${updatedModelo.nombre}`,
          (user as any).id,
          cambios
        );
      }
    } catch (auditErr) {
      console.warn('No se pudo registrar auditoría de actualización de modelo:', auditErr);
    }

    return NextResponse.json(updatedModelo, { status: 200 });
  } catch (error: any) {
    console.error("Error updating modelo:", error);
    return NextResponse.json(
      { message: "Error updating modelo", details: error.message },
      { status: 500 }
    );
  }
}

// Helper local para inferir categoría por nombre de tipo
async function inferCategoria(nombreTipo: string): Promise<'COMPUTADORA' | 'DISPOSITIVO' | null> {
  const baseComputadoras = ['Laptop','Desktop','Servidor','Workstation','All-in-One'];
  const baseDispositivos = ['Impresora','Cámara','Tablet','Smartphone','Monitor','Teclado','Mouse','Router','Switch','Proyector','Escáner','Altavoces','Micrófono','Webcam','DVR'];
  if (baseComputadoras.some(x => x.toLowerCase() === nombreTipo.toLowerCase())) return 'COMPUTADORA';
  if (baseDispositivos.some(x => x.toLowerCase() === nombreTipo.toLowerCase())) return 'DISPOSITIVO';
  const found = await prisma.tipoEquipo.findFirst({ where: { nombre: { equals: nombreTipo } } });
  return found ? (found.categoria as any) : null;
}

export async function DELETE(request: NextRequest) {
  await Promise.resolve();
  const id = request.nextUrl.pathname.split('/')[3];
  const deny = await requirePermission('canDelete')(request as any);
  if (deny) return deny;

  try {
    // Fetch the modelo and related usage to validate and to get the image URL
    const modelo = await prisma.modeloEquipo.findUnique({
      where: { id },
      include: {
        marcaModelos: true,
        computadorModelos: true,
        dispositivoModelos: true,
      }
    });

    if (!modelo) {
      return NextResponse.json({ message: "Modelo not found" }, { status: 404 });
    }

    // Safety: block delete if there are associated equipos (defense-in-depth)
    const totalVinculosEquipos = (modelo.computadorModelos?.length || 0) + (modelo.dispositivoModelos?.length || 0);
    if (totalVinculosEquipos > 0) {
      return NextResponse.json(
        { message: 'No se puede eliminar el modelo porque tiene equipos asociados' },
        { status: 400 }
      );
    }

    // Delete the image file
    if (modelo.img) {
      // modelo.img may be stored as /api/uploads/... or /uploads/..., normalize to filesystem path
      const toFsPath = (s: string) => {
        let rel = s;
        if (rel.startsWith('/api/uploads/')) rel = rel.replace(/^\/api\/uploads\//, '');
        else if (rel.startsWith('/uploads/')) rel = rel.replace(/^\/uploads\//, '');
        return path.join(process.cwd(), 'public', 'uploads', ...rel.split('/'));
      };
      const imagePath = toFsPath(modelo.img);
      try {
        await unlink(imagePath);
        console.log(`Imagen eliminada: ${imagePath}`);
      } catch (unlinkError) {
        console.error("Error deleting image:", unlinkError);
        // No returning error here; just log it
      }
    }

    // Delete dependent relations first, then the modelo — all in a transaction
    await prisma.$transaction(async (tx) => {
      // Relaciones con marcas
      await tx.marcaModeloEquipo.deleteMany({ where: { modeloEquipoId: id } });
      // Relaciones con computadores y dispositivos (por si existen registros huérfanos)
      await tx.computadorModeloEquipo.deleteMany({ where: { modeloEquipoId: id } });
      await tx.dispositivoModeloEquipo.deleteMany({ where: { modeloEquipoId: id } });
      // Finalmente, el modelo
      await tx.modeloEquipo.delete({ where: { id } });
    });

    // Auditoría de eliminación
    try {
      const user = await getServerUser(request as any);
      if (user) {
        await AuditLogger.logDelete(
          'modeloEquipo',
          id,
          `Eliminó modelo: ${modelo.nombre}`,
          (user as any).id,
          { img: modelo.img }
        );
      }
    } catch (auditErr) {
      console.warn('No se pudo registrar auditoría de eliminación de modelo:', auditErr);
    }

    return NextResponse.json({ message: "Modelo deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting modelo:", error);
    return NextResponse.json(
      { message: "Error deleting modelo", details: error?.message || 'unknown' },
      { status: 500 }
    );
  }
}
