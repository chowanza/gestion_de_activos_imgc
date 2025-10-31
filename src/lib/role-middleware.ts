// src/lib/role-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { getServerUser } from './auth-server';
import { getRolePermissions, RolePermissions, UserRole } from './permissions';
import { AuditLogger } from './audit-logger';

export type { UserRole, RolePermissions };

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  const permissions = getRolePermissions(role);
  return permissions[permission];
}

// Middleware para verificar permisos específicos
export function requirePermission(permission: keyof RolePermissions) {
  return async (request: NextRequest, userId?: string) => {
    if (!userId) {
      // try to extract from request/session
      const extracted = await getUserIdFromRequest(request);
      if (!extracted) {
        // Log 401 unauthenticated access
        try {
          const path = request.nextUrl?.pathname || 'unknown';
          const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
          const ua = request.headers.get('user-agent') || undefined;
          await AuditLogger.logUnauthorized(path, 401, undefined, ip, ua);
        } catch {}
        return NextResponse.json(
          { error: 'Usuario no autenticado' },
          { status: 401 }
        );
      }
      userId = extracted;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      const userRole = (user.role as unknown as UserRole) || 'viewer';
      
      if (!hasPermission(userRole, permission)) {
        // Log 403 forbidden access
        try {
          const path = request.nextUrl?.pathname || 'unknown';
          const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
          const ua = request.headers.get('user-agent') || undefined;
          await AuditLogger.logUnauthorized(path, 403, userId, ip, ua, { permission });
        } catch {}
        return NextResponse.json(
          { error: 'No tienes permisos para realizar esta acción' },
          { status: 403 }
        );
      }

      return null; // Permiso concedido
    } catch (error) {
      console.error('Error checking permissions:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  };
}

// Middleware para verificar múltiples permisos (OR)
export function requireAnyPermission(permissions: (keyof RolePermissions)[]) {
  return async (request: NextRequest, userId?: string) => {
    if (!userId) {
      const extracted = await getUserIdFromRequest(request);
      if (!extracted) {
        try {
          const path = request.nextUrl?.pathname || 'unknown';
          const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
          const ua = request.headers.get('user-agent') || undefined;
          await AuditLogger.logUnauthorized(path, 401, undefined, ip, ua);
        } catch {}
        return NextResponse.json(
          { error: 'Usuario no autenticado' },
          { status: 401 }
        );
      }
      userId = extracted;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      const userRole = (user.role as unknown as UserRole) || 'viewer';
      
      const hasAnyPermission = permissions.some(permission => 
        hasPermission(userRole, permission)
      );

      if (!hasAnyPermission) {
        try {
          const path = request.nextUrl?.pathname || 'unknown';
          const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
          const ua = request.headers.get('user-agent') || undefined;
          await AuditLogger.logUnauthorized(path, 403, userId, ip, ua, { anyOf: permissions });
        } catch {}
        return NextResponse.json(
          { error: 'No tienes permisos para realizar esta acción' },
          { status: 403 }
        );
      }

      return null; // Permiso concedido
    } catch (error) {
      console.error('Error checking permissions:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  };
}

// Middleware para verificar múltiples permisos (AND)
export function requireAllPermissions(permissions: (keyof RolePermissions)[]) {
  return async (request: NextRequest, userId?: string) => {
    if (!userId) {
      const extracted = await getUserIdFromRequest(request);
      if (!extracted) {
        try {
          const path = request.nextUrl?.pathname || 'unknown';
          const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
          const ua = request.headers.get('user-agent') || undefined;
          await AuditLogger.logUnauthorized(path, 401, undefined, ip, ua);
        } catch {}
        return NextResponse.json(
          { error: 'Usuario no autenticado' },
          { status: 401 }
        );
      }
      userId = extracted;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      const userRole = (user.role as unknown as UserRole) || 'viewer';
      
      const hasAllPermissions = permissions.every(permission => 
        hasPermission(userRole, permission)
      );

      if (!hasAllPermissions) {
        try {
          const path = request.nextUrl?.pathname || 'unknown';
          const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
          const ua = request.headers.get('user-agent') || undefined;
          await AuditLogger.logUnauthorized(path, 403, userId, ip, ua, { allOf: permissions });
        } catch {}
        return NextResponse.json(
          { error: 'No tienes permisos para realizar esta acción' },
          { status: 403 }
        );
      }

      return null; // Permiso concedido
    } catch (error) {
      console.error('Error checking permissions:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  };
}

// Helper para obtener el ID del usuario desde el token/sesión
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const session = await getServerUser(request as any);
    if (!session) return null;
    // session shape may vary: try common fields
    const id = (session as any).sub || (session as any).id || (session as any).user?.id;
    return typeof id === 'string' ? id : null;
  } catch (e) {
    console.warn('getUserIdFromRequest failed:', e);
    return null;
  }
}


