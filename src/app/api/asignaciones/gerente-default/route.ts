import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { getGerente } from '@/utils/getGerente';
 // la función que ya tienes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get('type'); // 'Usuario' | 'Departamento'
    const targetId = searchParams.get('id');

    if (!targetType || !targetId) {
      return NextResponse.json({ message: 'Faltan parámetros' }, { status: 400 });
    }

    const gerente = await prisma.$transaction(async (tx) =>
      getGerente(tx, {
        targetType: targetType as 'Usuario' | 'Departamento',
        targetId,
        preferirGerenteGeneralSiTargetEsGerente: true,
      })
    );

    if (!gerente) {
      return NextResponse.json({ gerente: null }, { status: 200 });
    }

    // Devuelve en formato "Target" para tu Select
    return NextResponse.json({
      gerente: { value: gerente.id, label: `${gerente.nombre} ${gerente.apellido}` },
    });
  } catch (e: any) {
    console.error('[GET gerente-default] Error:', e);
    return NextResponse.json({ message: e.message || 'Error' }, { status: 500 });
  }
}
