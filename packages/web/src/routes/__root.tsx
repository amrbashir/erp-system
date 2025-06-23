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
import type { UserEntity } from "@tech-zone-store/sdk/zod";
import { z } from "zod";
import { Toaster } from "@/shadcn/components/ui/sonner";

interface RouterContext {
  auth: AuthContext;
  title: string;
  icon?: React.ComponentType;
  requirement?: z.infer<typeof UserEntity>["role"];
  hideUI?: boolean;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context, location }) => {
    // redirect to login if not authenticated and trying to access a protected route
    if (
      !context.auth.isAuthenticated &&
      location.pathname !== "/login" &&
      context.requirement !== null
    ) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    if (
      // redirect to home if authenticated and trying to access the login page
      (context.auth.isAuthenticated && location.pathname === "/login") ||
      // redirect to home if authenticated and trying to access a route that requires a different role
      (context.requirement && context.auth.user?.role !== context.requirement)
    ) {
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
    const matchWithTitle = [...matches].reverse().find((match) => match.context?.title);
    const title = matchWithTitle?.context.title;

    const { t, i18n } = useTranslation("translation");
    useEffect(() => void (document.documentElement.dir = i18n.dir()), [i18n.language]);

    const hideUi = matches.some(
      (match) => match.context && "hideUI" in match.context && match.context?.hideUI,
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

            <Toaster />
          </ThemeProvider>
        </DirectionProvider>
      </>
    );
  },
});
