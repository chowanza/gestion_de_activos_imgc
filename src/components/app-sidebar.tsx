"use client";

import React, { useEffect } from 'react';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, 
         SidebarMenuButton, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { LayoutDashboardIcon, Printer, Tag, Laptop, Factory, 
         UsersIcon, ClipboardListIcon, Phone, Globe, History, LogOut
} from 'lucide-react';
import Link from 'next/link';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from './nav-user';
import type { UserJwtPayload } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Spinner } from './ui/spinner';
import { useIsAdmin } from '@/hooks/useIsAdmin';

// Define una estructura de datos para la navegación
const navData = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
    { title: "Modelos", url: "/modelos", icon: Tag },
    { title: "Dispositivos", url: "/dispositivos", icon: Printer },
    { title: "Computadoras", url: "/computadores", icon: Laptop },
    { title: "Líneas telefónicas", url: "/lineas", icon: Phone },
    { title: "Departamentos", url: "/departamentos", icon: Globe },
    { title: "Usuarios", url: "/usuarios", icon: UsersIcon },
    { title: "Asignaciones", url: "/asignaciones", icon: ClipboardListIcon },
    { title: "Historial", url: "/historial", icon: History },
  ],
};

// Define las props que el componente aceptará
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: UserJwtPayload | null;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const router = useRouter();
  const isAdmin = useIsAdmin();

    // Filtrar los items basado en el rol del usuario
  const filteredNavMain = navData.navMain.filter(item => {
    // Si el usuario es admin, mostrar todos los items
    if (isAdmin) return true;
    
    // Si no es admin, excluir ciertos items
    switch(item.title) {
      case 'Modelos':
      case 'Usuarios':
      case 'Departamentos':
        return false;
      default:
        return true;
    }
  });
  
  
useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="fixed left-0 top-0 h-screen w-64 bg-gray-100 border-r">
        <Spinner />
      </div>
    );
  }

  const userData = {
    username: user.username || "Invitado",
    role: user.role || "user",
    avatar: user.avatar || "",
  };
  
  return (
    <Sidebar 
      collapsible="offcanvas" 
      className="bg-[#000000] border-r border-gray-800"
      {...props}
    >
      <SidebarHeader className="bg-[#000000] px-4 py-11">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard" className="flex items-center gap-2">
                    {/* Logo iMGC personalizado */}
                <div className="flex items-center px-2">
                  <img src="/img/logo.png" alt="Logo" className="w-30 h-8" />
              </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-[#000000] px-4 py-2">
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter className="bg-[#000000] px-8 py-10">
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
