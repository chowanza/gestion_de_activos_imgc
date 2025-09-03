import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: id,
      },
      include: {
        departamento: {
          include: {
            gerencia: {}
          }
        }
      }
    });
    if (!usuario) {
      return NextResponse.json({ message: 'usuario no encontrado' }, { status: 404 });
    }
    return NextResponse.json(usuario, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    try {
        const body = await request.json();

        // Extraemos los datos del cuerpo de la petición.
        // Asegúrate de que el frontend envía 'departamentoId'.
        const { nombre, apellido, cargo, legajo, ced, departamentoId } = body;

        // Construimos el objeto de datos para la actualización.
        // Solo incluimos los campos que realmente queremos actualizar.
        const dataToUpdate: { [key: string]: any } = {};
        if (nombre) dataToUpdate.nombre = nombre;
        if (apellido) dataToUpdate.apellido = apellido;
        if (cargo) dataToUpdate.cargo = cargo;
        if (ced) dataToUpdate.ced = ced;
        // El legajo se debe convertir a número si viene como string
        if (legajo !== undefined) dataToUpdate.legajo = Number(legajo);
        // Aquí está la clave: usamos 'departamentoId'
        if (departamentoId) dataToUpdate.departamentoId = departamentoId;

        const updatedUsuario = await prisma.usuario.update({
            where: {
                id: id,
            },
            data: dataToUpdate, // Pasamos el objeto de datos corregido
        });

        return NextResponse.json(updatedUsuario, { status: 200 });

    } catch (error) {
        console.error("Error en PUT /api/usuarios/[id]:", error);
        // Devolvemos el error de Prisma para tener más detalles en el cliente
        return NextResponse.json(
            { message: 'Error al actualizar el usuario', error: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    await prisma.usuario.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'usuario eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar usuario' }, { status: 500 });
  }
}
