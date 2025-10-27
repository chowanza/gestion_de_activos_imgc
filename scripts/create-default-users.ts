#!/usr/bin/env npx tsx

/**
 * Seed script to create three default users: admin, editor, viewer.
 *
 * Usage:
 *  - Dry run (only prints planned actions):
 *      npx tsx scripts/create-default-users.ts --dry
 *  - Run and apply (will upsert into DB):
 *      ADMIN_PASSWORD=YourPass Editor_PASSWORD=... npx tsx scripts/create-default-users.ts
 *
 * Passwords can be supplied via env vars: ADMIN_PASSWORD, EDITOR_PASSWORD, VIEWER_PASSWORD
 * If not supplied the script will use safe defaults (please change after creating users).
 */

import bcrypt from 'bcrypt'
import { prisma } from '../src/lib/prisma'

async function upsertUser(username: string, email: string | null, role: string, passwordPlain: string, dry = false) {
  const hashed = await bcrypt.hash(passwordPlain, 10)

  if (dry) {
    console.log(`Dry run: would upsert user: ${username} (role=${role})`)
    return
  }

  const existing = await prisma.user.findUnique({ where: { username } })

  if (existing) {
    await prisma.user.update({
      where: { username },
      data: {
        email,
        role,
        password: hashed,
      },
    })
    console.log(`Updated user: ${username}`)
  } else {
    await prisma.user.create({
      data: {
        username,
        email,
        role,
        password: hashed,
      },
    })
    console.log(`Created user: ${username}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dry = args.includes('--dry')

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const editorPassword = process.env.EDITOR_PASSWORD || 'editor123'
  const viewerPassword = process.env.VIEWER_PASSWORD || 'viewer123'

  console.log('Starting default users seed' + (dry ? ' (dry run)' : ''))

  try {
    await upsertUser('admin', 'admin@example.com', 'admin', adminPassword, dry)
    await upsertUser('editor', 'editor@example.com', 'editor', editorPassword, dry)
    await upsertUser('viewer', 'viewer@example.com', 'viewer', viewerPassword, dry)

    console.log('\nDone. Please change passwords immediately if you used defaults.')
  } catch (err) {
    console.error('Error seeding users:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
