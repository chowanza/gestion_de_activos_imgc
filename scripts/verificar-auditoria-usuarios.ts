#!/usr/bin/env npx tsx

/**
 * Verificar auditoría por roles (Admin, Editor, Viewer)
 *
 * Funcionalidad:
 * - Lista usuarios por rol
 * - Muestra conteos recientes de auditoría (login, logout, navegación, creación, actualización, eliminación)
 * - Ayuda a confirmar que Viewer y Editor registran movimientos
 *
 * Uso: npx tsx scripts/verificar-auditoria-usuarios.ts
 */

import { prisma } from '../src/lib/prisma';

type Counts = Record<string, number>;

async function main() {
  console.log('🚀 Verificando auditoría por roles (últimos 14 días)\n');

  const now = new Date();
  const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Obtener usuarios por rol
  const [admins, editors, viewers] = await Promise.all([
    prisma.user.findMany({ where: { role: 'Admin' }, select: { id: true, username: true } }),
    prisma.user.findMany({ where: { role: 'Editor' }, select: { id: true, username: true } }),
    prisma.user.findMany({ where: { role: 'Viewer' }, select: { id: true, username: true } }),
  ]);

  const roles = [
    { name: 'Admin', users: admins },
    { name: 'Editor', users: editors },
    { name: 'Viewer', users: viewers },
  ];

  for (const role of roles) {
    console.log(`\n=== 🔎 Rol: ${role.name} (${role.users.length} usuario(s)) ===`);
    if (role.users.length === 0) {
      console.log('   ⚠️ No hay usuarios con este rol');
      continue;
    }

    for (const u of role.users) {
      const logs = await prisma.historialMovimientos.findMany({
        where: {
          usuarioId: u.id,
          fecha: { gte: from }
        },
        orderBy: { fecha: 'desc' },
        take: 100
      });

      const counts: Counts = { login: 0, logout: 0, navegacion: 0, creacion: 0, actualizacion: 0, eliminacion: 0 };
      for (const l of logs) {
        const accion = (l.accion || '').toUpperCase();
        if (accion === 'NAVEGACION') {
          // distinguir login/logout via detalles si es posible
          try {
            const det = l.detalles ? JSON.parse(l.detalles) : null;
            if (det?.tipo === 'login') counts.login += 1;
            else if (det?.tipo === 'logout') counts.logout += 1;
            else counts.navegacion += 1;
          } catch {
            counts.navegacion += 1;
          }
        } else if (accion === 'CREACION') counts.creacion += 1;
        else if (accion === 'ACTUALIZACION') counts.actualizacion += 1;
        else if (accion === 'ELIMINACION') counts.eliminacion += 1;
      }

      console.log(`   👤 ${u.username} — últimos 14 días:`);
      console.log(
        `      ▶ Navegación: ${counts.navegacion} | Login: ${counts.login} | Logout: ${counts.logout} | ` +
        `Creación: ${counts.creacion} | Actualización: ${counts.actualizacion} | Eliminación: ${counts.eliminacion}`
      );
    }
  }

  console.log('\n🎉 Verificación de auditoría completada.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
