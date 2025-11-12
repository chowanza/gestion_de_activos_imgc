import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, requireAnyPermission } from '@/lib/role-middleware';
import path from 'path';
import { promises as fs } from 'fs';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

export async function POST(request: Request) {
  // Permission: only users with create/manage catalog rights
  const deny = await requireAnyPermission(['canCreate','canManageComputadores','canManageDispositivos','canManageEmpresas'])(request as any);
  if (deny) return deny;
    try {
        const formData = await request.formData();
  const nombre = formData.get('nombre') as string;
  const tipo = formData.get('tipo') as string; // legacy string value (frontend)
  const marcaId = formData.get('marcaId') as string;
  // Permitir que el frontend envíe directamente tipoEquipoId (futura adopción); si no viene lo resolvemos por nombre+categoría
  const tipoEquipoIdRaw = formData.get('tipoEquipoId') as string | null;
        const imgFile = formData.get('img') as File;

    if (!nombre || !tipo || !marcaId) {
      return NextResponse.json({ message: "Nombre, tipo y marca son requeridos." }, { status: 400 });
    }

  let imagePath = null;
        if (imgFile && imgFile.size > 0) {
            // Crear directorio si no existe
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'modelos');
            await fs.mkdir(uploadDir, { recursive: true });

            // Generar nombre único para el archivo
            const fileExtension = path.extname(imgFile.name);
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);

            // Guardar archivo
            const bytes = await imgFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await fs.writeFile(filePath, buffer);

      // Store URL using the streaming endpoint for consistent serving
      imagePath = `/api/uploads/modelos/${fileName}`;
        }

    let resolvedTipo = tipo;
    let resolvedTipoEquipoId: string | undefined = undefined;

    // Intentar resolver tipoEquipoId si no fue provisto: buscamos por categoria inferida
    // Inferir categoría desde listado base: si coincide con TIPOS_COMPUTADORAS => COMPUTADORA, else DISPOSITIVO
    const categoriaInferida = await inferCategoria(tipo);

    if (tipoEquipoIdRaw && typeof tipoEquipoIdRaw === 'string' && tipoEquipoIdRaw.length > 0) {
      // Validar existencia
      const exists = await prisma.tipoEquipo.findUnique({ where: { id: tipoEquipoIdRaw } });
      if (exists) {
        resolvedTipoEquipoId = tipoEquipoIdRaw;
        resolvedTipo = exists.nombre; // asegurar consistencia
      }
    } else if (categoriaInferida) {
      const matchingTipo = await prisma.tipoEquipo.findFirst({
        where: { nombre: tipo, categoria: categoriaInferida }
      });
      if (matchingTipo) {
        resolvedTipoEquipoId = matchingTipo.id;
        resolvedTipo = matchingTipo.nombre; // normalizar mayúsculas/caso
      }
    }

    const nuevoModelo = await prisma.modeloEquipo.create({
      data: {
        nombre,
        tipo: resolvedTipo, // legacy string siempre poblado
        tipoEquipoId: resolvedTipoEquipoId, // opcional
        img: imagePath,
      },
    });

        // Crear la relación marca-modelo
        await prisma.marcaModeloEquipo.create({
            data: {
                marcaId,
                modeloEquipoId: nuevoModelo.id,
            },
        });

        // Auditoría de creación de modelo (incluye marca y tipo)
        try {
          const user = await getServerUser(request as any);
          if (user) {
            await AuditLogger.logCreate(
              'modeloEquipo',
              nuevoModelo.id,
              `Creó modelo "${nombre}" (tipo: ${resolvedTipo}) para marca ${marcaId}`,
              (user as any).id,
              { nombre, tipo: resolvedTipo, tipoEquipoId: resolvedTipoEquipoId, marcaId, img: imagePath }
            );
          }
        } catch (auditErr) {
          console.warn('No se pudo registrar auditoría de creación de modelo:', auditErr);
        }

        return NextResponse.json(nuevoModelo, { status: 201 });

    } catch (error) {
        console.error("Error en POST /api/modelos:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el modelo';
        return NextResponse.json({ message: errorMessage }, { status: 500 });        
    }
}

export async function GET(request: Request) {
  // Permission: viewing modelos
  const deny = await requirePermission('canView')(request as any);
  if (deny) return deny;
  try {
    const modelos = await prisma.modeloEquipo.findMany({
      include: {
        marcaModelos: { include: { marca: true } },
        tipoEquipo: true,
      },
    });

    // Transformar los datos para que coincidan con la interfaz esperada
    const modelosTransformados = await Promise.all(modelos.map(async (modelo) => {
      // Normalize stored image URLs to use /api/uploads
      const raw = modelo.img || null;
      let normalized: string | null = null;
      if (raw) {
        if (raw.startsWith('/api/uploads/')) {
          normalized = raw;
        } else if (raw.startsWith('/uploads/')) {
          normalized = raw.replace(/^\/uploads\//, '/api/uploads/');
        } else if (raw.startsWith('/img/equipos/')) {
          // Legacy path used in early seeds; map to modelos folder
          normalized = raw.replace(/^\/img\/equipos\//, '/api/uploads/modelos/');
        } else {
          // External or already absolute URL; keep as-is
          normalized = raw;
        }
      }

      // Determinar categoría del modelo (preferir relación, sino inferir por nombre de tipo)
      let categoria: 'COMPUTADORA' | 'DISPOSITIVO' | null = (modelo as any).tipoEquipo?.categoria || null;
      if (!categoria) {
        categoria = await inferCategoria(modelo.tipo);
      }
      return {
        id: modelo.id,
        nombre: modelo.nombre,
        tipo: modelo.tipoEquipo?.nombre || modelo.tipo, // preferir nombre desde relación si existe
        tipoEquipoId: modelo.tipoEquipoId || null,
        categoria,
        img: normalized,
        marca: modelo.marcaModelos[0]?.marca || { id: '', nombre: 'Sin marca' },
      };
    }));

    // Registrar auditoría de navegación/lista solo una vez por petición (sin detalles de cada modelo)
    try {
      const user = await getServerUser(request as any);
      if (user) {
        await AuditLogger.logNavigation(
          'modeloEquipo',
          `Listado de modelos (${modelosTransformados.length})`,
          (user as any).id
        );
      }
    } catch (auditErr) {
      console.warn('No se pudo registrar auditoría de listado de modelos:', auditErr);
    }
    return NextResponse.json(modelosTransformados, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener modelos' }, { status: 500 });
  }
}

// --- Helpers internos ---
async function inferCategoria(nombreTipo: string): Promise<'COMPUTADORA' | 'DISPOSITIVO' | null> {
  const baseComputadoras = ['Laptop','Desktop','Servidor','Workstation','All-in-One'];
  const baseDispositivos = ['Impresora','Cámara','Tablet','Smartphone','Monitor','Teclado','Mouse','Router','Switch','Proyector','Escáner','Altavoces','Micrófono','Webcam','DVR'];
  if (baseComputadoras.some(x => x.toLowerCase() === nombreTipo.toLowerCase())) return 'COMPUTADORA';
  if (baseDispositivos.some(x => x.toLowerCase() === nombreTipo.toLowerCase())) return 'DISPOSITIVO';
  // Intentar buscar en BD si no está en listas base
  const found = await prisma.tipoEquipo.findFirst({
    where: { nombre: { equals: nombreTipo } }
  });
  return found ? (found.categoria as any) : null;
}
