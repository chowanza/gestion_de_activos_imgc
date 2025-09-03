import { NextResponse } from 'next/server';
import prisma  from '@/lib/prisma';

export async function GET() {
  try {
    // Si tienes relación Gerencia.gerenteId:
    const gerentes = await prisma.usuario.findMany({
      where: {
        // Filtra por cargo o por relación si tienes un campo rol
        cargo: { contains: 'gerente', mode: 'insensitive' },
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cargo: true,
      },
      orderBy: { nombre: 'asc' },
    });

    // Mapea al formato que usa tu Select
    const options = gerentes.map(g => ({
      value: g.id,
      label: `${g.nombre} ${g.apellido}`,
      cargo: g.cargo,
    }));

    return NextResponse.json(options, { status: 200 });
  } catch (error: any) {
    console.error('[API/GERENTES] Error:', error);
    return NextResponse.json({ message: 'Error al obtener gerentes' }, { status: 500 });
  }
}
