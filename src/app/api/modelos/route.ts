import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import path from 'path';
import { stat, mkdir, writeFile } from 'fs/promises';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const nombre = formData.get('nombre') as string;
        const tipo = formData.get('tipo') as string;
      const marcaId = formData.get('marcaId') as string | null;
      const marcaNombre = formData.get('marcaNombre') as string | null;
        let finalMarcaId: string;

        if (marcaId) {
            // An existing brand was selected. Use its ID.
            finalMarcaId = marcaId;
        } else if (marcaNombre) {
            // A new brand name was provided. Find it or create it.
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
            // No brand information was provided. Return an error.
            return NextResponse.json({ message: "La marca es requerida." }, { status: 400 });
        }
      const imagenFile = formData.get('img') as File | null;
          let imageUrl: string | undefined = undefined;
          const uploadDir = path.join(process.cwd(), 'public/uploads/modelos');
          console.log(`Intentando procesar imagen. Archivo recibido: ${imagenFile ? imagenFile.name : 'Ninguno'}`);
      
       if (imagenFile && imagenFile.size > 0) {
         console.log(`Tamaño del archivo de imagen: ${imagenFile.size} bytes`);
         try {
           await stat(uploadDir); // Comprueba si el directorio existe
           console.log(`Directorio de subida existe: ${uploadDir}`)
         } catch (e: any) {
           if (e.code === 'ENOENT') { // Si no existe (Error NO ENTry)
             console.log(`Creando directorio: ${uploadDir}`);
             await mkdir(uploadDir, { recursive: true }); // Créealo recursivamente
           } else {
             console.error("Error al comprobar el directorio:", e);
             throw e; // Relanzar otros errores
           }
         }
   

         const bytes = await imagenFile.arrayBuffer();
         const buffer = Buffer.from(bytes);
   
         // Crear un nombre de archivo único (ej: timestamp + nombre original)
         // Sanitizar el nombre del archivo para evitar problemas de ruta
         const safeOriginalName = imagenFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
         const filename = `${Date.now()}-${safeOriginalName}`;
         const imagePath = path.join(uploadDir, filename);
         console.log(`Intentando escribir archivo en: ${imagePath}`);
         await writeFile(imagePath, buffer);
         console.log(`Archivo escrito exitosamente: ${filename}`);
         imageUrl = `/uploads/modelos/${filename}`; // Ruta pública relativa
       } else if (imagenFile && imagenFile.size === 0) {
         console.log("Se recibió un archivo de imagen vacío, se omitirá.");
       }

        const nuevoModelo = await prisma.modeloDispositivo.create({
            data: {
                nombre,
                marcaId: finalMarcaId,
                tipo,
                img: imageUrl, // Guardar la ruta de la imagen
            },
        });

        return NextResponse.json(nuevoModelo, { status: 201 });

    } catch (error) {
     console.error("Error en POST /api/modelos:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el equipo';
    return NextResponse.json({ message: errorMessage }, { status: 500 });        
    }
}

export async function GET() {
  try {
    const modelos = await prisma.modeloDispositivo.findMany({
      include: {
        marca: true,
      },
    });
    return NextResponse.json(modelos, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener modelos' }, { status: 500 });
  }
}
