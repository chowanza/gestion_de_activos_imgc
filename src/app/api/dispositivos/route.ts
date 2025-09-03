import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'
import path from 'path';
import { stat, mkdir, writeFile } from 'fs/promises';
import { Prisma } from '@prisma/client';


export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);
  const asignado = searchParams.get('asignado');
  let where: Prisma.DispositivoWhereInput = {};
  
    if (asignado === 'false') {
      // Si queremos los NO asignados, ambos campos de ID deben ser null
      where = { usuarioId: null, departamentoId: null };
    } else if (asignado === 'true') {
      // Si queremos los SÍ asignados, al menos uno de los campos de ID NO debe ser null
      where = {
        OR: [
          { usuarioId: { not: null } },
          { departamentoId: { not: null } },
        ],
      };
    }
  try {
    const equipos = await prisma.dispositivo.findMany({
      where,
      include: {
        modelo:{
          include: {
            marca: true, // Incluye la marca del modelo
          }
        },
        usuario: true, // Incluye el usuario asignado (si existe)
        departamento: true, // Incluye el departamento asignado (si existe)
      },
      orderBy: {
        modelo: {
          nombre: 'asc'
        }
      }
    });
    return NextResponse.json(equipos, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Ya no es FormData, ahora es JSON simple
    const body = await request.json();
    const { modeloId, serial, nsap, estado } = body;

    // Validación
    if (!modeloId || !serial  || !estado) {
        return NextResponse.json({ message: 'Todos los campos son requeridos' }, { status: 400 });
    }

    const nuevoDispositivo = await prisma.dispositivo.create({
      data: {
        modeloId,
        serial,
        nsap,
        estado,
        // ... otros campos como usuarioId, departamentoId ...
      },
    });
    return NextResponse.json(nuevoDispositivo, { status: 201 });
  } catch (error) {
    console.error(error);
    // Manejo de errores (ej: serial o nsap duplicado - código P2002 de Prisma)
    return NextResponse.json({ message: 'Error al crear el dispositivo' }, { status: 500 });
  }
}
