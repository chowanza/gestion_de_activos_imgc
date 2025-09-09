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
      include: { gerente: true },
    });
    return depto?.gerente || null;
  }

  // targetType === 'Empleado'
  const empleado = await tx.empleado.findUnique({
    where: { id: args.targetId },
    include: {
      departamento: { include: { gerente: true } },
      cargo: true,
    },
  });

  if (!empleado) return null;

  const esGerente = (empleado.cargo?.nombre || '').toLowerCase().includes('gerente');

  if (preferGG && esGerente) {
    // Si tienes la tabla Configuracion
    // const cfg = await tx.configuracion.findUnique({
    //   where: { id: 1 },
    //   include: { gerenteGeneral: true },
    // });
    // if (cfg?.gerenteGeneral) return cfg.gerenteGeneral;
  }

  return empleado.departamento?.gerente || null;
}
