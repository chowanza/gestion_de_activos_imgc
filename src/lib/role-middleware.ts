// src/lib/role-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

export type UserRole = 'admin' | 'user' | 'viewer' | 'assigner';

export interface RolePermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canManageUsers: boolean;
  canManageEmpresas: boolean;
  canManageDepartamentos: boolean;
  canManageComputadores: boolean;
  canManageDispositivos: boolean;
  canManageAsignaciones: boolean;
  canViewAuditLogs: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canView: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canAssign: true,
    canManageUsers: true,
    canManageEmpresas: true,
    canManageDepartamentos: true,
    canManageComputadores: true,
    canManageDispositivos: true,
    canManageAsignaciones: true,
    canViewAuditLogs: true,
  },
  user: {
    canView: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canAssign: true,
    canManageUsers: false,
    canManageEmpresas: false,
    canManageDepartamentos: true,
    canManageComputadores: true,
    canManageDispositivos: true,
    canManageAsignaciones: true,
    canViewAuditLogs: false,
  },
  viewer: {
    canView: true,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canAssign: false,
    canManageUsers: false,
    canManageEmpresas: false,
    canManageDepartamentos: false,
    canManageComputadores: false,
    canManageDispositivos: false,
    canManageAsignaciones: false,
    canViewAuditLogs: false,
  },
  assigner: {
    canView: true,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canAssign: true,
    canManageUsers: false,
    canManageEmpresas: false,
    canManageDepartamentos: false,
    canManageComputadores: false,
    canManageDispositivos: false,
    canManageAsignaciones: true,
    canViewAuditLogs: false,
  },
};

export function getRolePermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
}

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  const permissions = getRolePermissions(role);
  return permissions[permission];
}

// Middleware para verificar permisos específicos
export function requirePermission(permission: keyof RolePermissions) {
  return async (request: NextRequest, userId?: string) => {
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
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

      const userRole = user.role as UserRole;
      
      if (!hasPermission(userRole, permission)) {
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
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
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

      const userRole = user.role as UserRole;
      
      const hasAnyPermission = permissions.some(permission => 
        hasPermission(userRole, permission)
      );

      if (!hasAnyPermission) {
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
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
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

      const userRole = user.role as UserRole;
      
      const hasAllPermissions = permissions.every(permission => 
        hasPermission(userRole, permission)
      );

      if (!hasAllPermissions) {
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
  // Aquí implementarías la lógica para extraer el userId del token JWT
  // o de la sesión. Por ahora retornamos null como placeholder.
  // En una implementación real, esto vendría del middleware de autenticación.
  return null;
}


