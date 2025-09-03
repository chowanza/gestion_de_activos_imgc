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

    // 2. Leer los datos del formulario
    const data = await request.formData();
    const nombre = data.get('nombre') as string;
    const marcaId = data.get('marcaId') as string;
    const tipo = data.get('tipo') as string;
    // Tomamos el archivo de imagen (si existe)
    const imagenFile = data.get('img') as File | null;
    const marcaNombre = data.get('marcaNombre') as string | null;

    // Validar que 'nombre' exista
    if (!nombre || typeof nombre !== 'string') {
      return NextResponse.json({ message: "El campo 'nombre' es obligatorio" }, { status: 400 });
    }

    // 3. Procesar la marca: usar el ID existente o, si se proporciona un nombre, buscar o crear la marca.
    let finalMarcaId: string;
    if (marcaId && marcaId.trim() !== '') {
      finalMarcaId = marcaId;
    } else if (marcaNombre && marcaNombre.trim() !== '') {
      let existingMarca = await prisma.marca.findUnique({
        where: { nombre: marcaNombre },
      });
      if (existingMarca) {
        finalMarcaId = existingMarca.id;
      } else {
        const newMarca = await prisma.marca.create({
          data: { nombre: marcaNombre },
        });
        finalMarcaId = newMarca.id;
      }
    } else {
      return NextResponse.json({ message: "La marca es requerida." }, { status: 400 });
    }

    // 4. Manejo de la imagen
    // Por defecto se mantiene la URL de imagen existente
    let finalImageUrl: string | null = existingModelo.img;
    let oldImageToDelete: string | null = null;

    // Si se ha enviado un archivo para "img" y no es de tipo string (p. ej., File)
    if (imagenFile && typeof imagenFile !== 'string') {
      if (imagenFile.size > 0) {
        // Hay una nueva imagen, se sube el archivo
        oldImageToDelete = existingModelo.img; // Se marcará la imagen anterior para eliminar
        const uploadDir = path.join(process.cwd(), 'public/uploads/equipos');
        await ensureDirExists(uploadDir);

        const bytes = await imagenFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeOriginalName = imagenFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${Date.now()}-${safeOriginalName}`;
        const imagePath = path.join(uploadDir, filename);

        await writeFile(imagePath, buffer);
        finalImageUrl = `/uploads/equipos/${filename}`;
      } else {
        // Si se envía el campo pero está vacío, se puede interpretar como "se desea eliminar la imagen actual"
        finalImageUrl = null;
      }
    }

    // 5. Preparar los datos a actualizar
    const dataToUpdate: { [key: string]: any } = {
      nombre,
      tipo,
      marcaId: finalMarcaId,
      img: finalImageUrl,
    };

    // 6. Actualizar el modelo en la base de datos
    const updatedModelo = await prisma.modeloDispositivo.update({
      where: { id },
      data: dataToUpdate,
    });

    // 7. Si se subió una nueva imagen y había una anterior, borrarla del sistema de archivos
    if (finalImageUrl !== existingModelo.img && oldImageToDelete) {
      await deletePreviousImage(oldImageToDelete);
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
      } catch (unlinkError) {
        console.error("Error deleting image:", unlinkError);
        return NextResponse.json({ message: "Error deleting image" }, { status: 500 });
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
