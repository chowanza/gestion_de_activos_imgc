// Simple smoke test script for local dev server
// Usage: node scripts/smoke-tests.js

const endpoints = [
  '/api/auth/session',
  '/api/empresas',
  '/api/ubicaciones',
  '/api/asignaciones',
  '/api/dispositivos',
  '/api/computador',
  '/api/users'
];

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function run() {
  console.log('Running smoke tests against', BASE);
  // If admin credentials provided, perform login and reuse cookie
  const adminUser = process.env.ADMIN_USERNAME || process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS;
  let cookieHeader = null;
  if (adminUser && adminPass) {
    console.log('Attempting to authenticate as', adminUser);
    try {
      const loginRes = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: adminUser, password: adminPass })
      });

      const setCookie = loginRes.headers.get('set-cookie');
      if (setCookie) {
        // Extract cookie name=value pair (before first ';')
        cookieHeader = setCookie.split(';')[0];
        console.log('Authenticated, obtained session cookie.');
      } else {
        console.warn('Login did not return Set-Cookie header.');
      }

      const loginBody = await loginRes.text();
      console.log('/api/auth/login ->', loginRes.status, loginRes.statusText, loginBody.slice(0, 200));
    } catch (err) {
      console.error('Login failed:', err.message || err);
    }
  }
  for (const ep of endpoints) {
    const url = `${BASE}${ep}`;
    try {
      const headers = { 'cache-control': 'no-store' };
      if (cookieHeader) headers['cookie'] = cookieHeader;
      const res = await fetch(url, { headers });
      const ct = res.headers.get('content-type') || '';
      let body = null;
      if (ct.includes('application/json')) {
        const json = await res.json();
        const preview = JSON.stringify(json, null, 2).slice(0, 1000);
        body = preview + (JSON.stringify(json).length > 1000 ? '... (truncated)' : '');
      } else {
        const text = await res.text();
        body = text.slice(0, 500) + (text.length > 500 ? '... (truncated)' : '');
      }
      console.log(`\nGET ${ep} -> ${res.status} ${res.statusText}`);
      console.log(body);
    } catch (err) {
      console.error(`\nGET ${ep} -> ERROR`, err.message || err);
    }
  }
}

run().catch(err => {
  console.error('Smoke tests failed:', err);
  process.exit(1);
});
