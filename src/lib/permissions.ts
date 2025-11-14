// src/lib/permissions.ts
export type UserRole = 'admin' | 'user' | 'viewer' | 'assigner' | 'editor';

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
  editor: {
    // Editors can manage equipment, models and locations but not users or audit logs
    canView: true,
    canCreate: true,
    canUpdate: true,
    canDelete: false,
    // Editor NO debe poder gestionar asignaciones ni estado de equipos
    canAssign: false,
    canManageUsers: false,
    canManageEmpresas: true,
    canManageDepartamentos: true,
    canManageComputadores: false,
    canManageDispositivos: false,
    canManageAsignaciones: false,
    canViewAuditLogs: false,
  },
};

export function getRolePermissions(role: string | undefined): RolePermissions {
  if (!role) return ROLE_PERMISSIONS.viewer;
  const normalized = role.toString().toLowerCase() as UserRole;
  return ROLE_PERMISSIONS[normalized] || ROLE_PERMISSIONS.viewer;
}

export function permissionsArrayFromRole(role: string | undefined): string[] {
  const perms = getRolePermissions(role);
  return (Object.keys(perms) as Array<keyof RolePermissions>).filter(k => (perms as any)[k]);
}
