// src/app/api/modelos/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marcaId = searchParams.get('marcaId');

  if (!marcaId) {
    return NextResponse.json({ error: 'marcaId es requerido' }, { status: 400 });
  }

  try {
    const modelos = await prisma.modeloDispositivo.findMany({
      where: { marcaId },
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json(modelos);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch modelos" }, { status: 500 });
  }
}