// src/app/api/proveedores/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const proveedores = await prisma.lineaTelefonica.findMany({
      select: {
        proveedor: true,
      },
      distinct: ['proveedor'],
    });
    // Formateamos para que sea una lista de strings
    const listaProveedores = proveedores.map(p => p.proveedor).sort();
    return NextResponse.json(listaProveedores);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch proveedores" }, { status: 500 });
  }
}