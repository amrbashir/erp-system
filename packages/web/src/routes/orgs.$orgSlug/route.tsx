import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";
import { SidebarInset } from "@/shadcn/components/ui/sidebar";

import { apiClient } from "@/api-client";
import { NotFound404 } from "@/components/404";
import { OrgHeader } from "@/components/org-header";
import { AppSideBar } from "@/components/sidebar";
import i18n from "@/i18n";
import { AppSidebarProvider } from "@/providers/sidebar";

interface RouteSearch {
  redirect?: string;
}

export const Route = createFileRoute("/orgs/$orgSlug")({
  component: RouteComponent,
  notFoundComponent: () => <NotFound404 to="/orgs/$orgSlug" />,
  context: () => ({
    title: i18n.t("routes.home"),
    icon: HomeIcon,
  }),
  validateSearch: ({ search }) => search as RouteSearch,
  beforeLoad: async ({ context, location, search, params }) => {
    // redirect to home if not authenticated
    if (
      !context.auth.isAuthenticated &&
      "orgSlug" in params &&
      typeof params.orgSlug === "string"
    ) {
      throw redirect({
        to: "/",
        search: {
          // if we have a redirect in the search params, use it,
          // otherwise use the current location
          redirect: "redirect" in search ? search.redirect : location.href,
          loginOrgSlug: params.orgSlug,
        },
      });
    }
  },
  loader: async ({ params }) => {
    if ("orgSlug" in params && typeof params.orgSlug === "string") {
      const { data, response } = await apiClient.get("/orgs/{orgSlug}", {
        params: { path: { orgSlug: params.orgSlug } },
      });
      if (!response.ok) throw new Error(i18n.t(`errors.statusCode.${response.status}` as any));
      if (!data) throw new Error(i18n.t("errors.organizationNotFound"));
      return data;
    }
  },
});

function RouteComponent() {
  return (
    <AppSidebarProvider>
      <AppSideBar />
      <SidebarInset className="overflow-hidden">
        <OrgHeader />
        <Outlet />
      </SidebarInset>
    </AppSidebarProvider>
  );
}
