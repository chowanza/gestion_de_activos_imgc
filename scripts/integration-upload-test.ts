#!/usr/bin/env node

/*
 * scripts/integration-upload-test.ts
 *
 * Simple integration test that POSTs a single image file to /api/empresas
 * as FormData, receives the returned entity, and then checks the DB entry
 * to verify the stored `logo` field and that the /api/uploads/... URL is reachable.
 *
 * Note: This script expects the dev server (next start) to be running at NEXT_PUBLIC_URL
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

const BASE = process.env.NEXT_PUBLIC_URL || 'http://127.0.0.1:3000';

async function run() {
  const filePath = path.join(process.cwd(), 'public', 'img', 'logo.png');
  if (!fs.existsSync(filePath)) {
    console.error('Test image not found:', filePath);
    process.exit(1);
  }

  const form = new FormData();
  form.append('nombre', 'PRUEBA-INTEGRACION-' + Date.now());
  form.append('descripcion', 'Prueba de integración uploads');
  form.append('logo', fs.createReadStream(filePath));

  console.log('Posting to', `${BASE}/api/empresas`);
  const res = await fetch(`${BASE}/api/empresas`, { method: 'POST', body: form as any, headers: form.getHeaders() as any });
  const body = await res.json();
  console.log('Response status:', res.status);
  console.log('Response body:', body);

  if (!body || !body.id) {
    console.error('Upload failed or API did not return created empresa');
    process.exit(1);
  }

  // Fetch the saved entity from the API to double-check
  const id = body.id;
  const getRes = await fetch(`${BASE}/api/empresas/${id}`);
  if (getRes.status !== 200) {
    console.error('Failed to fetch created empresa:', getRes.status);
    process.exit(1);
  }
  const saved = await getRes.json();
  console.log('Saved entity:', saved);
  if (saved.logo && typeof saved.logo === 'string') {
    const fileUrl = `${BASE}${saved.logo}`;
    console.log('Checking uploaded URL:', fileUrl);
    const imgRes = await fetch(fileUrl);
    console.log('Image GET status:', imgRes.status);
    if (imgRes.status === 200) {
      console.log('Integration test: SUCCESS — image served and empresa saved with api/uploads path');
      process.exit(0);
    } else {
      console.error('Integration test: FAILED — image not served (status ' + imgRes.status + ')');
      process.exit(1);
    }
  } else {
    console.error('Integration test: FAILED — saved entity has no logo or unexpected format');
    process.exit(1);
  }
}

run().catch(err => { console.error('Integration test error', err); process.exit(1); });
