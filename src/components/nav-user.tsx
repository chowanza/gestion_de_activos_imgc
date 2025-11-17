import { LogOut } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";

interface NavUserProps {
  user: {
    username: string;
    role: string;
    avatar: string;
  };
}

export function NavUser({ user }: NavUserProps) {
  const { state } = useSidebar();
  
  const handleLogout = async () => {
    // Haz el logout con navegación directa para garantizar que
    // el Set-Cookie de borrado se procese antes de cargar la home.
    window.location.href = '/api/auth/logout';
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center justify-between w-full">
        {state === "expanded" ? (
          <>
            <div className="flex items-center gap-2 flex-1">
              <Avatar className="h-8 w-8 rounded-3xl">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="rounded-lg">
                  {user.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-white">{user.username}</span>
                <span className="truncate text-xs text-white/70">
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 rounded hover:bg-white/10 text-white"
              aria-label="Logout"
            >
              <LogOut className="size-5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            <Avatar className="h-8 w-8 rounded-3xl">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback className="rounded-lg">
                {user.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleLogout}
              className="p-2 rounded hover:bg-white/10 text-white"
              aria-label="Logout"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
