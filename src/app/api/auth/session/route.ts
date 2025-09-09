// app/api/auth/session/route.ts
import { getServerUser } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const user = await getServerUser(request);
  return NextResponse.json({ user });
}