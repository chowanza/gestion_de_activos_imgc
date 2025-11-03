// src/lib/auth-server.ts
import { NextRequest } from 'next/server';
import { decrypt } from './auth';
import { permissionsArrayFromRole, getRolePermissions } from './permissions';

export async function getServerUser(request: NextRequest) {
  try {
    const cookie = request.cookies.get('session');
    if (!cookie?.value) {
      return null;
    }

    const session = await decrypt(cookie.value);
    // Normalizar el identificador: exponer siempre session.id
    try {
      const sid = (session as any)?.sub || (session as any)?.id;
      if (sid) {
        (session as any).id = sid as string;
      }
    } catch {}

    // DEV OVERRIDE (guarded): only in development and explicitly enabled
    try {
      const devEnabled = process.env.NODE_ENV === 'development' && process.env.DEV_SUPERADMIN_ENABLED === 'true';
      if (devEnabled) {
        const devUsername = process.env.DEV_SUPERADMIN_USERNAME;
        const devEmail = process.env.DEV_SUPERADMIN_EMAIL;

        const sessionUsername = (session as any)?.username;
        const sessionEmail = (session as any)?.email || (session as any)?.user?.email;

        if (
          (devUsername && sessionUsername === devUsername) ||
          (devEmail && sessionEmail === devEmail)
        ) {
          // Force admin role and mark as super admin in the session payload (dev only)
          (session as any).role = 'admin';
          (session as any).isSuperAdmin = true;
          (session as any).permissions = permissionsArrayFromRole('admin');
        }
      }
    } catch (e) {
      // Non-fatal: don't break session retrieval if env var handling fails
      console.warn('DEV_SUPERADMIN override check failed:', e);
    }

    try {
      // Ensure session.role is normalized to lower-case string
      const role = (session as any)?.role;
      if (role && typeof role === 'string') {
        (session as any).role = role.toString().toLowerCase();
      }

      // Always (re)attach computed permissions array unless in dev override explicitly set above
      (session as any).permissions = permissionsArrayFromRole((session as any)?.role);
    } catch (e) {
      console.warn('Error computing session permissions:', e);
    }

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

    // Same DEV override for layouts that use cookies() (no request object)
    try {
      const devEnabled = process.env.NODE_ENV === 'development' && process.env.DEV_SUPERADMIN_ENABLED === 'true';
      if (devEnabled) {
        const devUsername = process.env.DEV_SUPERADMIN_USERNAME;
        const devEmail = process.env.DEV_SUPERADMIN_EMAIL;

        const sessionUsername = (session as any)?.username;
        const sessionEmail = (session as any)?.email || (session as any)?.user?.email;

        if (
          (devUsername && sessionUsername === devUsername) ||
          (devEmail && sessionEmail === devEmail)
        ) {
          (session as any).role = 'admin';
          (session as any).isSuperAdmin = true;
          (session as any).permissions = permissionsArrayFromRole('admin');
        }
      }
    } catch (e) {
      console.warn('DEV_SUPERADMIN override check failed (layout):', e);
    }

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