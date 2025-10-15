import { NextResponse } from 'next/server';
import prisma  from '@/lib/prisma';

export async function GET() {
  try {
    // Buscar empleados con alguna organización cuyo cargo contenga 'gerente'
    const gerentes = await prisma.empleado.findMany({
      where: {
        organizaciones: {
          some: {
            cargo: {
              nombre: { contains: 'gerente' }
            }
          }
        }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        organizaciones: {
          select: {
            cargo: true
          }
        }
      },
      orderBy: { nombre: 'asc' },
    });

    // Mapea al formato que usa tu Select (toma el primer cargo encontrado)
    const options = gerentes.map(g => ({
      value: g.id,
      label: `${g.nombre} ${g.apellido}`,
      cargo: g.organizaciones[0]?.cargo || null,
    }));

    return NextResponse.json(options, { status: 200 });
  } catch (error: any) {
    console.error('[API/GERENTES] Error:', error);
    return NextResponse.json({ message: 'Error al obtener gerentes' }, { status: 500 });
  }
}
