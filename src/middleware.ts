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
];

// Rutas que SOLO el admin puede ver
const adminOnlyRoutes = [
  '/usuarios',
  '/modelos',
  '/departamentos',
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