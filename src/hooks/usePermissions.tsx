// src/hooks/usePermissions.tsx
'use client';

import { useSession } from './useSession';

export type UserRole = 'admin' | 'user';

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
};

export function usePermissions() {
  const { data: user } = useSession();
  
  const userRole = (user?.role as UserRole) || 'viewer';
  const permissions = ROLE_PERMISSIONS[userRole];

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
    isUser: userRole === 'user',
  };
}
