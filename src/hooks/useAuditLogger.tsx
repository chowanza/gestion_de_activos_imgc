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
        // Mapear rutas a nombres más descriptivos (basado en rutas reales del sistema)
        const routeNames: Record<string, string> = {
          '/dashboard': 'Dashboard',
          '/empresas': 'Gestión de Empresas',
          '/departamentos': 'Gestión de Departamentos',
          '/empleados': 'Gestión de Empleados',
          '/ubicaciones': 'Gestión de Ubicaciones',
          '/catalogo': 'Catálogo de Equipos',
          '/equipos': 'Gestión de Equipos',
          '/reportes': 'Reportes del Sistema',
          '/historial': 'Historial del Sistema',
          '/usuarios': 'Gestión de Usuarios',
          '/computadores': 'Gestión de Computadores',
          '/dispositivos': 'Gestión de Dispositivos',
          '/modelos': 'Gestión de Modelos',
          '/asignaciones': 'Gestión de Asignaciones',
        };

        const routeName = routeNames[pathname] || pathname;
        
        // Usar el nuevo sistema de logging
        const response = await fetch('/api/historial-movimientos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accion: 'NAVEGACION',
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
          }),
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
