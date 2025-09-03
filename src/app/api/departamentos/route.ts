import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function GET() {
  try {
    const departamentos = await prisma.departamento.findMany({
      include: {
        gerencia: true,
      }
    });
    return NextResponse.json(departamentos, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener departamentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Es mejor parsear el JSON directamente.
    // El manejo de texto plano es solo para depuración y puede ser eliminado.
    const body = await request.json();
    console.log("Cuerpo parseado:", body);

    const { nombre, ceco, sociedad, gerenciaId, gerenciaNombre } = body;

    // Validación básica
    if (!nombre || !ceco || !sociedad) {
      return NextResponse.json(
        { message: "Los campos nombre, ceco y sociedad son requeridos." },
        { status: 400 }
      );
    }
    
    // Si no se provee ni un ID de gerencia ni un nombre para crear una nueva
    if (!gerenciaId && !gerenciaNombre) {
        return NextResponse.json(
          { message: "Debe proporcionar una gerencia existente (gerenciaId) o crear una nueva (gerenciaNombre)." },
          { status: 400 }
        );
    }

    let dataForDepartamento: any = {
      nombre,
      ceco,
      sociedad,
    };

    // Lógica para manejar la Gerencia
    if (gerenciaNombre) {
      // Caso 1: Se está creando una nueva gerencia.
      // Primero, creamos la gerencia.
      const newGerencia = await prisma.gerencia.create({
        data: {
          nombre: gerenciaNombre,
        },
      });
      // Luego, usamos su ID para la relación.
      dataForDepartamento.gerenciaId = newGerencia.id;

    } else {
      // Caso 2: Se está conectando a una gerencia existente.
      dataForDepartamento.gerenciaId = gerenciaId;
    }

    // Ahora, creamos el departamento con los datos correctos y estructurados.
    const newDepartamento = await prisma.departamento.create({
      data: dataForDepartamento,
    });

    return NextResponse.json(newDepartamento, { status: 201 });

  } catch (error) {
    console.error("Error al crear departamento:", error);
    // Este log es más útil para ver errores de Prisma
    if (error instanceof Error) {
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
    }
    return NextResponse.json(
      { message: "Error interno del servidor al crear el departamento" },
      { status: 500 }
    );
  }
}
