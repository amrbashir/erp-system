import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
  SidebarFooter,
} from "@/shadcn/components/ui/sidebar";
import type { FileRoutesByTo } from "@/routeTree.gen";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { UserDropdown } from "@/components/user-dropdown";
import { Label } from "@/shadcn/components/ui/label";
import { useTranslation } from "react-i18next";

type RouteData = {
  url: keyof FileRoutesByTo;
  isActive: boolean;
  title: string;
  icon?: React.ComponentType;
};

export function AppSideBar() {
  const { open } = useSidebar();
  const { i18n } = useTranslation();

  const { flatRoutes } = useRouter();
  const location = useLocation({ select: (state) => state.pathname });

  const sidebarRoutes: (keyof FileRoutesByTo)[] = ["/"];
  const sidebarRoutesData: RouteData[] = sidebarRoutes.map((r) => {
    const route = flatRoutes.find((route) => route.to === r);
    return {
      url: route?.to,
      isActive: route?.to === location,
      title: route?.options.loader().title,
      icon: route?.options.loader().icon,
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
          <img src="/favicon.svg" className={open ? "size-10" : "size-8"}></img>
          {open && <span className="text-lg font-semibold">Tech Zone</span>}
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
