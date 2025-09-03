// lib/getGerente.ts (o en el mismo archivo del endpoint)
import { Prisma, PrismaClient } from '@prisma/client';

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

type GetGerenteArgs = {
  targetType: 'Usuario' | 'Departamento';
  targetId: string; // id del usuario o del departamento, según targetType
  preferirGerenteGeneralSiTargetEsGerente?: boolean; // true por defecto
};

export async function getGerente(tx: Tx, args: GetGerenteArgs) {
  const preferGG = args.preferirGerenteGeneralSiTargetEsGerente ?? true;

  if (args.targetType === 'Departamento') {
    const depto = await tx.departamento.findUnique({
      where: { id: args.targetId },
      include: { gerencia: { include: { gerente: true } } },
    });
    return depto?.gerencia?.gerente || null;
  }

  // targetType === 'Usuario'
  const usuario = await tx.usuario.findUnique({
    where: { id: args.targetId },
    include: {
      departamento: { include: { gerencia: { include: { gerente: true } } } },
    },
  });

  if (!usuario) return null;

  const esGerente = (usuario.cargo || '').toLowerCase().includes('gerente');

  if (preferGG && esGerente) {
    // Si tienes la tabla Configuracion
    const cfg = await tx.configuracion.findUnique({
      where: { id: 1 },
      include: { gerenteGeneral: true },
    });
    if (cfg?.gerenteGeneral) return cfg.gerenteGeneral;
  }

  return usuario.departamento?.gerencia?.gerente || null;
}
