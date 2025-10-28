#!/usr/bin/env npx tsx
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🔎 Comprobando duplicados en users.email...');

  const users = await prisma.user.findMany({
    where: { email: { not: null } },
    select: { id: true, username: true, email: true },
  });

  const map = new Map<string, Array<{ id: string; username: string; email: string }>>();
  for (const u of users) {
    if (!u.email) continue;
    const arr = map.get(u.email) ?? [];
    arr.push({ id: u.id, username: u.username, email: u.email });
    map.set(u.email, arr);
  }

  const duplicates: [string, Array<{ id: string; username: string; email: string }>][] = [];
  for (const [email, rows] of map.entries()) {
    if (rows.length > 1) duplicates.push([email, rows]);
  }

  if (duplicates.length === 0) {
    console.log('✅ No se encontraron emails duplicados.');
    process.exit(0);
  }

  console.log('⚠️ Emails duplicados encontrados:');
  for (const [email, rows] of duplicates) {
    console.log(`- ${email} (count: ${rows.length})`);
    console.table(rows);
  }

  process.exit(2);
}

main().catch((e) => {
  console.error('❌ Error ejecutando la comprobación:', e);
  process.exit(1);
});
