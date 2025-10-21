const fetch = require('node-fetch');

(async () => {
  try {
    const res = await fetch('http://172.31.128.1:3000/api/auth/logout', { method: 'POST' });
    console.log('Status:', res.status);
    console.log('Headers:');
    res.headers.forEach((v, k) => console.log(k + ': ' + v));
    console.log('Set-Cookie:', res.headers.get('set-cookie'));
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Error:', err);
  }
})();
