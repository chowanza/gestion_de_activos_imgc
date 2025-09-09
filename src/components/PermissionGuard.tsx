// src/components/PermissionGuard.tsx
'use client';

import { ReactNode } from 'react';
import { usePermissions, RolePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: keyof RolePermissions;
  permissions?: (keyof RolePermissions)[];
  requireAll?: boolean;
  resource?: string;
  action?: string;
  fallback?: ReactNode;
  showError?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  resource,
  action,
  fallback = null,
  showError = false,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccess } = usePermissions();

  let hasAccess = false;

  // Verificar por permiso específico
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  // Verificar por múltiples permisos
  else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }
  // Verificar por recurso y acción
  else if (resource && action) {
    hasAccess = canAccess(resource, action);
  }
  // Si no se especifica nada, permitir acceso
  else {
    hasAccess = true;
  }

  if (!hasAccess) {
    if (showError) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Acceso Denegado
            </h3>
            <p className="text-gray-600">
              No tienes permisos para acceder a esta sección.
            </p>
          </div>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Componente de conveniencia para botones
interface PermissionButtonProps {
  children: ReactNode;
  permission?: keyof RolePermissions;
  permissions?: (keyof RolePermissions)[];
  requireAll?: boolean;
  resource?: string;
  action?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export function PermissionButton({
  children,
  permission,
  permissions,
  requireAll = false,
  resource,
  action,
  disabled = false,
  className = '',
  onClick,
}: PermissionButtonProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccess } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else if (resource && action) {
    hasAccess = canAccess(resource, action);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return null; // No renderizar el botón si no tiene permisos
  }

  return (
    <button
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}


