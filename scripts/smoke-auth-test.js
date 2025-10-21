const fetch = require('node-fetch');

(async () => {
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'adminti', password: 'maveit2013' }),
      redirect: 'manual'
    });

    console.log('Login status:', loginRes.status);
    console.log('Set-Cookie header:', loginRes.headers.get('set-cookie'));

    // Extract cookie
    const setCookie = loginRes.headers.get('set-cookie');
    let cookie = '';
    if (setCookie) {
      cookie = setCookie.split(';')[0];
    }

    const protectedRes = await fetch('http://localhost:3000/api/usuarios', {
      method: 'GET',
      headers: { 'Cookie': cookie }
    });

    console.log('Protected GET /api/usuarios status:', protectedRes.status);
    const text = await protectedRes.text();
    console.log('Protected response length:', text.length);
  } catch (err) {
    console.error('Error in smoke test:', err);
  }
})();