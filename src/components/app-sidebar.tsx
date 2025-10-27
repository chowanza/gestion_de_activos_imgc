"use client";

import React, { useEffect } from 'react';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, 
         SidebarMenuButton, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { ChartPie, Printer, Tag, Laptop, Factory, 
         UsersIcon, Globe, History, LogOut, Building2, MapPin, Monitor, BarChart3, Cpu,
         Key
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
import { useIsSmallScreen } from '@/hooks/use-screen-size';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Define una estructura de datos para la navegación
const navData = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: ChartPie },
    { title: "Empresas", url: "/empresas", icon: Building2 },
    { title: "Departamentos", url: "/departamentos", icon: Globe },
    { title: "Empleados", url: "/empleados", icon: UsersIcon },
    { title: "Ubicaciones", url: "/ubicaciones", icon: MapPin },
    { title: "Catálogo", url: "/catalogo", icon: Tag },
    { title: "Equipos", url: "/equipos", icon: Cpu },
    { title: "Reportes", url: "/reportes", icon: BarChart3 },
  ],
  navAdmin: [
    { title: "Gestión de Cuentas", url: "/gestion-de-cuentas", icon: Key },
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
  const { state, toggleSidebar, setOpen } = useSidebar();
  const isSmallScreen = useIsSmallScreen();

    // Filtrar los items basado en el rol del usuario
  const filteredNavMain = navData.navMain.filter(item => {
    // Si el usuario es admin, mostrar todos los items
    if (isAdmin) return true;
    
    // Si no es admin, excluir ciertos items
    switch(item.title) {
      case 'Modelos':
      case 'Empleados':
        return false;
      default:
        return true;
    }
  });

  const filteredNavAdmin = isAdmin ? navData.navAdmin : [];
  
  
useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  // Colapsar automáticamente el sidebar en pantallas menores a 1920x1080
  // Solo cuando la pantalla cambia de grande a pequeña, no cuando el usuario ya lo colapsó manualmente
  useEffect(() => {
    if (isSmallScreen && state === "expanded") {
      // Solo colapsar si el sidebar está expandido y la pantalla se volvió pequeña
      setOpen(false);
    }
  }, [isSmallScreen]); // Solo depende de isSmallScreen, no de state

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
          <SidebarFooter className="bg-[#000000] px-4 py-6">
            {filteredNavAdmin.length > 0 && (
              <div className="mb-4">
                <div className="h-px bg-gray-700 my-2" />
                <div className="flex flex-col items-stretch">
                  <NavMain items={filteredNavAdmin} />
                </div>
              </div>
            )}
            <div className="flex items-center justify-center">
              <NavUser user={userData} />
            </div>
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
          <SidebarFooter className="bg-[#000000] px-6 py-4 flex flex-col items-stretch">
            {filteredNavAdmin.length > 0 && (
              <div className="mb-4">
                <div className="h-px bg-gray-700 my-2" />
                <NavMain items={filteredNavAdmin} />
              </div>
            )}
            <div className="flex items-center justify-center">
              <NavUser user={userData} />
            </div>
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
