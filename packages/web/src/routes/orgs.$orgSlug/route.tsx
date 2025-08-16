import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";
import { SidebarInset } from "@/shadcn/components/ui/sidebar.tsx";

import { NotFound404 } from "@/components/404.tsx";
import { OrgHeader } from "@/components/org-header.tsx";
import { AppSideBar } from "@/components/sidebar.tsx";
import i18n from "@/i18n.ts";
import { AppSidebarProvider } from "@/providers/sidebar.tsx";
import { trpcClient } from "@/trpc.ts";

export const Route = createFileRoute("/orgs/$orgSlug")({
  component: RouteComponent,
  notFoundComponent: () => <NotFound404 to="/orgs/$orgSlug" />,
  context: () => ({
    title: i18n.t("routes.home"),
    icon: HomeIcon,
  }),
  beforeLoad: ({ context, location, search, params }) => {
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
      const exists = await trpcClient.orgs.exists.query({ orgSlug: params.orgSlug });
      if (!exists) throw new Error(i18n.t("errors.organizationNotFound"));
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
