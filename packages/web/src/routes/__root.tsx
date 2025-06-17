import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Home, Info } from "lucide-react";
import {
  createRootRoute,
  Link,
  Outlet,
  useLocation,
  type RegisteredRouter,
  type ValidateLinkOptions,
} from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";

type Route = {
  url: ValidateLinkOptions<RegisteredRouter, unknown>["to"];
  title: string;
  breadCrumb?: string;
  icon: any;
};

const routes: Route[] = [
  { url: "/", title: "Home", breadCrumb: "/", icon: Home },
  { url: "/about", title: "About", icon: Info },
];

const AppSideBar = () => {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenuButton asChild size={"lg"}>
          <Link to="/">
            <img src="/favicon.svg" className="size-10"></img>
            <span>Tech Zone Store</span>
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {routes.map((route) => (
            <SidebarMenuItem key={route.url}>
              <SidebarMenuButton asChild>
                <Link to={route.url}>
                  <route.icon />
                  <span>{route.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

const BreadcrubmsForRoutes = () => {
  const location = useLocation({ select: (state) => state.pathname });
  const segments = location.split("/").slice(1);

  const segmentsRoutes = segments
    .map((_, index) => {
      const url = `/${segments.slice(0, index + 1).join("/")}`;
      return routes.find((route) => route.url === url);
    })
    .filter((r) => !!r);

  // append home route if needed
  if (segmentsRoutes.length > 0 && segmentsRoutes[0] !== routes[0]) {
    segmentsRoutes.unshift(routes[0]);
  }

  const activeSegment = segmentsRoutes[segmentsRoutes.length - 1];
  const otherSegments = segmentsRoutes.slice(0, -1);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {otherSegments.map((route) => (
          <Fragment key={route.url}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={route.url}>{route.breadCrumb ? route.breadCrumb : route.title}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}

        <BreadcrumbItem>
          <BreadcrumbPage>
            {activeSegment.breadCrumb ? activeSegment.breadCrumb : activeSegment.title}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export const Route = createRootRoute({
  component: () => {
    const cookies = document.cookie.split("; ");
    const sidebarState = cookies.find((c) => c.startsWith("sidebar_state="))?.split("=")[1];
    const defaultOpen = sidebarState === "true";

    return (
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSideBar />
        <main className="p-2">
          <div className="h-8 flex gap-2 items-center ">
            <SidebarTrigger />
            <BreadcrubmsForRoutes />
          </div>
          <Outlet />
        </main>
      </SidebarProvider>
    );
  },
});
