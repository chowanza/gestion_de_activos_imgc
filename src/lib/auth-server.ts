// src/lib/auth-server.ts
import { NextRequest } from 'next/server';
import { decrypt } from './auth';

export async function getServerUser(request: NextRequest) {
  try {
    const cookie = request.cookies.get('session');
    if (!cookie?.value) {
      return null;
    }

    const session = await decrypt(cookie.value);
    return session;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}

// Función para uso en layouts (sin request)
export async function getSessionUser() {
  try {
    // En layouts de Next.js, necesitamos usar cookies() de next/headers
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie?.value) {
      return null;
    }

    const session = await decrypt(sessionCookie.value);
    return session;
  } catch (error) {
    console.error('Error getting session user:', error);
    return null;
  }
}

// Alias para compatibilidad con APIs
export const getServerUserForAPI = getServerUser;

// Función para crear una sesión (login)
export async function createSession(userId: string, role: string) {
  try {
    // En este caso, simplemente retornamos true
    // La creación real de la cookie se maneja en el cliente
    // o en la respuesta HTTP con Set-Cookie
    return { userId, role };
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

// Función para eliminar la sesión (logout)
export async function deleteSession() {
  try {
    // En este caso, simplemente retornamos true
    // La eliminación real de la cookie se maneja en el cliente
    // o en la respuesta HTTP con Set-Cookie
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}