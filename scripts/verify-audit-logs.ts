#!/usr/bin/env tsx
/**
 * scripts/verify-audit-logs.ts
 * - Attempts to login with provided credentials
 * - Fetches session
 * - Logs out
 * - Queries Prisma historialMovimientos for recent entries for that user
 *
 * Usage:
 *  ADMIN_USERNAME=admin ADMIN_PASSWORD=admin123 npx tsx scripts/verify-audit-logs.ts
 */

import { prisma } from '../src/lib/prisma';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USERNAME = process.env.ADMIN_USERNAME || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function main() {
  console.log('Verify audit logs script');
  console.log('Target:', BASE_URL);
  try {
    // 1) Login
    console.log('Logging in as', USERNAME);
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    const loginText = await loginRes.text();
    console.log('Login response status:', loginRes.status);
    try { console.log('Login body:', JSON.parse(loginText)); } catch { console.log('Login body (raw):', loginText); }

    const setCookie = loginRes.headers.get('set-cookie') || loginRes.headers.get('Set-Cookie');
    if (!setCookie) {
      console.warn('No Set-Cookie header returned from login. The server may not have set a cookie. Proceeding without cookie may fail.');
    } else {
      console.log('Set-Cookie header present.');
    }

    const cookieHeader = setCookie ? setCookie.split(';')[0] : '';

    // 2) Get session
    const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'GET',
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });
    const sessionBody = await sessionRes.json().catch(() => null);
    console.log('Session status:', sessionRes.status);
    console.log('Session body:', sessionBody);

  // session endpoint sometimes returns user.sub (JWT style) or user.id
  const userId = sessionBody?.user?.id || sessionBody?.user?.sub || sessionBody?.sub || sessionBody?.id;
    if (!userId) {
      console.error('Could not determine user id from session. Aborting audit check.');
      process.exitCode = 2;
      return;
    }

    // 3) Logout
    console.log('Logging out...');
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });
    const logoutBody = await logoutRes.json().catch(() => null);
    console.log('Logout status:', logoutRes.status);
    console.log('Logout body:', logoutBody);

    // 4) Query Prisma for historialMovimientos
    console.log('Querying DB for recent audit logs for user:', userId);
    const logs = await prisma.historialMovimientos.findMany({
      where: { usuarioId: userId },
      orderBy: { fecha: 'desc' },
      take: 10,
    });

    console.log('Found', logs.length, 'audit log(s):');
    logs.forEach(l => {
      console.log(`${l.fecha.toISOString()} | ${l.accion} | ${l.entidad} | ${l.descripcion} | detalles: ${l.detalles}`);
    });

    if (logs.length === 0) {
      console.warn('No audit logs found for the user. Make sure the AuditLogger is configured and the DB is connected.');
    }

  } catch (err) {
    console.error('Error verifying audit logs:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
