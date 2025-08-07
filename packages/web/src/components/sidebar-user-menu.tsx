import { useLocation, useNavigate } from "@tanstack/react-router";
import { EllipsisVerticalIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/shadcn/components/ui/avatar.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu.tsx";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shadcn/components/ui/sidebar.tsx";

import { LanguageSelector } from "@/components/language-selector.tsx";
import { ThemeSelector } from "@/components/theme-selector.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { useAuth } from "@/providers/auth.tsx";

export function SidebarUserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { orgSlug } = useAuthUser();

  const { isMobile } = useSidebar();

  const { user, logout: authLogout } = useAuth();

  async function logout() {
    await authLogout();
    navigate({
      to: "/",
      search: {
        loginOrgSlug: orgSlug,
        redirect: "redirect" in location.search ? location.search.redirect : location.href,
      },
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarFallback className="rounded-full bg-primary text-primary-foreground">
                  {user?.username.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.username}</span>
              </div>
              <EllipsisVerticalIcon />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarFallback className="rounded-full bg-primary text-primary-foreground">
                    {user?.username.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.username}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <LanguageSelector asSubmenu />
            <ThemeSelector asSubmenu />

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => logout()}>
              {t("common.actions.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
