import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const file = url.searchParams.get('file') || '';
    const stream = url.searchParams.get('stream') === '1';

    // Normalize leading slash
    const normalized = file.startsWith('/') ? file : `/${file}`;
    const fullPath = path.join(process.cwd(), 'public', normalized);

    const exists = fs.existsSync(fullPath);

    // Echo some request headers to help debug host/proxy issues
    const headers: Record<string, string | null> = {};
    // @ts-ignore - Request.headers has forEach in Node
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    if (stream) {
      if (!exists) {
        return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
      }
      const ext = path.extname(fullPath).replace('.', '').toLowerCase();
      const mime = (ext && ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif', svg: 'image/svg+xml' } as Record<string,string>)[ext]) || 'application/octet-stream';
      const data = await fs.promises.readFile(fullPath);
      return new NextResponse(Buffer.from(data), { headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=0' } });
    }

    return NextResponse.json({
      ok: true,
      file: normalized,
      fullPath,
      exists,
      headers,
    });
  } catch (error) {
    console.error('Debug upload-check error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
