// hooks/useIsAdmin.ts
'use client';

import { useSession } from './useSession';

export const useIsAdmin = () => {
  const { data: session } = useSession();
  const role = (session?.role || '').toString().toLowerCase();

  // Accept common admin-like role values (case-insensitive)
  if (role === 'admin' || role === 'superadmin' || role === 'adminuser') return true;

  // Also accept a wildcard permissions flag on the session (set by the dev override)
  if (Array.isArray((session as any)?.permissions) && (session as any).permissions.includes('*')) return true;

  return false;
};