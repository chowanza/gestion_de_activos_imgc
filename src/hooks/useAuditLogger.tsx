// src/hooks/useAuditLogger.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from './useSession';

export function useAuditLogger() {
  const pathname = usePathname();
  const { data: user } = useSession();

  useEffect(() => {
    if (!user) {
      return;
    }

    // Solo registrar si no es la página de login
    if (pathname === '/') {
      return;
    }

    const logRouteVisit = async () => {
      try {
        // Mapear rutas a nombres más descriptivos
        const routeNames: Record<string, string> = {
          '/dashboard': 'Dashboard',
          '/usuarios': 'Gestión de Usuarios',
          '/empresas': 'Gestión de Empresas',
          '/departamentos': 'Gestión de Departamentos',
          '/computadores': 'Gestión de Computadores',
          '/dispositivos': 'Gestión de Dispositivos',
          '/asignaciones': 'Gestión de Asignaciones',
          '/modelos': 'Gestión de Modelos',
          '/lineas': 'Gestión de Líneas',
          '/historial': 'Historial del Sistema',
        };

        const routeName = routeNames[pathname] || pathname;
        
        const payload = {
          accion: 'navegacion',
          entidad: 'sistema',
          entidadId: pathname,
          descripcion: `Usuario navegó a: ${routeName}`,
          detalles: {
            ruta: pathname,
            pagina: routeName,
            timestamp: new Date().toISOString(),
            tipo: 'navegacion'
          },
          usuarioId: user.id,
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent,
        };
        
        const response = await fetch('/api/historial-movimientos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error('Error logging route visit:', await response.text());
        }
      } catch (error) {
        console.error('Error logging route visit:', error);
      }
    };

    logRouteVisit();
  }, [pathname, user]);
}
