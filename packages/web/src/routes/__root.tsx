import { SidebarProvider } from "@/shadcn/components/ui/sidebar";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  redirect,
  useMatches,
} from "@tanstack/react-router";
import { AppSideBar } from "@/components/app-sidebar";
import { NavigationHeader } from "@/components/navigation-header";
import { ThemeProvider } from "@/components/theme-provider";
import { useTranslation } from "react-i18next";
import type { AuthContext } from "../auth";

interface RouterContext {
  auth: AuthContext;
  hideUI?: boolean;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context, location }) => {
    // redirect to login if not authenticated and trying to access a protected route
    if (!context.auth.isAuthenticated && location.pathname !== "/login") {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    // redirect to home if authenticated and trying to access the login page
    if (context.auth.isAuthenticated && location.pathname === "/login") {
      throw redirect({
        to: "/",
      });
    }
  },

  component: () => {
    const cookies = document.cookie.split("; ");
    const sidebarState = cookies.find((c) => c.startsWith("sidebar_state="))?.split("=")[1];
    const defaultOpen = sidebarState === "true";

    const matches = useMatches();
    const matchWithTitle = [...matches].reverse().find((match) => match.loaderData?.title);
    const title = matchWithTitle?.loaderData?.title;

    const { t } = useTranslation("translation");

    const hideUi = matches.some((match) => match.context?.hideUI);

    return (
      <>
        <head>
          <HeadContent />
          <title>{title + " | " + t("tech_zone")}</title>
        </head>

        <ThemeProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            {!hideUi && <AppSideBar />}
            <main className="w-full h-full *:px-4 *:py-2">
              {!hideUi && <NavigationHeader />}
              <Outlet />
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </>
    );
  },
});
