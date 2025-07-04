import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarInset } from "@/shadcn/components/ui/sidebar";

import { apiClient } from "@/api-client";
import { OrgHeader } from "@/components/org-header";
import { AppSideBar } from "@/components/sidebar";
import i18n from "@/i18n";
import { AppSidebarProvider } from "@/providers/sidebar";

interface OrgSearch {
  redirect?: string;
}

export const Route = createFileRoute("/org/$orgSlug")({
  component: Org,
  validateSearch: ({ search }) => search as OrgSearch,
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
      const { data } = await apiClient.get("/org/{orgSlug}", {
        params: { path: { orgSlug: params.orgSlug } },
      });
      if (!data) throw new Error(i18n.t("errors.organizationNotFound"));
      return data;
    }
  },
});

function Org() {
  return (
    <AppSidebarProvider>
      <AppSideBar />
      <SidebarInset>
        <OrgHeader />
        <Outlet />
      </SidebarInset>
    </AppSidebarProvider>
  );
}
