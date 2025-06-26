import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider } from "@/shadcn/components/ui/sidebar";

import { NavigationHeader } from "@/components/navigation-header";
import { OrgProvider } from "@/components/org-provider";
import { AppSideBar } from "@/components/sidebar";

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
});

function Org() {
  const cookies = document.cookie.split("; ");
  const sidebarState = cookies.find((c) => c.startsWith("sidebar_state="))?.split("=")[1];
  const defaultOpen = sidebarState === "true";

  return (
    <>
      <OrgProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSideBar />
          <div id="sidebar-view" className="flex flex-col w-svw rounded-2xl my-2">
            <NavigationHeader />
            <Outlet />
          </div>
        </SidebarProvider>
      </OrgProvider>
    </>
  );
}
