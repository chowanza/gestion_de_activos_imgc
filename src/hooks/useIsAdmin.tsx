// hooks/useIsAdmin.ts
'use client';

import { useSession } from './useSession';

export const useIsAdmin = () => {
  const { data: session } = useSession();
  return session?.role === 'admin';
};