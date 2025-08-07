import { SidebarUserMenu } from "@/components/sidebar-user-menu.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { Link, useMatches, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Label } from "@/shadcn/components/ui/label.tsx";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from "@/shadcn/components/ui/sidebar.tsx";
import { cn } from "@/shadcn/lib/utils.ts";

import type { FileRoutesById } from "@/routeTree.gen.ts";

type Route = keyof FileRoutesById;

interface RouteWithSubRoutes {
  route: Route;
  subRoutes: (Route | RouteWithSubRoutes)[];
}

interface RouteGroup {
  label?: string;
  routes: (Route | RouteWithSubRoutes)[];
}

interface RouteInfo {
  url: string;
  isActive: boolean;
  hasActiveSubroute: boolean;
  title: string;
  icon?: React.ComponentType;
  subroutes: RouteInfo[];
}

export function AppSideBar() {
  const { t, i18n } = useTranslation();
  const { open } = useSidebar();
  const user = useAuthUser();

  const routeGroups: (RouteGroup | undefined)[] = [
    { routes: ["/orgs/$orgSlug/"] },
    {
      routes: [
        {
          route: "/orgs/$orgSlug/invoices/",
          subRoutes: [
            "/orgs/$orgSlug/invoices/createSale",
            "/orgs/$orgSlug/invoices/createPurchase",
            "/orgs/$orgSlug/invoices/sales",
            "/orgs/$orgSlug/invoices/purchases",
          ],
        },
        "/orgs/$orgSlug/expenses/",
        "/orgs/$orgSlug/products/",
        "/orgs/$orgSlug/customers/",
      ],
    },
    user.role === "ADMIN"
      ? {
          label: t("adminSection"),
          routes: [
            "/orgs/$orgSlug/overview",
            "/orgs/$orgSlug/transactions/",
            "/orgs/$orgSlug/users/",
          ],
        }
      : undefined,
  ];

  return (
    <Sidebar variant="inset" collapsible="icon" side={i18n.dir() === "rtl" ? "right" : "left"}>
      <SidebarHeader>
        <Label className="my-2">
          <img src="/favicon.svg" className="size-8"></img>
          <span className="md:hidden text-lg font-semibold">{user.orgName}</span>
          {/* TODO: fix this text jumping */}
          {open && (
            <span className="hidden md:inline-block text-lg font-semibold">{user.orgName}</span>
          )}
        </Label>
      </SidebarHeader>

      <SidebarContent>
        {routeGroups.map((group, index) => (
          <RoutesGroup key={index} group={group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}

function RoutesGroup({
  group,
  ...props
}: React.ComponentProps<typeof SidebarGroup> & {
  group?: RouteGroup;
}) {
  if (!group || group.routes.length === 0) return null;

  const { flatRoutes } = useRouter();
  const matches = useMatches();
  const sidebar = useSidebar();

  const mapRoute = (r: Route | RouteWithSubRoutes): RouteInfo => {
    const to = typeof r === "string" ? r : r.route;
    const route = flatRoutes.find((route) => route.to === to);
    const data = route?.options.context();
    const subroutes = typeof r === "string" ? [] : r.subRoutes.map(mapRoute);
    const isActive = matches[matches.length - 1].routeId === route?.id;
    const hasActiveSubroute = subroutes.some((sub) => sub.isActive);

    return {
      url: route?.to,
      isActive,
      hasActiveSubroute,
      title: data.title,
      icon: data.icon,
      subroutes,
    };
  };

  const routesData = group.routes.map(mapRoute);

  return (
    <SidebarGroup {...props}>
      {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}

      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {routesData.map(
            ({ url, title, icon: RouteIcon, isActive, subroutes, hasActiveSubroute }) => (
              <SidebarMenuItem key={url}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link
                    className={cn(
                      "data-[active=true]:bg-primary! data-[active=true]:text-primary-foreground!",
                      hasActiveSubroute && "bg-sidebar-accent",
                    )}
                    to={url}
                    onClick={() => sidebar.setOpenMobile(false)}
                  >
                    {RouteIcon && <RouteIcon />}
                    <span>{title}</span>
                  </Link>
                </SidebarMenuButton>

                {subroutes.length > 0 && (
                  <SidebarMenuSub>
                    {subroutes.map(({ url: subUrl, title: subTitle, isActive: subIsActive }) => (
                      <SidebarMenuItem key={subUrl}>
                        <SidebarMenuButton asChild isActive={subIsActive}>
                          <Link
                            className="data-[active=true]:bg-primary! data-[active=true]:text-primary-foreground!"
                            to={subUrl}
                            onClick={() => sidebar.setOpenMobile(false)}
                          >
                            <span>{subTitle}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
