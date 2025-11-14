// src/hooks/usePermissions.tsx
'use client';

import { useSession } from './useSession';

export type UserRole = 'admin' | 'editor' | 'viewer' | 'user' | 'assigner';

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

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
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
  editor: {
    // Mirror server: editor puede gestionar organización/catálogos, pero no equipos/estados/asignaciones
    canView: true,
    canCreate: true,
    canUpdate: true,
    canDelete: false,
    canAssign: false,
    canManageUsers: false,
    canManageEmpresas: true,
    canManageDepartamentos: true,
    canManageComputadores: false,
    canManageDispositivos: false,
    canManageAsignaciones: false,
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
  // Legacy roles kept for backward-compat display; treated conservatively
  user: {
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

export function usePermissions() {
  const { data: user } = useSession();
  
  // If server provides an explicit permissions array (preferred), use it to build the permissions object.
  let permissions: RolePermissions;

  if (Array.isArray(user?.permissions)) {
    const provided: string[] = user.permissions as string[];
    // wildcard
    if (provided.includes('*')) {
      permissions = ROLE_PERMISSIONS.admin;
    } else {
      // build from keys
      const base = { ...ROLE_PERMISSIONS.viewer } as any;
      (Object.keys(base) as Array<keyof RolePermissions>).forEach(k => {
        base[k] = provided.includes(k.toString());
      });
      permissions = base as RolePermissions;
    }
  } else {
    const userRole = (user?.role as UserRole) || 'viewer';
    permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.viewer;
  }

  // determine userRole value for convenience in consumers
  const userRole = (user?.role as UserRole) || (Array.isArray(user?.permissions) && (user.permissions as string[]).includes('*') ? 'admin' : 'viewer');

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return permissions[permission];
  };

  const hasAnyPermission = (permissions: (keyof RolePermissions)[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: (keyof RolePermissions)[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canAccess = (resource: string, action: string): boolean => {
    switch (resource) {
      case 'usuarios':
        return action === 'view' ? hasPermission('canView') : hasPermission('canManageUsers');
      case 'empresas':
        return action === 'view' ? hasPermission('canView') : hasPermission('canManageEmpresas');
      case 'departamentos':
        return action === 'view' ? hasPermission('canView') : hasPermission('canManageDepartamentos');
      case 'computadores':
        return action === 'view' ? hasPermission('canView') : hasPermission('canManageComputadores');
      case 'dispositivos':
        return action === 'view' ? hasPermission('canView') : hasPermission('canManageDispositivos');
      case 'asignaciones':
        return action === 'view' ? hasPermission('canView') : hasPermission('canManageAsignaciones');
      case 'audit-logs':
        return hasPermission('canViewAuditLogs');
      default:
        return false;
    }
  };

  return {
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    isAdmin: userRole === 'admin',
  };
}
