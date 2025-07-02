import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { SidebarInset } from "@/shadcn/components/ui/sidebar";

import { apiClient } from "@/api-client";
import { OrgHeader } from "@/components/org-header";
import { AppSideBar } from "@/components/sidebar";
import { AppSidebarProvider } from "@/providers/sidebar";

interface OrgSearch {
  redirect?: string;
}

export const Route = createFileRoute("/org")({
  component: Org,
  validateSearch: ({ search }) => search as OrgSearch,
  beforeLoad: async ({ context, location, search, params }) => {
    // redirect to login if not authenticated and not on the login page
    if (
      !context.auth.isAuthenticated &&
      location.pathname !== `/login` &&
      "orgSlug" in params &&
      typeof params.orgSlug === "string"
    ) {
      throw redirect({
        to: "/login",
        search: {
          // if we have a redirect in the search params, use it,
          // otherwise use the current location
          redirect: "redirect" in search ? search.redirect : location.href,
          orgSlug: params.orgSlug,
        },
      });
    }
  },
  loader: async ({ params }) => {
    if ("orgSlug" in params && typeof params.orgSlug === "string") {
      const { data, error } = await apiClient.get("/org/{orgSlug}", {
        params: { path: { orgSlug: params.orgSlug } },
      });
      if (error) throw notFound();
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
