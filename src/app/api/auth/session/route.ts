// app/api/auth/session/route.ts
import { getSessionUser } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}