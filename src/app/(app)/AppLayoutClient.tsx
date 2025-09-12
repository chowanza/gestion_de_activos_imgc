// app/(app)/AppLayoutClient.tsx (Client Component)
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import type { UserJwtPayload } from "@/lib/auth"; // Adjust the import path as needed
import { useAuditLogger } from "@/hooks/useAuditLogger";

type AppLayoutClientProps = {
  children: ReactNode;
  user: UserJwtPayload;
};

const queryClient = new QueryClient();

export default function AppLayoutClient({ children, user }: AppLayoutClientProps) {
  // Registrar visitas a rutas automáticamente
  useAuditLogger();

  return (
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>
        <div className="w-full flex h-screen antialiased text-foreground bg-gradient-to-br from-[#FEF6EE] to-[#F0E6D8]">
          <AppSidebar className="flex-shrink-0 hidden md:block" user={user} />
          <div className="flex-1 flex flex-col bg-gradient-to-br from-[#FEF6EE] to-[#F0E6D8]">
            <main className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-[#FEF6EE] to-[#F0E6D8] text-gray-800">{children}</main>
          </div>
        </div>
      </QueryClientProvider>
    </SidebarProvider>
  );
}
