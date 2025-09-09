import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';

// GET /api/cargos - Obtener todos los cargos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departamentoId = searchParams.get('departamentoId');

    const where = departamentoId ? { departamentoId } : {};

    const cargos = await prisma.cargo.findMany({
      where,
      include: {
        departamento: {
          include: {
            empresa: true
          }
        },
        empleados: {
          include: {
            departamento: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(cargos, { status: 200 });
  } catch (error) {
    console.error('Error fetching cargos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/cargos - Crear nuevo cargo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion, departamentoId } = body;

    if (!nombre || !departamentoId) {
      return NextResponse.json(
        { error: 'El nombre y departamento son requeridos' },
        { status: 400 }
      );
    }

    const cargo = await prisma.cargo.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        departamentoId
      },
      include: {
        departamento: {
          include: {
            empresa: true
          }
        }
      }
    });

    // Registrar en auditoría
    await AuditLogger.logCreate(
      'cargo',
      cargo.id,
      `Cargo "${cargo.nombre}" creado en ${cargo.departamento.nombre}`,
      undefined // TODO: Obtener userId del token/sesión
    );

    return NextResponse.json(cargo, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cargo:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un cargo con este nombre en el departamento' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

