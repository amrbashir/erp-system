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
import {
  Link,
  useLocation,
  useRouter,
  type RegisteredRouter,
  type ValidateLinkOptions,
} from "@tanstack/react-router";

type Route = {
  url: ValidateLinkOptions<RegisteredRouter, unknown>["to"];
  title: string;
  icon: React.ComponentType;
};

export function AppSideBar() {
  const { flatRoutes } = useRouter();
  const location = useLocation({ select: (state) => state.pathname });

  const routes: Route[] = [
    {
      url: "/",
      title: flatRoutes.find((route) => route.fullPath === "/")?.options.context().title,
      icon: flatRoutes.find((route) => route.fullPath === "/")?.options.context().icon,
    },
    {
      url: "/about",
      title: flatRoutes.find((route) => route.fullPath === "/about")?.options.context().title,
      icon: flatRoutes.find((route) => route.fullPath === "/about")?.options.context().icon,
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
