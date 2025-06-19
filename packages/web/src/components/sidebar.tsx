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

type Route = {
  url: keyof FileRoutesByTo;
  title: string;
  icon: React.ComponentType;
};

export function AppSideBar() {
  const { flatRoutes } = useRouter();
  const location = useLocation({ select: (state) => state.pathname });
  const { open } = useSidebar();

  const routes: Route[] = [
    {
      url: "/",
      title: flatRoutes.find((route) => route.to === "/")?.options.loader().title,
      icon: flatRoutes.find((route) => route.to === "/")?.options.loader().icon,
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-0!">
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
              {routes.map((route) => (
                <SidebarMenuItem key={route.url}>
                  <SidebarMenuButton asChild isActive={route.url === location}>
                    <Link to={route.url}>
                      <route.icon />
                      <span>{route.title}</span>
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
