"use client";

import { MailIcon, PlusCircleIcon, type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    router.push(url);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  className={cn(
                    // Clases base para todos los botones
                    "transition-colors duration-150 rounded-3xl py-5",
                    // Clases para el estado ACTIVO - fondo blanco con texto naranja
                    isActive && "bg-white text-[#EA7704]",
                    // Clases para el estado HOVER (cuando NO está activo) - texto blanco
                    !isActive && "text-white hover:bg-white/10"
                  )}
                  tooltip={item.title}
                  onClick={(e) => {
                    handleClick(e, item.url);
                  }}
                  asChild
                >
                  <Link href={item.url} className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}