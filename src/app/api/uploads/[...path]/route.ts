import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

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
    const url = new URL(request.url);
    // Expecting URL like /api/uploads/<...path>
    const pathname = url.pathname || '';
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
    if (parts.some((p) => p.includes('..') || p.includes('\\'))) {
      return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
    }

    const fullPath = path.join(process.cwd(), 'public', ...parts);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const ext = path.extname(fullPath).replace('.', '').toLowerCase();
    const mime = MIME_MAP[ext] || 'application/octet-stream';

    const data = await fs.promises.readFile(fullPath);

    return new NextResponse(Buffer.from(data), {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error serving upload file:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
