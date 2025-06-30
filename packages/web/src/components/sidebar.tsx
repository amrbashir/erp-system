import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { ChevronDownIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shadcn/components/ui/collapsible";
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
  SidebarSeparator,
  useSidebar,
} from "@/shadcn/components/ui/sidebar";

import type { FileRoutesById } from "@/routeTree.gen";
import { UserDropdown } from "@/components/user-dropdown";
import { useAuth } from "@/providers/auth-provider";
import { useOrg } from "@/providers/org-provider";

export function AppSideBar() {
  const { t } = useTranslation();
  const { open } = useSidebar();
  const { i18n } = useTranslation();
  const { slug: orgSlug } = useOrg();
  const { user } = useAuth();

  const topRoutes: (keyof FileRoutesById)[] = ["/org/$orgSlug/"];

  const userRoutes: (keyof FileRoutesById)[] = [
    "/org/$orgSlug/products",
    "/org/$orgSlug/customers",
  ];

  const adminRoutes: (keyof FileRoutesById)[] =
    user?.role === "ADMIN" ? ["/org/$orgSlug/transactions", "/org/$orgSlug/users"] : [];

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
        <RoutesGroup routes={topRoutes} />
        <SidebarSeparator className="w-[calc(100%_-_var(--spacing)_*_4)]!" />
        <RoutesGroup routes={userRoutes} />
        <RoutesGroup label={t("adminSection")} routes={adminRoutes} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="w-[calc(100%_-_var(--spacing)_*_2)]!" />
        <UserDropdown />
      </SidebarFooter>
    </Sidebar>
  );
}

function RoutesGroup({
  routes,
  label,
  ...props
}: React.ComponentProps<"div"> & {
  label?: string;
  routes: (keyof FileRoutesById)[];
}) {
  if (routes.length === 0) return null;

  const { flatRoutes } = useRouter();
  const currentLocation = useLocation({ select: (state) => state.pathname });
  const { slug: orgSlug } = useOrg();

  const routesData = routes.map((r) => {
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
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup {...props}>
        {label && (
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mb-1">
              {label}
              <ChevronDownIcon className="ms-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
        )}
        <CollapsibleContent>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {routesData.map(({ url, title, icon: RouteIcon, isActive }) => (
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
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
