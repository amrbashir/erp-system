import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Label } from "@/shadcn/components/ui/label";
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
} from "@/shadcn/components/ui/sidebar";
import { cn } from "@/shadcn/lib/utils";

import type { FileRoutesById } from "@/routeTree.gen";
import { UserDropdown } from "@/components/user-dropdown";
import { useOrg } from "@/hooks/use-org";
import { useAuth } from "@/providers/auth";

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
  const { name: orgName } = useOrg();
  const { user } = useAuth();

  const routeGroups: (RouteGroup | undefined)[] = [
    { routes: ["/org/$orgSlug"] },
    {
      routes: [
        {
          route: "/org/$orgSlug/invoices",
          subRoutes: [
            "/org/$orgSlug/invoices/createSale",
            "/org/$orgSlug/invoices/createPurchase",
            "/org/$orgSlug/invoices/sales",
            "/org/$orgSlug/invoices/purchases",
          ],
        },
        "/org/$orgSlug/expenses",
        "/org/$orgSlug/products",
        "/org/$orgSlug/customers",
      ],
    },
    user?.role === "ADMIN"
      ? {
          label: t("adminSection"),
          routes: ["/org/$orgSlug/transactions", "/org/$orgSlug/users"],
        }
      : undefined,
  ];

  return (
    <Sidebar variant="inset" collapsible="icon" side={i18n.dir() === "rtl" ? "right" : "left"}>
      <SidebarHeader>
        <Label className="my-2">
          <img src="/favicon.svg" className="size-8"></img>
          <span className="md:hidden text-lg font-semibold">{orgName}</span>
          {/* TODO: fix this text jumping */}
          {open && <span className="hidden md:inline-block text-lg font-semibold">{orgName}</span>}
        </Label>
      </SidebarHeader>

      <SidebarContent>
        {routeGroups.map((group, index) => (
          <RoutesGroup key={index} group={group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <UserDropdown />
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

  const { slug: orgSlug } = useOrg();
  const { flatRoutes } = useRouter();
  const pathname = useLocation({ select: (s) => s.pathname });

  const mapRoute = (r: Route | RouteWithSubRoutes): RouteInfo => {
    const to = typeof r === "string" ? r : r.route;
    const route = flatRoutes.find((route) => route.to === to);
    const data = route?.options.context();
    const subroutes = typeof r === "string" ? [] : r.subRoutes.map(mapRoute);
    const isActive = pathname === route?.fullPath.replace("$orgSlug", orgSlug);
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
                      hasActiveSubroute && "bg-secondary",
                    )}
                    to={url}
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
