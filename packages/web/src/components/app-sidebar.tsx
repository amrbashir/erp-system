import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import type { FileRoutesByTo } from "@/routeTree.gen";
import { Link, useLocation, useRouter } from "@tanstack/react-router";

type Route = {
  url: keyof FileRoutesByTo;
  title: string;
  icon: React.ComponentType;
};

export function AppSideBar() {
  const { flatRoutes } = useRouter();
  const location = useLocation({ select: (state) => state.pathname });

  const routes: Route[] = [
    {
      url: "/",
      title: flatRoutes.find((route) => route.to === "/")?.options.loader().title,
      icon: flatRoutes.find((route) => route.to === "/")?.options.loader().icon,
    },
    {
      url: "/about",
      title: flatRoutes.find((route) => route.to === "/about")?.options.loader().title,
      icon: flatRoutes.find((route) => route.to === "/about")?.options.loader().icon,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size={"lg"}>
                <Link to="/">
                  <img src="/favicon.svg" className="size-10"></img>
                  <span>Tech Zone Store</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
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
    </Sidebar>
  );
}
