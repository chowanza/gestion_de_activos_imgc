#!/usr/bin/env npx tsx

/**
 * Crea un usuario admin para pruebas locales/QA.
 * Usa variables de entorno opcionales: ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD.
 */

import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';

  console.log('🔐 Creando usuario admin...');
  console.log('  • username:', username);
  console.log('  • email   :', email);

  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existing) {
      console.log('ℹ️  Ya existe un usuario con ese username/email. Actualizando a rol admin si aplica...');
      if (existing.role?.toLowerCase() !== 'admin') {
        await prisma.user.update({ where: { id: existing.id }, data: { role: 'admin' } });
        console.log('✅ Rol actualizado a admin.');
      } else {
        console.log('✅ Ya es admin.');
      }
      console.log('ID:', existing.id);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashed,
        role: 'admin'
      }
    });

    console.log('✅ Usuario admin creado');
    console.log('   ID      :', user.id);
    console.log('   Username:', user.username);
    console.log('   Email   :', user.email);
    console.log('\n⚠️  Credenciales para pruebas:');
    console.log('   Usuario :', username);
    console.log('   Password:', password);
  } catch (err) {
    console.error('❌ Error creando admin:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
