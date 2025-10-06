import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

// Obtener todos los tipos únicos de equipos
export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    
    // Obtener todos los tipos únicos de los modelos de equipos
    const tipos = await prisma.modeloEquipo.findMany({
      select: {
        tipo: true
      },
      distinct: ['tipo']
    });

    const tiposList = tipos.map(t => t.tipo).sort();

    // No registrar acceso a listas - ya se registra la navegación en useAuditLogger

    return NextResponse.json(tiposList, { status: 200 });
  } catch (error) {
    console.error('Error al obtener tipos de equipos:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Agregar un nuevo tipo de equipo (actualizando un modelo existente o creando uno nuevo)
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    const body = await request.json();
    const { tipo } = body;

    if (!tipo || !tipo.trim()) {
      return NextResponse.json(
        { message: 'El tipo de equipo es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un modelo con este tipo
    const existingTipo = await prisma.modeloEquipo.findFirst({
      where: { tipo: tipo.trim() }
    });

    if (existingTipo) {
      return NextResponse.json(
        { message: 'Ya existe un tipo de equipo con ese nombre' },
        { status: 400 }
      );
    }

    // Crear un modelo temporal para representar el nuevo tipo
    // Esto permite que el tipo aparezca en la lista
    const modelo = await prisma.modeloEquipo.create({
      data: {
        nombre: `Modelo ${tipo.trim()}`,
        tipo: tipo.trim(),
        img: null
      }
    });

    // Registrar creación
    if (user) {
      await AuditLogger.logCreate(
        'tipo-equipo',
        modelo.id,
        `Usuario ${user.username} creó el tipo de equipo: ${tipo.trim()}`,
        user.id as string,
        { tipo: tipo.trim() }
      );
    }

    return NextResponse.json({ tipo: tipo.trim(), id: modelo.id }, { status: 201 });
  } catch (error) {
    console.error('Error al crear tipo de equipo:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}




