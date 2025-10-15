export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth'; // Importa solo decrypt

export async function GET(req: NextRequest) {
  try {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const sessionData = await decrypt(session);
    return NextResponse.json({ user: sessionData }, { status: 200 });
  } catch (error) {
    console.error('[SESSION_API_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}