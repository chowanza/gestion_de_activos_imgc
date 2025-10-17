const fetch = require('node-fetch');
(async ()=>{
  try {
    const res = await fetch('http://localhost:3000/api/debug/fs-check?file=empresas/1760644577862-nw7dqkpok0o.jpeg');
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      console.log(JSON.stringify(j, null, 2));
    } catch (e) {
      console.log('Response text (not JSON):');
      console.log(text.substring(0, 2000));
    }
  } catch (e) {
    console.error('Err', e);
  }
})();
