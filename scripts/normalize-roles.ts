#!/usr/bin/env -S node

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function normalizeRoleValue(role: string | null | undefined) {
  if (!role) return 'user';
  const r = role.toString().trim();
  if (/^admin$/i.test(r)) return 'admin';
  if (/^no[-_]?admin$/i.test(r) || /^noadmin$/i.test(r)) return 'user';
  // keep known roles lowercased
  if (/^(user|viewer|assigner)$/i.test(r)) return r.toLowerCase();
  // fallback to lowercase
  return r.toLowerCase();
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  console.log('Normalize roles script. Apply mode:', apply);

  const users = await prisma.user.findMany({ select: { id: true, username: true, role: true } });
  const changes: { id: string; username: string; before: string | null; after: string }[] = [];

  for (const u of users) {
    const after = normalizeRoleValue(u.role);
    if ((u.role || '') !== after) {
      changes.push({ id: u.id, username: u.username, before: u.role || null, after });
    }
  }

  console.table(changes.map(c => ({ id: c.id, username: c.username, before: c.before, after: c.after })));

  if (!apply) {
    console.log('\nDry-run complete. Run with --apply to persist changes.');
    await prisma.$disconnect();
    return;
  }

  console.log('\nApplying role normalization...');
  const tx = await prisma.$transaction(async (tx) => {
    for (const c of changes) {
      await tx.user.update({ where: { id: c.id }, data: { role: c.after } });
      console.log(`Updated ${c.username} (${c.id}): ${c.before} -> ${c.after}`);
    }
  });

  console.log('Normalization applied.');
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); try { await prisma.$disconnect(); } catch {} process.exit(1); });
