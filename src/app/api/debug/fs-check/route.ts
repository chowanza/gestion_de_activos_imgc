import { NextResponse } from 'next/server';

// Debug endpoint disabled in cleanup branch – return 410 Gone
export async function GET() {
  return new NextResponse(JSON.stringify({ ok: false, message: 'Debug endpoint removed' }), { status: 410, headers: { 'Content-Type': 'application/json' } });
}
