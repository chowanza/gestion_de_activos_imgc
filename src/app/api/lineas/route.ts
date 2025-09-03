import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function GET() {
  try {
     const lineas = await prisma.lineaTelefonica.findMany({
    include: {
      // Incluimos las asignaciones relacionadas
      asignaciones: {
        // Ordenamos por fecha descendente para obtener la más reciente primero
        orderBy: {
          date: 'desc',
        },
        // Solo necesitamos la más reciente
        take: 1,
        // Incluimos los datos del usuario o departamento al que fue asignada
        include: {
          targetUsuario: {
            select: { nombre: true, apellido: true } // Solo trae los campos que necesitas
          },
          targetDepartamento: {
            select: { nombre: true } // Solo trae el nombre del departamento
          },
        },
      },
    },
  });
    return NextResponse.json(lineas, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener lineas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Ya no es FormData, ahora es JSON simple
    const body = await request.json();
    const {  imei, numero, proveedor } = body;

    // Validación
    if ( !numero  || !proveedor) {
        return NextResponse.json({ message: 'Todos los campos son requeridos' }, { status: 400 });
    }

    const nuevoDispositivo = await prisma.lineaTelefonica.create({
      data: {
        imei,
        numero,
        proveedor,
      },
    });
    return NextResponse.json(nuevoDispositivo, { status: 201 });
  } catch (error) {
    console.error(error);
    // Manejo de errores (ej: serial o nsap duplicado - código P2002 de Prisma)
    return NextResponse.json({ message: 'Error al crear el dispositivo' }, { status: 500 });
  }
}
