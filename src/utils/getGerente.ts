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
    // Buscar el gerente activo del departamento usando la relación normalizada
    const deptoGerencia = await tx.departamentoGerente.findFirst({
      where: {
        departamentoId: args.targetId,
        activo: true,
        fechaDesasignacion: null
      },
      include: { gerente: true }
    });
    return deptoGerencia?.gerente || null;
  }

  // targetType === 'Empleado'
  const empleado = await tx.empleado.findUnique({
    where: { id: args.targetId }
  });

  if (!empleado) return null;

  // Obtener la organización activa del empleado para cargo
  const org = await tx.empleadoEmpresaDepartamentoCargo.findFirst({
    where: {
      empleadoId: empleado.id,
      activo: true,
      fechaDesasignacion: null
    },
    include: { cargo: true }
  });
  const esGerente = org?.cargo?.nombre?.toLowerCase().includes('gerente') ?? false;

  if (preferGG && esGerente) {
    // Si tienes la tabla Configuracion
    // const cfg = await tx.configuracion.findUnique({
    //   where: { id: 1 },
    //   include: { gerenteGeneral: true },
    // });
    // if (cfg?.gerenteGeneral) return cfg.gerenteGeneral;
  }

  // Buscar el gerente del departamento del empleado
  // Primero obtener la organización activa del empleado
  const orgDept = await tx.empleadoEmpresaDepartamentoCargo.findFirst({
    where: {
      empleadoId: empleado.id,
      activo: true,
      fechaDesasignacion: null
    }
  });
  if (!orgDept) return null;
  // Buscar el gerente activo del departamento
  const deptoGerencia = await tx.departamentoGerente.findFirst({
    where: {
      departamentoId: orgDept.departamentoId,
      activo: true,
      fechaDesasignacion: null
    },
    include: { gerente: true }
  });
  return deptoGerencia?.gerente || null;
}
