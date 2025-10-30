#!/usr/bin/env npx tsx

/**
 * Crear los 3 usuarios por defecto: admin, editor y viewer.
 * 
 * Uso:
 *   npx tsx scripts/seed-default-users.ts           # crea/actualiza sin eliminar otros
 *   npx tsx scripts/seed-default-users.ts --exclusive  # elimina cualquier otro usuario
 */

import prisma from '../src/lib/prisma';
import bcrypt from 'bcrypt';

async function ensureUser(username: string, role: 'admin' | 'editor' | 'viewer', password: string, email?: string | null) {
  const hash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    await prisma.user.update({
      where: { username },
      data: { role, password: hash, email: email || null }
    });
    console.log(`🔁 Actualizado usuario ${username} (${role})`);
  } else {
    await prisma.user.create({
      data: { username, role, password: hash, email: email || null }
    });
    console.log(`✅ Creado usuario ${username} (${role})`);
  }
}

async function main() {
  console.log('🚀 Sembrando usuarios por defecto (admin, editor, viewer) ...');
  const args = process.argv.slice(2);
  const exclusive = args.includes('--exclusive');

  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const editorPass = process.env.EDITOR_PASSWORD || 'editor123';
  const viewerPass = process.env.VIEWER_PASSWORD || 'viewer123';

  await ensureUser('admin', 'admin', adminPass, process.env.ADMIN_EMAIL || null);
  await ensureUser('editor', 'editor', editorPass, process.env.EDITOR_EMAIL || null);
  await ensureUser('viewer', 'viewer', viewerPass, process.env.VIEWER_EMAIL || null);

  if (exclusive) {
    console.log('🧹 Modo exclusivo: eliminando cualquier otro usuario distinto de admin/editor/viewer ...');
    const keep = ['admin','editor','viewer'];
    const deleted = await prisma.user.deleteMany({ where: { username: { notIn: keep } } });
    console.log(`🗑️ Usuarios eliminados: ${deleted.count}`);
  }

  console.log('🎉 Listo. Credenciales por defecto:');
  console.log('- admin / admin123');
  console.log('- editor / editor123');
  console.log('- viewer / viewer123');
}

main().catch((e) => {
  console.error('❌ Error seed-default-users:', e);
}).finally(async () => {
  await prisma.$disconnect();
});
