
import { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth-server";
export const dynamic = 'force-dynamic';
import AppLayoutClient from "./AppLayoutClient";
import { redirect } from "next/navigation";



type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login'); // O la ruta que prefieras
  }
  
  return <AppLayoutClient user={user}>
      {children}

    </AppLayoutClient>;
}