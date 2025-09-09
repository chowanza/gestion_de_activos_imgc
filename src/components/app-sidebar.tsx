"use client";

import React, { useEffect } from 'react';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, 
         SidebarMenuButton, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { ChartPie, Printer, Tag, Laptop, Factory, 
         UsersIcon, ClipboardListIcon, Phone, Globe, History, LogOut, Building2
} from 'lucide-react';
import Link from 'next/link';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from './nav-user';
import type { UserJwtPayload } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Spinner } from './ui/spinner';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useSidebar } from '@/components/ui/sidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Define una estructura de datos para la navegación
const navData = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: ChartPie },
    { title: "Empresas", url: "/empresas", icon: Building2 },
    { title: "Modelos", url: "/modelos", icon: Tag },
    { title: "Dispositivos", url: "/dispositivos", icon: Printer },
    { title: "Computadoras", url: "/computadores", icon: Laptop },
    { title: "Líneas telefónicas", url: "/lineas", icon: Phone },
    { title: "Departamentos", url: "/departamentos", icon: Globe },
    { title: "Empleados", url: "/empleados", icon: UsersIcon },
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
  const { state, toggleSidebar } = useSidebar();

    // Filtrar los items basado en el rol del usuario
  const filteredNavMain = navData.navMain.filter(item => {
    // Si el usuario es admin, mostrar todos los items
    if (isAdmin) return true;
    
    // Si no es admin, excluir ciertos items
    switch(item.title) {
      case 'Modelos':
      case 'Empleados':
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
      collapsible="icon" 
      className="bg-[#000000] border-r border-gray-800"
      {...props}
    >
      {state === "expanded" ? (
        <>
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
        </>
      ) : (
        <>
          <SidebarHeader className="bg-[#000000] pt-10">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5 group-data-[collapsible=icon]:!size-auto group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!h-auto">
                  <Link href="/dashboard" className="flex items-center justify-center w-full">
                    <img src="/img/logo.png" alt="Logo" className="w-14 h-4" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent className="bg-[#000000] px-6 py-10">
            <NavMain items={filteredNavMain}/>
          </SidebarContent>
          <SidebarFooter className="bg-[#000000] px-2 py-4">
            <NavUser user={userData} />
          </SidebarFooter>
        </>
      )}
      
      {/* Botón de toggle del sidebar */}
      <div className="absolute -right-3 top-10 z-30">
        <button
          onClick={toggleSidebar}
          className="w-7 h-7 rounded-full bg-white border border-gray-300 shadow-lg hover:bg-gray-50 flex items-center justify-center p-0 transition-all duration-200 hover:scale-105"
          aria-label="Toggle Sidebar"
        >
          {state === "expanded" ? (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>
    </Sidebar>
  );
}
