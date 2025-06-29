import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Label } from "@/shadcn/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shadcn/components/ui/sidebar";

import type { FileRoutesById } from "@/routeTree.gen";
import { UserDropdown } from "@/components/user-dropdown";
import { useAuth } from "@/providers/auth-provider";
import { useOrg } from "@/providers/org-provider";

export function AppSideBar() {
  const { open } = useSidebar();
  const { i18n } = useTranslation();
  const { flatRoutes } = useRouter();
  const currentLocation = useLocation({ select: (state) => state.pathname });
  const { slug: orgSlug } = useOrg();
  const { user } = useAuth();

  const sidebarRoutes: (keyof FileRoutesById | undefined)[] = [
    "/org/$orgSlug/",
    "/org/$orgSlug/customers",
    user?.role === "ADMIN" ? "/org/$orgSlug/users" : undefined,
  ];

  const sidebarRoutesData = sidebarRoutes.filter(Boolean).map((r) => {
    const route = flatRoutes.find((route) => route.to === r);
    const data = route?.options.context();
    const location = route?.to.replace("$orgSlug", orgSlug);
    const trimmedLocation = location.endsWith("/") ? location.slice(0, -1) : location;
    const isActive = trimmedLocation === currentLocation;

    return {
      url: route?.to,
      isActive,
      title: data.title,
      icon: data.icon,
    };
  });

  return (
    <Sidebar
      collapsible="icon"
      className="border-0!"
      side={i18n.dir() === "rtl" ? "right" : "left"}
    >
      <SidebarHeader>
        <Label className="my-2">
          <img src="/favicon.svg" className="size-8"></img>
          <span className="md:hidden text-lg font-semibold">{orgSlug}</span>
          {open && <span className="hidden md:inline-block text-lg font-semibold">{orgSlug}</span>}
        </Label>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {sidebarRoutesData.map(({ url, title, icon: RouteIcon, isActive }) => (
                <SidebarMenuItem key={url}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link to={url}>
                      {RouteIcon && <RouteIcon />}
                      <span>{title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserDropdown />
      </SidebarFooter>
    </Sidebar>
  );
}
