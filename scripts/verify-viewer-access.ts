#!/usr/bin/env tsx
/**
 * Verify viewer access:
 * - Login as viewer
 * - Fetch session
 * - GET /api/departamentos (should be 200)
 * - GET /api/empresas (should be 200)
 * - POST /api/empresas (should be forbidden -> 401/403)
 *
 * Usage:
 *  npx tsx scripts/verify-viewer-access.ts
 * or set envs: VIEWER_USERNAME/VIEWER_PASSWORD or ADMIN_USERNAME/ADMIN_PASSWORD (script falls back to ADMIN_ envs)
 */
// Removed accidental code fence markers
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USERNAME = process.env.VIEWER_USERNAME || process.env.ADMIN_USERNAME || 'viewer';
const PASSWORD = process.env.VIEWER_PASSWORD || process.env.ADMIN_PASSWORD || 'viewer123';

async function run() {
  console.log('Verify viewer access script');
  console.log('Target:', BASE_URL);

  try {
    // Login
    console.log('Logging in as', USERNAME);
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });
    console.log('Login status:', loginRes.status);
    const loginBody = await loginRes.json().catch(() => null);
    console.log('Login body:', loginBody);

    const setCookie = loginRes.headers.get('set-cookie') || loginRes.headers.get('Set-Cookie') || '';
    const cookieHeader = setCookie ? setCookie.split(';')[0] : '';

    // Session
    const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'GET',
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });
    const session = await sessionRes.json().catch(() => null);
    console.log('Session status:', sessionRes.status);
    console.log('Session body:', session);

    // Check permissions list
    const perms = session?.user?.permissions || session?.permissions || [];
    console.log('Permissions:', perms);

    // GET /api/departamentos
    console.log('GET /api/departamentos');
    const depRes = await fetch(`${BASE_URL}/api/departamentos`, {
      method: 'GET',
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });
    console.log('departamentos status:', depRes.status);
    if (depRes.ok) {
      const deps = await depRes.json();
      console.log('departamentos count:', Array.isArray(deps) ? deps.length : 'unknown');
    } else {
      console.log('departamentos body status not ok');
      try { console.log(await depRes.json()); } catch(e) { console.log(await depRes.text()); }
    }

    // GET /api/empresas
    console.log('GET /api/empresas');
    const empRes = await fetch(`${BASE_URL}/api/empresas`, {
      method: 'GET',
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });
    console.log('empresas status:', empRes.status);
    if (empRes.ok) {
      const emps = await empRes.json();
      console.log('empresas count:', Array.isArray(emps) ? emps.length : 'unknown');
    } else {
      console.log('empresas body status not ok');
      try { console.log(await empRes.json()); } catch(e) { console.log(await empRes.text()); }
    }

    // POST /api/empresas attempt (should be forbidden)
    console.log('Attempt POST /api/empresas (should be forbidden for viewer)');
    const postRes = await fetch(`${BASE_URL}/api/empresas`, {
      method: 'POST',
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      body: JSON.stringify({ nombre: 'test by viewer', descripcion: 'should fail' }),
    });
    console.log('POST /api/empresas status:', postRes.status);
    try { console.log('POST body:', await postRes.json()); } catch { console.log('POST body text:', await postRes.text()); }

    // Logout
    console.log('Logging out');
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });
    console.log('Logout status:', logoutRes.status);
  } catch (err) {
    console.error('Error running verify-viewer-access:', err);
    process.exitCode = 1;
  }
}

run();
