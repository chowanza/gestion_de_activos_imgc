import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, stat, unlink } from 'fs/promises'; // Añadimos unlink
import path from 'path';


import prisma  from "@/lib/prisma";

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
    if (imagePath) {
        // imagePath viene como /uploads/equipos/imagen.jpg, necesitamos la ruta completa del sistema
        const fullPath = path.join(process.cwd(), 'public', imagePath);
        try {
            await stat(fullPath); // Verifica si existe
            await unlink(fullPath); // Elimina el archivo
            console.log(`Imagen anterior eliminada: ${fullPath}`);
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                console.log(`Imagen anterior no encontrada, no se eliminó nada: ${fullPath}`);
            } else {
                console.error(`Error al eliminar imagen anterior ${fullPath}:`, e);
                // Podrías decidir si este error debe detener la operación o solo registrarse
            }
        }
    }
}


export async function GET(request: NextRequest) {
  await Promise.resolve();
  const id = request.nextUrl.pathname.split('/')[3];

  try {
    const modelo = await prisma.modeloDispositivo.findUnique({
      where: {
        id: id,
      },
    });

    if (!modelo) {
      return NextResponse.json({ message: "Modelo not found" }, { status: 404 });
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
  try {
    // 1. Buscar el modelo existente
    const existingModelo = await prisma.modeloDispositivo.findUnique({
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

      finalImageUrl = `/uploads/modelos/${fileName}`;
    }

    // 5. Preparar los datos a actualizar
    const dataToUpdate: { [key: string]: any } = {
      nombre,
      tipo,
      marcaId,
      img: finalImageUrl,
    };

    // 6. Actualizar el modelo en la base de datos
    const updatedModelo = await prisma.modeloDispositivo.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedModelo, { status: 200 });
  } catch (error: any) {
    console.error("Error updating modelo:", error);
    return NextResponse.json(
      { message: "Error updating modelo", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  await Promise.resolve();
  const id = request.nextUrl.pathname.split('/')[3];

  try {
    // Fetch the modelo to get the image URL
    const modelo = await prisma.modeloDispositivo.findUnique({
      where: {
        id: id,
      },
    });

    if (!modelo) {
      return NextResponse.json({ message: "Modelo not found" }, { status: 404 });
    }

    // Delete the image file
    if (modelo.img) {
      const imagePath = path.join(process.cwd(), 'public', modelo.img);
      try {
        await unlink(imagePath);
        console.log(`Imagen eliminada: ${imagePath}`);
      } catch (unlinkError) {
        console.error("Error deleting image:", unlinkError);
        // No retornar error aquí, solo registrar el error
      }
    }

    // Delete the modelo from the database
    await prisma.modeloDispositivo.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: "Modelo deleted successfully" });
  } catch (error) {
    console.error("Error deleting modelo:", error);
    return NextResponse.json(
      { message: "Error deleting modelo" },
      { status: 500 }
    );
  }
}
