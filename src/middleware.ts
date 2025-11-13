import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth'; // Asegúrate que esta ruta sea correcta

// Ruta de login
const publicRoute = '/'; 

// Rutas que requieren estar logueado (sea user o admin)
const protectedRoutes = [
  '/dashboard',
  '/asignaciones',
  '/computadores',
  '/departamentos',
  '/dispositivos',
  '/modelos',
  '/usuarios',
  '/lineas',
  '/historial',
  '/empresas',
];

// Rutas que SOLO el admin puede ver
const adminOnlyRoutes = [
  '/usuarios',
  '/modelos',
  '/user', // Quizás quieras renombrar a /users/ o /gestion-usuarios
];

// Patrones de rutas que son públicas y no requieren login (Ej: vistas de detalle)
// cualquiera puede ver los detalles de un equipo, pero no editarlo
const publicPatterns = [
    /^\/computadores\/[a-zA-Z0-9-]+\/details$/, // Coincide con /computadores/uuid-123/details
    /^\/dispositivos\/[a-zA-Z0-9-]+\/details$/, // Coincide con /dispositivos/uuid-456/details
];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // Canonical host redirect: ensure single hostname for cookies/sessions
  try {
    const hostHeader = req.headers.get('host') || '';
    const currentHost = hostHeader.split(':')[0];
    const canonicalBase = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || '';
    const altHosts = (process.env.ALT_HOSTS || '').split(',').map(h => h.trim()).filter(Boolean);
    if (canonicalBase && currentHost) {
      const canonicalUrl = new URL(canonicalBase);
      const canonicalHost = canonicalUrl.hostname;
      const canonicalPort = canonicalUrl.port || (canonicalUrl.protocol === 'https:' ? '443' : '80');
      const isAlt = altHosts.includes(currentHost);
      if (isAlt && currentHost !== canonicalHost) {
        const redirectUrl = new URL(req.nextUrl);
        redirectUrl.hostname = canonicalHost;
        redirectUrl.port = canonicalPort;
        redirectUrl.protocol = canonicalUrl.protocol;
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (e) {
    // Non-blocking: if redirect logic fails, continue normal flow
  }
  const cookie = req.cookies.get('session');
  const session = cookie?.value ? await decrypt(cookie.value) : null;

  // 1. ¿La ruta coincide con un patrón público? Si es así, permitir siempre.
  const isPublicPatternRoute = publicPatterns.some(pattern => pattern.test(path));
  if (isPublicPatternRoute) {
    return NextResponse.next();
  }

  // 2. Determinar el tipo de ruta
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAdminRoute = adminOnlyRoutes.some(route => path.startsWith(route));

  // 3. Lógica de Redirección
  // Si intenta acceder a una ruta protegida SIN sesión -> A login
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL(publicRoute, req.nextUrl));
  }
  
  // Si tiene sesión y trata de ir al login -> Al dashboard
  if (path === publicRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  // Si es una ruta de admin y el usuario NO es admin -> Al dashboard
  if (isAdminRoute && session?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};