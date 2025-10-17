import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon'
};

export async function GET(request: Request) {
  try {
  // Prefer Next.js-provided pathname when available
  // (request.nextUrl is available in Next route handlers)
  // Expecting URL like /api/uploads/<...path>
  // @ts-ignore
  const pathname = (request as any).nextUrl?.pathname || new URL(request.url).pathname || '';
    const prefix = '/api/uploads/';
    if (!pathname.startsWith(prefix)) {
      return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
    }

    const rel = pathname.slice(prefix.length);
    const parts = rel.split('/').filter(Boolean);
    if (parts.length === 0) {
      return NextResponse.json({ message: 'File not specified' }, { status: 400 });
    }

    // Prevent path traversal
    if (parts.some((p: string) => p.includes('..') || p.includes('\\'))) {
      return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
    }

  // Files are stored under public/uploads/<...parts>
  const fullPath = path.join(process.cwd(), 'public', 'uploads', ...parts);

    if (!fs.existsSync(fullPath)) {
      console.warn(`Upload file not found on disk: ${fullPath} (requested: ${pathname})`);
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const ext = path.extname(fullPath).replace('.', '').toLowerCase();
    const mime = MIME_MAP[ext] || 'application/octet-stream';

    const stat = await fs.promises.stat(fullPath);
    const total = stat.size;

    // ETag based on mtime and size
    const etag = `W/"${stat.mtimeMs.toString()}-${stat.size.toString()}"`;

    // Handle If-None-Match
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // Range support
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      const matches = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
      if (!matches) {
        return NextResponse.json({ message: 'Invalid Range' }, { status: 416 });
      }
      const start = matches[1] ? parseInt(matches[1], 10) : 0;
      const end = matches[2] ? parseInt(matches[2], 10) : total - 1;
      if (start >= total || end >= total || start > end) {
        return NextResponse.json({ message: 'Range Not Satisfiable' }, { status: 416 });
      }

      // Stream the requested range into a buffer
      const stream = fs.createReadStream(fullPath, { start, end });
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (c) => chunks.push(Buffer.from(c)));
        stream.on('end', () => resolve());
        stream.on('error', (e) => reject(e));
      });
      const chunk = Buffer.concat(chunks);

      const headers = new Headers();
      headers.set('Content-Type', mime);
      headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Length', String(chunk.length));
      headers.set('ETag', etag);
      headers.set('Cache-Control', 'public, max-age=0');

      return new NextResponse(chunk, { status: 206, headers });
    }

    const data = await fs.promises.readFile(fullPath);
    const headers = new Headers();
    headers.set('Content-Type', mime);
    headers.set('Content-Length', String(total));
    headers.set('Accept-Ranges', 'bytes');
    headers.set('ETag', etag);
    headers.set('Cache-Control', 'public, max-age=0');

    return new NextResponse(Buffer.from(data), { headers });
  } catch (error) {
    console.error('Error serving upload file:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
