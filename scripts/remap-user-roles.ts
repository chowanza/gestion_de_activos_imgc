#!/usr/bin/env npx tsx

/**
 * Remapea roles de usuarios existentes a los 3 roles soportados (admin, editor, viewer)
 * manteniendo los usuarios actuales. Asigna el rol según el nombre de usuario.
 *
 * Uso:
 *   npx tsx scripts/remap-user-roles.ts           # dry-run (no escribe cambios)
 *   npx tsx scripts/remap-user-roles.ts --apply   # aplica cambios
 *
 * Reglas:
 * 1) Overrides explícitos por username exacto (case-insensitive) en `EXPLICIT_OVERRIDES`.
 * 2) Detección por patrones en el username (admin/editor/viewer).
 * 3) Fallback por rol actual: admin->admin, editor->editor, viewer->viewer, user/assigner/otro->editor.
 */

import prisma from '../src/lib/prisma';

const EXPLICIT_OVERRIDES: Record<string, 'admin' | 'editor' | 'viewer'> = {
  // 'nombre.exacto': 'admin',
  // 'jrodriguez': 'editor',
  // 'maria.consulta': 'viewer',
};

const PATTERNS: Array<{ role: 'admin' | 'editor' | 'viewer'; patterns: RegExp[] }> = [
  {
    role: 'admin',
    patterns: [/^admin$/i, /admin/i, /^root$/i, /^super/i, /\badmin\b/i, /administrador/i],
  },
  {
    role: 'editor',
    patterns: [/^editor$/i, /editor/i, /edit/i, /gestor/i, /manager/i, /operador/i, /operator/i, /assign/i],
  },
  {
    role: 'viewer',
    patterns: [/^viewer$/i, /viewer/i, /view/i, /consulta/i, /lector/i, /read/i, /visor/i],
  },
];

function normalize(s?: string | null): string {
  return (s || '').toString().trim();
}

function detectRoleByUsername(username: string): 'admin' | 'editor' | 'viewer' | null {
  const uname = normalize(username);
  const k = uname.toLowerCase();
  if (!k) return null;
  // explicit overrides first (case-insensitive key match)
  const explicit = Object.keys(EXPLICIT_OVERRIDES).find(e => e.toLowerCase() === k);
  if (explicit) return EXPLICIT_OVERRIDES[explicit];

  for (const group of PATTERNS) {
    if (group.patterns.some(rx => rx.test(uname))) return group.role;
  }
  return null;
}

function fallbackFromCurrentRole(current?: string | null): 'admin' | 'editor' | 'viewer' {
  const r = (current || '').toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'editor') return 'editor';
  if (r === 'viewer') return 'viewer';
  // legacy/otros -> editor por defecto
  if (r === 'user' || r === 'assigner') return 'editor';
  return 'editor';
}

async function main() {
  const APPLY = process.argv.includes('--apply');
  console.log(`\n🚀 Remapeo de roles (apply=${APPLY ? 'yes' : 'no'})\n`);

  const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, email: true } });
  if (users.length === 0) {
    console.log('ℹ️ No hay usuarios en la base de datos.');
    return;
  }

  const changes: Array<{ id: string; username: string; from: string | null; to: 'admin' | 'editor' | 'viewer'; reason: string }> = [];
  const countersBefore: Record<string, number> = {};
  const countersAfter: Record<string, number> = { admin: 0, editor: 0, viewer: 0 };

  for (const u of users) {
    const before = (u.role || '').toLowerCase();
    countersBefore[before] = (countersBefore[before] || 0) + 1;

    let target = detectRoleByUsername(u.username);
    let reason = 'patterns';
    if (!target) {
      target = fallbackFromCurrentRole(u.role);
      reason = 'fallback';
    }

    countersAfter[target]++;
    if (before !== target) {
      changes.push({ id: u.id, username: u.username, from: u.role || null, to: target, reason });
    }
  }

  console.log('📊 Totales ANTES por rol:', countersBefore);
  console.log('📊 Totales DESPUÉS estimados:', countersAfter);

  if (changes.length === 0) {
    console.log('\n✅ No hay cambios necesarios.');
  } else {
    console.log(`\n📝 Cambios propuestos (${changes.length}):`);
    for (const c of changes) {
      console.log(` - ${c.username}: ${c.from || 'none'} -> ${c.to} (${c.reason})`);
    }
  }

  if (APPLY && changes.length > 0) {
    console.log('\n💾 Aplicando cambios...');
    for (const c of changes) {
      await prisma.user.update({ where: { id: c.id }, data: { role: c.to } });
    }
    console.log('✅ Cambios aplicados.');
  } else {
    console.log('\n💡 Ejecuta con --apply para aplicar los cambios.');
  }
}

main().catch((e) => {
  console.error('❌ Error remapeando roles:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
