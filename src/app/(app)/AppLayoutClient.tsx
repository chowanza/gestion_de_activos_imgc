// app/(app)/AppLayoutClient.tsx (Client Component)
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import type { UserJwtPayload } from "@/lib/auth"; // Adjust the import path as needed

type AppLayoutClientProps = {
  children: ReactNode;
  user: UserJwtPayload;
};

const queryClient = new QueryClient();

export default function AppLayoutClient({ children, user }: AppLayoutClientProps) {
  return (
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>
        <div className="w-full flex h-screen antialiased text-foreground">
          <AppSidebar className="flex-shrink-0 hidden md:block" user={user} />
          <div className="flex-1 flex flex-col">
            <SiteHeader />
            <main className="flex-1 p-4 overflow-y-auto">{children}</main>
          </div>
        </div>
      </QueryClientProvider>
    </SidebarProvider>
  );
}
