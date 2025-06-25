import { NavigationHeader } from "@/components/navigation-header";
import { OrgProvider } from "@/components/org-provider";
import { AppSideBar } from "@/components/sidebar";
import { SidebarProvider } from "@/shadcn/components/ui/sidebar";
import { createFileRoute, Outlet, redirect, useMatches } from "@tanstack/react-router";

export const Route = createFileRoute("/org")({
  component: Org,
  beforeLoad: async ({ context, location, search, params }) => {
    // redirect to login if not authenticated and not on the login page
    if (
      !context.auth.isAuthenticated &&
      "orgSlug" in params &&
      typeof params.orgSlug === "string" &&
      location.pathname !== `/org/${params.orgSlug}/login`
    ) {
      throw redirect({
        to: "/org/$orgSlug/login",
        params: { orgSlug: params.orgSlug },
        search: {
          // if we have a redirect in the search params, use it,
          // otherwise use the current location
          redirect: "redirect" in search ? search.redirect : location.href,
        },
      });
    }

    // redirect to home:
    //  - if authenticated and trying to access the login page
    //  - if authenticated and trying to access a route that requires a different role
    if (
      "orgSlug" in params &&
      typeof params.orgSlug === "string" &&
      ((context.auth.isAuthenticated && location.pathname === `/org/${params.orgSlug}/login`) ||
        (context.roleRequirement && context.auth.user?.role !== context.roleRequirement))
    ) {
      throw redirect({
        to: "/org/$orgSlug",
        params: { orgSlug: params.orgSlug },
      });
    }
  },
});

function Org() {
  const cookies = document.cookie.split("; ");
  const sidebarState = cookies.find((c) => c.startsWith("sidebar_state="))?.split("=")[1];
  const defaultOpen = sidebarState === "true";

  const matches = useMatches();

  const hideUi = matches.some((match) => match.context && match.context?.hideUI);
  return (
    <>
      <OrgProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          {!hideUi && <AppSideBar />}
          <div id="outlet-container" className="w-screen *:px-4 *:py-2 rounded-2xl m-2">
            {!hideUi && <NavigationHeader />}
            <Outlet />
          </div>
        </SidebarProvider>
      </OrgProvider>
    </>
  );
}
