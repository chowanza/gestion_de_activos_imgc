// hooks/useSession.ts
'use client';

import { useEffect, useState } from 'react';

export const useSession = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        setSession(data.user || null);
      } catch (error) {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  return { data: session, status: loading ? 'loading' : 'authenticated' };
};