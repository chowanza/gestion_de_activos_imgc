
import { prisma } from '../src/lib/prisma';

async function main() {
  const id = '1237c91a-f9ae-4c42-bc25-2dcb8f30a828';
  const dispositivo = await prisma.dispositivo.findUnique({
    where: { id },
    include: { asignaciones: true }
  });
  console.log(JSON.stringify(dispositivo, null, 2));
}

main().finally(() => prisma.$disconnect());
