import { useLocation, useRouter } from "@tanstack/react-router";
import { EllipsisVerticalIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/shadcn/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shadcn/components/ui/sidebar";

import { useAuth } from "@/auth/provider";
import { LanguageSelector } from "@/components/language-selector";
import { useOrg } from "@/components/org-provider";
import { ThemeSelector } from "@/components/theme-selector";

export function UserDropdown() {
  const { t } = useTranslation();
  const router = useRouter();
  const location = useLocation();
  const { slug: orgSlug } = useOrg();

  const { isMobile } = useSidebar();

  const { user, logout: authLogout } = useAuth();

  async function logout() {
    authLogout(orgSlug);
    router.navigate({
      to: "/login",
      search: {
        orgSlug,
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
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
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
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    {user?.username.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.username}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <LanguageSelector asSubmenu={true} />
            <ThemeSelector asSubmenu={true} />

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={logout}>{t("logout")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
