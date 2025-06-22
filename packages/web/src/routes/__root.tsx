import { SidebarProvider } from "@/shadcn/components/ui/sidebar";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  redirect,
  useMatches,
} from "@tanstack/react-router";
import { AppSideBar } from "@/components/sidebar";
import { NavigationHeader } from "@/components/navigation-header";
import { ThemeProvider } from "@/components/theme-provider";
import { useTranslation } from "react-i18next";
import type { AuthContext } from "@/auth";
import { DirectionProvider } from "@radix-ui/react-direction";
import { useEffect } from "react";

interface RouterContext {
  auth: AuthContext;
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

    const { t, i18n } = useTranslation("translation");
    useEffect(() => void (document.documentElement.dir = i18n.dir()), [i18n.language]);

    const hideUi = matches.some(
      (match) => match.loaderData && "hideUI" in match.loaderData && match.loaderData?.hideUI,
    );

    return (
      <>
        <head>
          <HeadContent />
          <title>{title + " | " + t("tech_zone")}</title>
        </head>

        <DirectionProvider dir={i18n.dir()}>
          <ThemeProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
              {!hideUi && <AppSideBar />}
              <div id="outlet-container" className="w-screen *:px-4 *:py-2 rounded-2xl m-2">
                {!hideUi && <NavigationHeader />}
                <Outlet />
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </DirectionProvider>
      </>
    );
  },
});
