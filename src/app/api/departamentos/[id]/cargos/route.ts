import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerUser } from '@/lib/auth-server';
import { AuditLogger } from '@/lib/audit-logger';

// GET - Obtener todos los cargos de un departamento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const departamento = await prisma.departamento.findUnique({
      where: { id },
      include: {
        departamentoCargos: {
          include: {
            cargo: true
          }
        }
      }
    });

    if (!departamento) {
      return NextResponse.json(
        { message: 'Departamento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cargos: departamento.departamentoCargos.map(dc => dc.cargo)
    });

  } catch (error) {
    console.error('Error al obtener cargos del departamento:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo cargo para un departamento
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { nombre, descripcion } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { message: 'El nombre del cargo es obligatorio' },
        { status: 400 }
      );
    }

    // Verificar que el departamento existe
    const departamento = await prisma.departamento.findUnique({
      where: { id }
    });

    if (!departamento) {
      return NextResponse.json(
        { message: 'Departamento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya existe un cargo con el mismo nombre en este departamento
    const cargoExistente = await prisma.cargo.findFirst({
      where: {
        nombre: nombre.trim(),
        departamentoCargos: {
          some: {
            departamentoId: id
          }
        }
      }
    });

    if (cargoExistente) {
      return NextResponse.json(
        { message: 'Ya existe un cargo con este nombre en el departamento' },
        { status: 400 }
      );
    }

    // Crear el cargo y la relación con el departamento
    const result = await prisma.$transaction(async (tx) => {
      // Crear el cargo
      const cargo = await tx.cargo.create({
        data: {
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null
        }
      });

      // Crear la relación con el departamento
      await tx.departamentoCargo.create({
        data: {
          departamentoId: id,
          cargoId: cargo.id
        }
      });

      return cargo;
    });

    // Log de auditoría
    await AuditLogger.logCreate(
      'Cargo',
      result.id,
      `Cargo "${result.nombre}" creado en departamento "${departamento.nombre}"`,
      user.id,
      { 
        nombre: result.nombre,
        descripcion: result.descripcion,
        departamentoId: id,
        departamentoNombre: departamento.nombre
      }
    );

    return NextResponse.json({
      message: 'Cargo creado exitosamente',
      cargo: result
    });

  } catch (error) {
    console.error('Error al crear cargo:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

