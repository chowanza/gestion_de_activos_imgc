import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, requireAnyPermission } from '@/lib/role-middleware';
import path from 'path';
import { promises as fs } from 'fs';

export async function POST(request: Request) {
  // Permission: only users with create/manage catalog rights
  const deny = await requireAnyPermission(['canCreate','canManageComputadores','canManageDispositivos','canManageEmpresas'])(request as any);
  if (deny) return deny;
    try {
        const formData = await request.formData();
        const nombre = formData.get('nombre') as string;
        const tipo = formData.get('tipo') as string;
        const marcaId = formData.get('marcaId') as string;
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

            imagePath = `/uploads/modelos/${fileName}`;
        }

        const nuevoModelo = await prisma.modeloEquipo.create({
            data: {
                nombre,
                tipo,
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
        marcaModelos: {
          include: {
            marca: true,
          },
        },
      },
    });

    // Transformar los datos para que coincidan con la interfaz esperada
    const modelosTransformados = modelos.map(modelo => ({
      id: modelo.id,
      nombre: modelo.nombre,
      tipo: modelo.tipo,
      img: modelo.img ? modelo.img.replace('/img/equipos/', '/uploads/modelos/') : null,
      marca: modelo.marcaModelos[0]?.marca || { id: '', nombre: 'Sin marca' },
    }));

    return NextResponse.json(modelosTransformados, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener modelos' }, { status: 500 });
  }
}
